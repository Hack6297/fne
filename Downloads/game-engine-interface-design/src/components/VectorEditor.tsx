import React, { useState, useRef, useCallback } from 'react';
import { VectorShape, ViewportObject, VectorPoint } from '../types';

interface Props {
  object: ViewportObject;
  onSave: (shapes: VectorShape[]) => void;
  onClose: () => void;
}

type VTool = 'select' | 'rect' | 'circle' | 'line' | 'path' | 'text' | 'eraser' | 'rotate' | 'slice';

const VectorEditor: React.FC<Props> = ({ object, onSave, onClose }) => {
  const [shapes, setShapes] = useState<VectorShape[]>(object.vectorShapes || []);
  const [tool, setTool] = useState<VTool>('select');
  const [fill, setFill] = useState(object.color || '#4C97FF');
  const [stroke, setStroke] = useState('#000000');
  const [strokeW, setStrokeW] = useState(2);
  const [selIdx, setSelIdx] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [pathPoints, setPathPoints] = useState<VectorPoint[]>([]);
  const [draggingPoint, setDraggingPoint] = useState<{ shapeIdx: number; pointIdx: number; type: 'main' | 'c1' | 'c2' } | null>(null);
  const [dragShape, setDragShape] = useState<{ idx: number; offX: number; offY: number } | null>(null);
  const [rotateStart, setRotateStart] = useState<{ idx: number; startAngle: number; origRotation: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const CW = 300, CH = 300;

  const getPos = (e: React.MouseEvent) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const handleDown = useCallback((e: React.MouseEvent) => {
    const { x, y } = getPos(e);

    if (tool === 'select') {
      for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        if (s.type === 'rect' && x >= s.x && x <= s.x + (s.width || 0) && y >= s.y && y <= s.y + (s.height || 0)) {
          setSelIdx(i);
          setDragShape({ idx: i, offX: x - s.x, offY: y - s.y });
          return;
        }
        if (s.type === 'circle' && Math.hypot(x - s.x, y - s.y) < (s.radius || 10)) {
          setSelIdx(i);
          setDragShape({ idx: i, offX: x - s.x, offY: y - s.y });
          return;
        }
        if (s.type === 'path' && s.points) {
          for (let pi = 0; pi < s.points.length; pi++) {
            const p = s.points[pi];
            if (Math.hypot(x - p.x, y - p.y) < 6) {
              setSelIdx(i);
              setDraggingPoint({ shapeIdx: i, pointIdx: pi, type: 'main' });
              return;
            }
            if (p.cx1 !== undefined && p.cy1 !== undefined && Math.hypot(x - p.cx1, y - p.cy1) < 6) {
              setDraggingPoint({ shapeIdx: i, pointIdx: pi, type: 'c1' });
              return;
            }
            if (p.cx2 !== undefined && p.cy2 !== undefined && Math.hypot(x - p.cx2, y - p.cy2) < 6) {
              setDraggingPoint({ shapeIdx: i, pointIdx: pi, type: 'c2' });
              return;
            }
          }
        }
      }
      setSelIdx(null);
      return;
    }

    if (tool === 'rotate' && selIdx !== null) {
      const s = shapes[selIdx];
      const cx = s.type === 'rect' ? s.x + (s.width || 0) / 2 : s.x;
      const cy = s.type === 'rect' ? s.y + (s.height || 0) / 2 : s.y;
      const angle = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
      setRotateStart({ idx: selIdx, startAngle: angle, origRotation: s.rotation || 0 });
      return;
    }

    if (tool === 'eraser') {
      for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        if (s.type === 'rect' && x >= s.x && x <= s.x + (s.width || 0) && y >= s.y && y <= s.y + (s.height || 0)) {
          setShapes(p => p.filter((_, idx) => idx !== i)); return;
        }
        if (s.type === 'circle' && Math.hypot(x - s.x, y - s.y) < (s.radius || 10)) {
          setShapes(p => p.filter((_, idx) => idx !== i)); return;
        }
      }
      return;
    }

    if (tool === 'slice' && selIdx !== null) {
      const s = shapes[selIdx];
      if (s.type === 'rect') {
        const relX = x - s.x;
        const w = s.width || 50;
        if (relX > 5 && relX < w - 5) {
          const left: VectorShape = { ...s, width: relX };
          const right: VectorShape = { ...s, x: s.x + relX, width: w - relX };
          setShapes(p => [...p.filter((_, i) => i !== selIdx), left, right]);
          setSelIdx(null);
        }
      }
      return;
    }

    if (tool === 'text') {
      const text = prompt('Enter text:', 'Hello');
      if (text) setShapes(p => [...p, { type: 'text', x, y, fill, stroke, strokeWidth: 0, text }]);
      return;
    }

    if (tool === 'path') {
      if (pathPoints.length > 0 && Math.hypot(x - pathPoints[0].x, y - pathPoints[0].y) < 10 && pathPoints.length >= 3) {
        setShapes(p => [...p, { type: 'path', x: 0, y: 0, fill, stroke, strokeWidth: strokeW, points: [...pathPoints] }]);
        setPathPoints([]);
      } else {
        const newPoint: VectorPoint = { x, y };
        if (e.shiftKey && pathPoints.length > 0) {
          const prev = pathPoints[pathPoints.length - 1];
          const mx = (prev.x + x) / 2;
          const my = (prev.y + y) / 2 - 30;
          newPoint.cx1 = mx;
          newPoint.cy1 = my;
          newPoint.cx2 = mx;
          newPoint.cy2 = my;
        }
        setPathPoints(p => [...p, newPoint]);
      }
      return;
    }

    setIsDrawing(true);
    setStartPos({ x, y });
  }, [tool, shapes, fill, stroke, strokeW, selIdx, pathPoints]);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = getPos(e);

    if (dragShape) {
      setShapes(p => p.map((s, i) => i === dragShape.idx ? { ...s, x: x - dragShape.offX, y: y - dragShape.offY } : s));
      return;
    }

    if (draggingPoint) {
      setShapes(p => p.map((s, i) => {
        if (i !== draggingPoint.shapeIdx || !s.points) return s;
        const pts = [...s.points];
        const pt = { ...pts[draggingPoint.pointIdx] };
        if (draggingPoint.type === 'main') { pt.x = x; pt.y = y; }
        else if (draggingPoint.type === 'c1') { pt.cx1 = x; pt.cy1 = y; }
        else if (draggingPoint.type === 'c2') { pt.cx2 = x; pt.cy2 = y; }
        pts[draggingPoint.pointIdx] = pt;
        return { ...s, points: pts };
      }));
      return;
    }

    if (rotateStart) {
      const s = shapes[rotateStart.idx];
      const cx = s.type === 'rect' ? s.x + (s.width || 0) / 2 : s.x;
      const cy = s.type === 'rect' ? s.y + (s.height || 0) / 2 : s.y;
      const angle = Math.atan2(y - cy, x - cx) * 180 / Math.PI;
      const delta = angle - rotateStart.startAngle;
      setShapes(p => p.map((sh, i) => i === rotateStart.idx ? { ...sh, rotation: rotateStart.origRotation + delta } : sh));
    }
  }, [dragShape, draggingPoint, rotateStart, shapes]);

  const handleUp = useCallback((e: React.MouseEvent) => {
    if (dragShape) { setDragShape(null); return; }
    if (draggingPoint) { setDraggingPoint(null); return; }
    if (rotateStart) { setRotateStart(null); return; }
    if (!isDrawing) return;
    const { x, y } = getPos(e);

    if (tool === 'rect') {
      const w = Math.abs(x - startPos.x), h = Math.abs(y - startPos.y);
      if (w > 3 && h > 3) setShapes(p => [...p, { type: 'rect', x: Math.min(startPos.x, x), y: Math.min(startPos.y, y), width: w, height: h, fill, stroke, strokeWidth: strokeW }]);
    } else if (tool === 'circle') {
      const r = Math.hypot(x - startPos.x, y - startPos.y);
      if (r > 3) setShapes(p => [...p, { type: 'circle', x: startPos.x, y: startPos.y, radius: r, fill, stroke, strokeWidth: strokeW }]);
    } else if (tool === 'line') {
      setShapes(p => [...p, { type: 'line', x: startPos.x, y: startPos.y, width: x - startPos.x, height: y - startPos.y, fill: 'none', stroke, strokeWidth: strokeW || 2 }]);
    }
    setIsDrawing(false);
  }, [isDrawing, tool, startPos, fill, stroke, strokeW]);

  const tools: { id: VTool; icon: string; label: string }[] = [
    { id: 'select', icon: '↖', label: 'Select/Drag' },
    { id: 'rect', icon: '▬', label: 'Rectangle' },
    { id: 'circle', icon: '●', label: 'Circle' },
    { id: 'line', icon: '╱', label: 'Line' },
    { id: 'path', icon: '✎', label: 'Pen/Curve' },
    { id: 'text', icon: 'T', label: 'Text' },
    { id: 'rotate', icon: '↻', label: 'Rotate' },
    { id: 'slice', icon: '✂', label: 'Slice' },
    { id: 'eraser', icon: '⌫', label: 'Erase' },
  ];

  const PALETTE = ['#E74C3C','#3498DB','#2ECC71','#F1C40F','#9B59B6','#E67E22','#1ABC9C','#ECF0F1','#2C3E50','#FF6B9D','#000000','#FFFFFF','#FF9F43','#00CED1','#8B4513','#FF69B4'];

  const buildPathD = (pts: VectorPoint[]) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i];
      if (p.cx1 !== undefined && p.cy1 !== undefined) {
        d += ` C ${p.cx1} ${p.cy1}, ${p.cx2 ?? p.cx1} ${p.cy2 ?? p.cy1}, ${p.x} ${p.y}`;
      } else {
        d += ` L ${p.x} ${p.y}`;
      }
    }
    return d;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="aero-modal flex flex-col" style={{ width: 650, height: 520 }}>
        <div className="aero-titlebar" style={{ borderRadius: '8px 8px 0 0' }}>
          <span style={{ fontSize: 14 }}>🎨</span>
          <span className="aero-titlebar-text flex-1">Vector Editor — {object.name}</span>
          <div className="flex gap-1">
            <div className="win7-minmax">─</div>
            <div className="win7-close" onClick={onClose}>✕</div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Tools */}
          <div className="flex flex-col w-[72px] border-r border-gray-300 p-1.5 gap-0.5" style={{ background: '#e8eaec' }}>
            {tools.map(t => (
              <button key={t.id}
                className={`flex flex-col items-center gap-0 p-1 rounded text-[9px] cursor-pointer ${tool === t.id ? 'bg-blue-100 border border-blue-400' : 'hover:bg-gray-200 border border-transparent'}`}
                onClick={() => setTool(t.id)}
                style={{ color: '#333' }}
              >
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
            <div className="border-t border-gray-300 mt-1 pt-1">
              <div className="text-gray-500 text-[8px] uppercase mb-1 text-center">Fill</div>
              <div className="flex flex-wrap gap-0.5 justify-center">
                {PALETTE.slice(0, 8).map(c => (
                  <button key={c} className="w-3 h-3 rounded-sm cursor-pointer" style={{ background: c, border: fill === c ? '2px solid #333' : '1px solid #999' }} onClick={() => setFill(c)} />
                ))}
              </div>
              <div className="text-gray-500 text-[8px] uppercase mb-1 mt-1 text-center">Stroke</div>
              <div className="flex flex-wrap gap-0.5 justify-center">
                {PALETTE.slice(8, 16).map(c => (
                  <button key={c} className="w-3 h-3 rounded-sm cursor-pointer" style={{ background: c, border: stroke === c ? '2px solid #333' : '1px solid #999' }} onClick={() => setStroke(c)} />
                ))}
              </div>
              <div className="text-gray-500 text-[8px] mt-1 text-center">Width</div>
              <input type="range" min="0" max="8" step="1" value={strokeW} onChange={e => setStrokeW(Number(e.target.value))} className="w-full" />
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center p-3" style={{ background: '#f0f2f4' }}>
            <div
              ref={canvasRef}
              className="relative"
              style={{
                width: CW, height: CH, background: 'white',
                backgroundImage: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                backgroundSize: '10px 10px', backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                borderRadius: 4, border: '1px solid #999',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)',
                cursor: tool === 'path' ? 'crosshair' : tool === 'rotate' ? 'grab' : tool === 'slice' ? 'col-resize' : 'crosshair',
              }}
              onMouseDown={handleDown}
              onMouseMove={handleMove}
              onMouseUp={handleUp}
            >
              <svg width={CW} height={CH} className="absolute inset-0">
                {shapes.map((s, i) => {
                  const sel = selIdx === i;
                  const rot = s.rotation ? `rotate(${s.rotation} ${s.type === 'rect' ? (s.x + (s.width || 0) / 2) : s.x} ${s.type === 'rect' ? (s.y + (s.height || 0) / 2) : s.y})` : undefined;
                  if (s.type === 'rect') return <rect key={i} x={s.x} y={s.y} width={s.width} height={s.height} fill={s.fill} stroke={sel ? '#4a90d9' : s.stroke} strokeWidth={sel ? 3 : s.strokeWidth} rx={2} transform={rot} />;
                  if (s.type === 'circle') return <circle key={i} cx={s.x} cy={s.y} r={s.radius} fill={s.fill} stroke={sel ? '#4a90d9' : s.stroke} strokeWidth={sel ? 3 : s.strokeWidth} transform={rot} />;
                  if (s.type === 'line') return <line key={i} x1={s.x} y1={s.y} x2={s.x + (s.width || 0)} y2={s.y + (s.height || 0)} stroke={sel ? '#4a90d9' : s.stroke} strokeWidth={sel ? 3 : s.strokeWidth} strokeLinecap="round" />;
                  if (s.type === 'text') return <text key={i} x={s.x} y={s.y} fill={s.fill} fontSize={16} fontWeight="bold">{s.text}</text>;
                  if (s.type === 'path' && s.points) {
                    return (
                      <g key={i}>
                        <path d={buildPathD(s.points)} fill={s.fill === 'none' ? 'none' : s.fill} stroke={sel ? '#4a90d9' : s.stroke} strokeWidth={sel ? 3 : s.strokeWidth} fillRule="evenodd" />
                        {sel && s.points.map((p, pi) => (
                          <g key={pi}>
                            <circle cx={p.x} cy={p.y} r={4} fill="#4a90d9" stroke="#fff" strokeWidth={1} style={{ cursor: 'move' }} />
                            {p.cx1 !== undefined && p.cy1 !== undefined && (
                              <>
                                <line x1={p.x} y1={p.y} x2={p.cx1} y2={p.cy1} stroke="#999" strokeWidth={1} strokeDasharray="3" />
                                <circle cx={p.cx1} cy={p.cy1} r={3} fill="#ff6b6b" stroke="#fff" strokeWidth={1} style={{ cursor: 'move' }} />
                              </>
                            )}
                            {p.cx2 !== undefined && p.cy2 !== undefined && (
                              <>
                                <line x1={p.x} y1={p.y} x2={p.cx2} y2={p.cy2} stroke="#999" strokeWidth={1} strokeDasharray="3" />
                                <circle cx={p.cx2} cy={p.cy2} r={3} fill="#6bff6b" stroke="#fff" strokeWidth={1} style={{ cursor: 'move' }} />
                              </>
                            )}
                          </g>
                        ))}
                      </g>
                    );
                  }
                  return null;
                })}
                {/* Path being drawn */}
                {pathPoints.length > 0 && (
                  <g>
                    <path d={buildPathD(pathPoints)} fill="none" stroke="#4a90d9" strokeWidth={2} strokeDasharray="4" />
                    {pathPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#4a90d9" />)}
                    {pathPoints.length >= 3 && <circle cx={pathPoints[0].x} cy={pathPoints[0].y} r={6} fill="none" stroke="#ff6b6b" strokeWidth={2} />}
                  </g>
                )}
              </svg>
              <div className="absolute bottom-1 left-1 text-[8px] text-gray-400">
                {tool === 'path' ? 'Click to add points · Shift+click for curve · Click first point to close' : 
                 tool === 'rotate' ? 'Click+drag to rotate selected' : 
                 tool === 'slice' ? 'Click on rect to split' : ''}
              </div>
            </div>
          </div>

          {/* Shapes list */}
          <div className="w-[110px] border-l border-gray-300 p-2 text-[10px] overflow-y-auto" style={{ background: '#e8eaec' }}>
            <div className="text-gray-500 uppercase tracking-wider mb-2 font-semibold">Shapes</div>
            {shapes.map((s, i) => (
              <div key={i} className={`flex items-center gap-1 px-1 py-0.5 rounded cursor-pointer mb-0.5 ${selIdx === i ? 'bg-blue-100 border border-blue-400' : 'hover:bg-gray-200'}`} onClick={() => setSelIdx(i)}>
                <span>{s.type === 'rect' ? '▬' : s.type === 'circle' ? '●' : s.type === 'line' ? '╱' : s.type === 'path' ? '✎' : 'T'}</span>
                <span className="capitalize text-gray-600">{s.type}</span>
                <button className="ml-auto text-red-500 hover:text-red-700 text-[8px]" onClick={(e) => { e.stopPropagation(); setShapes(p => p.filter((_, idx) => idx !== i)); setSelIdx(null); }}>✕</button>
              </div>
            ))}
            {shapes.length === 0 && <div className="text-gray-300 text-center py-4">No shapes</div>}

            {selIdx !== null && shapes[selIdx] && (
              <div className="mt-2 pt-2 border-t border-gray-300 space-y-1">
                <div className="text-gray-500 font-semibold">Selected</div>
                <div className="flex gap-1">
                  <div>
                    <label className="text-gray-400 text-[8px]">X</label>
                    <input type="number" className="w-full border border-gray-300 rounded px-1 py-0.5 text-[9px]" value={Math.round(shapes[selIdx].x)} onChange={e => setShapes(p => p.map((s, i) => i === selIdx ? { ...s, x: +e.target.value } : s))} />
                  </div>
                  <div>
                    <label className="text-gray-400 text-[8px]">Y</label>
                    <input type="number" className="w-full border border-gray-300 rounded px-1 py-0.5 text-[9px]" value={Math.round(shapes[selIdx].y)} onChange={e => setShapes(p => p.map((s, i) => i === selIdx ? { ...s, y: +e.target.value } : s))} />
                  </div>
                </div>
                <div>
                  <label className="text-gray-400 text-[8px]">Rotation</label>
                  <input type="number" className="w-full border border-gray-300 rounded px-1 py-0.5 text-[9px]" value={Math.round(shapes[selIdx].rotation || 0)} onChange={e => setShapes(p => p.map((s, i) => i === selIdx ? { ...s, rotation: +e.target.value } : s))} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-300" style={{ background: '#e8eaec' }}>
          <div className="flex gap-2">
            <button className="win7-btn text-[10px]" onClick={() => setShapes([])}>Clear All</button>
            <span className="text-gray-400 text-[10px]">{shapes.length} shapes</span>
          </div>
          <div className="flex gap-2">
            <button className="win7-btn text-[10px]" onClick={onClose}>Cancel</button>
            <button className="win7-btn text-[10px] font-bold" style={{ background: 'linear-gradient(180deg, #8bc34a 0%, #689f38 100%)', color: '#fff', border: '1px solid #558b2f' }} onClick={() => { onSave(shapes); onClose(); }}>
              ✓ Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VectorEditor;
