import React, { useState, useCallback, useRef } from 'react';
import { ViewportObject, SPRITE_LIBRARY } from '../types';
import { EngineState } from '../engine/ScriptEngine';

interface Props {
  objects: ViewportObject[];
  setObjects: React.Dispatch<React.SetStateAction<ViewportObject[]>>;
  selectedObject: string | null;
  setSelectedObject: (id: string) => void;
  isPlaying: boolean;
  engineState: EngineState;
  frameCount: number;
  sceneScroll: { x: number; y: number };
  setSceneScroll: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  sceneBg: string | null;
  onSpriteClick?: (spriteId: string) => void;
}

// Frutiger Aero buddy: ball head on capsule body, arms, no eyes, no white overlay
var AeroPlayer = function({ obj, frame }: { obj: ViewportObject; frame: number }) {
  var facing = obj.facingRight !== false;
  var bob = obj.isGrounded ? Math.sin(frame * 0.12) * 1.5 : 0;
  var moving = Math.abs(obj.vx || 0) > 0.5;
  var legA = moving ? Math.sin(frame * 0.4) * 22 : 0;
  var armA = moving ? Math.sin(frame * 0.35) * 25 : -5;
  var w = obj.width, h = obj.height;
  var c = obj.color;
  var scaleX = facing ? 1 : -1;

  return (
    <div style={{ width: w, height: h, position: 'relative', transform: 'translateY(' + bob + 'px)', opacity: obj.opacity != null ? obj.opacity : 1 }}>
      {/* Shadow */}
      <div style={{ position: 'absolute', bottom: -3, left: '15%', width: '70%', height: 5, background: 'radial-gradient(ellipse, rgba(0,0,0,0.25), transparent)', borderRadius: '50%' }} />
      {/* Left leg */}
      <div style={{ position: 'absolute', bottom: 2, left: '30%', width: 7, height: 14, background: 'linear-gradient(180deg, ' + c + 'dd, ' + c + '88)', borderRadius: '0 0 5px 5px', transform: 'rotate(' + legA + 'deg)', transformOrigin: 'top center' }} />
      {/* Right leg */}
      <div style={{ position: 'absolute', bottom: 2, right: '30%', width: 7, height: 14, background: 'linear-gradient(180deg, ' + c + 'dd, ' + c + '88)', borderRadius: '0 0 5px 5px', transform: 'rotate(' + (-legA) + 'deg)', transformOrigin: 'top center' }} />
      {/* Body — glossy capsule */}
      <div style={{
        position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%) scaleX(' + scaleX + ')',
        width: w * 0.6, height: h * 0.42,
        background: 'linear-gradient(180deg, ' + c + 'ee 0%, ' + c + 'bb 60%, ' + c + '88 100%)',
        borderRadius: '35% 35% 30% 30%',
        border: '2px solid ' + c + '99',
        boxShadow: 'inset 0 -4px 8px rgba(0,0,0,0.15), inset 0 4px 8px rgba(255,255,255,0.35), 0 2px 8px rgba(0,0,0,0.2)',
      }}>
        <div style={{ position: 'absolute', top: 3, left: '15%', width: '70%', height: '35%', background: 'linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0.05))', borderRadius: '50%' }} />
      </div>
      {/* Left arm */}
      <div style={{ position: 'absolute', bottom: 20, left: -2, width: 6, height: 14, background: 'linear-gradient(90deg, ' + c + 'aa, ' + c + 'dd)', borderRadius: 5, transform: 'scaleX(' + scaleX + ') rotate(' + armA + 'deg)', transformOrigin: 'top center' }} />
      {/* Right arm */}
      <div style={{ position: 'absolute', bottom: 20, right: -2, width: 6, height: 14, background: 'linear-gradient(90deg, ' + c + 'dd, ' + c + 'aa)', borderRadius: 5, transform: 'scaleX(' + scaleX + ') rotate(' + (-armA) + 'deg)', transformOrigin: 'top center' }} />
      {/* Head — ball on top, NO eyes, just a subtle smile */}
      <div style={{
        position: 'absolute', bottom: h * 0.48, left: '50%',
        transform: 'translateX(-50%) scaleX(' + scaleX + ')',
        width: w * 0.55, height: w * 0.55,
        background: 'radial-gradient(circle at 40% 30%, ' + c + 'ff, ' + c + 'cc 50%, ' + c + '99 100%)',
        borderRadius: '50%',
        border: '2px solid ' + c + '88',
        boxShadow: 'inset -3px -3px 8px rgba(0,0,0,0.1), inset 3px 3px 8px rgba(255,255,255,0.4), 0 2px 6px rgba(0,0,0,0.2)',
      }}>
        {/* Glass highlight on head */}
        <div style={{ position: 'absolute', top: '12%', left: '20%', width: '50%', height: '35%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.5), transparent)', borderRadius: '50%' }} />
        {/* Smile */}
        <div style={{ position: 'absolute', bottom: '22%', left: '50%', transform: 'translateX(-50%)', width: 9, height: 4, borderRadius: '0 0 8px 8px', border: '1.5px solid ' + c + '66', borderTop: 'none' }} />
      </div>
      {/* Name label */}
      <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: '#555', background: 'rgba(255,255,255,0.7)', padding: '0px 4px', borderRadius: 3, whiteSpace: 'nowrap', fontWeight: 600 }}>{obj.name}</div>
    </div>
  );
};

var PhysBall = function({ obj }: { obj: ViewportObject }) {
  return (
    <div style={{
      width: obj.width, height: obj.height, borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 30%, ' + obj.color + 'ff, ' + obj.color + 'cc 40%, ' + obj.color + '66 100%)',
      border: '2px solid ' + obj.color + 'cc',
      boxShadow: 'inset -3px -3px 6px rgba(0,0,0,0.25), inset 3px 3px 6px rgba(255,255,255,0.35), 0 3px 8px rgba(0,0,0,0.3)',
      transform: 'rotate(' + ((obj.rotation || 0) + (obj.vx || 0) * 5) + 'deg)', position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: '15%', left: '25%', width: '40%', height: '30%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.5), transparent)', borderRadius: '50%' }} />
    </div>
  );
};

var renderObj = function(obj: ViewportObject) {
  switch (obj.type) {
    case 'cube':
      return (
        <div style={{
          width: obj.width, height: obj.height,
          background: obj.customTexture ? 'url(' + obj.customTexture + ')' : obj.customImage ? 'url(' + obj.customImage + ')' : 'linear-gradient(135deg, ' + obj.color + 'cc, ' + obj.color + '88 50%, ' + obj.color + '66)',
          backgroundSize: 'cover', border: '2px solid ' + obj.color, borderRadius: 3,
          boxShadow: '4px 4px 0 ' + obj.color + '44, inset -2px -2px 4px rgba(0,0,0,0.2), inset 2px 2px 4px rgba(255,255,255,0.15)',
          transform: 'rotate(' + (obj.rotation || 0) + 'deg)', position: 'relative', overflow: 'hidden',
        }}>
          {obj.vectorShapes && obj.vectorShapes.length > 0 && (
            <svg width={obj.width} height={obj.height} style={{ position: 'absolute', inset: 0 }}>
              {obj.vectorShapes.map(function(s, i) {
                var sx = (s.x / 300) * obj.width;
                var sy = (s.y / 300) * obj.height;
                if (s.type === 'rect') return <rect key={i} x={sx} y={sy} width={(s.width || 0) / 300 * obj.width} height={(s.height || 0) / 300 * obj.height} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} rx={2} />;
                if (s.type === 'circle') return <circle key={i} cx={sx} cy={sy} r={(s.radius || 0) / 300 * Math.min(obj.width, obj.height)} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} />;
                if (s.type === 'text') return <text key={i} x={sx} y={sy} fill={s.fill} fontSize={10}>{s.text}</text>;
                return null;
              })}
            </svg>
          )}
        </div>
      );
    case 'sphere':
      return <div style={{ width: obj.width, height: obj.height, background: 'radial-gradient(circle at 35% 35%, ' + obj.color + 'ee, ' + obj.color + '88 50%, ' + obj.color + '44 100%)', border: '2px solid ' + obj.color, borderRadius: '50%', boxShadow: '3px 3px 8px rgba(0,0,0,0.3)' }} />;
    case 'plane':
      return <div style={{ width: obj.width, height: obj.height, background: obj.customTexture ? 'url(' + obj.customTexture + ')' : 'linear-gradient(180deg, ' + obj.color + 'cc, ' + obj.color + '88)', backgroundSize: 'cover', border: '2px solid ' + obj.color, borderRadius: 2, boxShadow: '0 4px 0 ' + obj.color + '44', transform: 'perspective(200px) rotateX(15deg)' }} />;
    case 'ramp':
      return (
        <div style={{ width: obj.width, height: obj.height, position: 'relative' }}>
          <svg width={obj.width} height={obj.height} style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <linearGradient id={'rg-' + obj.id} x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor={obj.color + 'cc'} />
                <stop offset="100%" stopColor={obj.color + '88'} />
              </linearGradient>
            </defs>
            <polygon points={'0,' + obj.height + ' ' + obj.width + ',0 ' + obj.width + ',' + obj.height} fill={'url(#rg-' + obj.id + ')'} stroke={obj.color} strokeWidth={2} />
            <line x1={0} y1={obj.height} x2={obj.width} y2={0} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
          </svg>
        </div>
      );
    case 'cylinder':
      return <div style={{ width: obj.width, height: obj.height, background: 'linear-gradient(90deg, ' + obj.color + '66, ' + obj.color + 'cc 30%, ' + obj.color + 'ee 50%, ' + obj.color + 'cc 70%, ' + obj.color + '66)', border: '2px solid ' + obj.color, borderRadius: (obj.width / 4) + 'px / ' + (obj.width / 2) + 'px' }} />;
    case 'trigger':
      return <div style={{ width: obj.width, height: obj.height, background: 'repeating-linear-gradient(45deg, ' + obj.color + '22, ' + obj.color + '22 5px, ' + obj.color + '11 5px, ' + obj.color + '11 10px)', border: '2px dashed ' + obj.color + '88', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: obj.color + 'cc' }}>TRIGGER</div>;
    default:
      return <div style={{ width: obj.width, height: obj.height, background: obj.color, borderRadius: 4 }} />;
  }
};

var Viewport2D5: React.FC<Props> = function({ objects, setObjects, selectedObject, setSelectedObject, isPlaying, engineState, frameCount, sceneScroll, setSceneScroll, sceneBg, onSpriteClick }) {
  var ref = useRef<HTMLDivElement>(null);
  var [isDragging, setIsDragging] = useState(false);
  var [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  var [isPanning, setIsPanning] = useState(false);
  var [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Camera: in play mode follows player, in edit mode uses sceneScroll
  var camX = isPlaying ? engineState.cameraX : -sceneScroll.x;
  var camY = isPlaying ? engineState.cameraY : -sceneScroll.y;

  var handleObjDown = useCallback(function(e: React.MouseEvent, id: string) {
    e.stopPropagation();

    if (isPlaying) {
      // Trigger "when this sprite clicked" event
      if (onSpriteClick) onSpriteClick(id);
      return;
    }

    setSelectedObject(id);
    setIsDragging(true);

    // Calculate offset from sprite position to mouse — FIXED: account for viewport position and camera
    var rect = ref.current ? ref.current.getBoundingClientRect() : { left: 0, top: 0 };
    var obj = objects.find(function(o) { return o.id === id; });
    if (obj) {
      var mouseXInScene = e.clientX - rect.left + camX;
      var mouseYInScene = e.clientY - rect.top + camY;
      setDragOffset({ x: mouseXInScene - obj.x, y: mouseYInScene - obj.y });
    }
  }, [objects, setSelectedObject, isPlaying, camX, camY, onSpriteClick]);

  var handleMove = useCallback(function(e: React.MouseEvent) {
    if (isPanning) {
      var dx = e.clientX - panStart.x;
      var dy = e.clientY - panStart.y;
      setSceneScroll(function(p) { return { x: p.x + dx, y: p.y + dy }; });
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    if (!isDragging || !selectedObject || isPlaying) return;

    // Convert mouse to scene coordinates — FIXED dragging
    var rect = ref.current ? ref.current.getBoundingClientRect() : { left: 0, top: 0 };
    var mouseXInScene = e.clientX - rect.left + camX;
    var mouseYInScene = e.clientY - rect.top + camY;
    var newX = mouseXInScene - dragOffset.x;
    var newY = mouseYInScene - dragOffset.y;

    setObjects(function(prev) {
      return prev.map(function(o) {
        return o.id === selectedObject ? { ...o, x: newX, y: newY } : o;
      });
    });
  }, [isDragging, selectedObject, dragOffset, setObjects, isPlaying, isPanning, panStart, setSceneScroll, camX, camY]);

  var handleUp = useCallback(function() { setIsDragging(false); setIsPanning(false); }, []);

  var handleBgDown = useCallback(function(e: React.MouseEvent) {
    if (e.button === 1 || e.altKey) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, []);

  var getSpriteEmoji = function(obj: ViewportObject) {
    if (obj.spriteLibraryId) {
      var lib = SPRITE_LIBRARY.find(function(s) { return s.id === obj.spriteLibraryId; });
      if (lib) return lib.icon;
    }
    return null;
  };

  return (
    <div
      ref={ref}
      className="viewport-grid"
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#fff', cursor: isPlaying ? 'default' : isPanning ? 'grabbing' : 'crosshair' }}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      onMouseDown={handleBgDown}
    >
      {/* Background image */}
      {sceneBg && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(' + sceneBg + ')',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0,
          opacity: 0.7,
        }} />
      )}

      {/* Infinite canvas container — offset by camera */}
      <div style={{ position: 'absolute', left: -camX, top: -camY, width: 99999, height: 99999 }}>
        {/* Variables HUD */}
        {isPlaying && Object.keys(engineState.variables).length > 0 && (
          <div style={{ position: 'fixed', top: 40, right: 8, zIndex: 20, padding: 6, borderRadius: 4, background: 'rgba(255,255,255,0.9)', border: '1px solid #ccc', fontSize: 10 }}>
            {Object.entries(engineState.variables).map(function([k, v]) {
              return (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ color: '#c88330' }}>{k}</span>
                  <span style={{ fontFamily: 'monospace' }}>{v}</span>
                </div>
              );
            })}
          </div>
        )}

        {objects.map(function(obj) {
          if (obj.visible === false) return null;
          var sayData = engineState.sayTexts.get(obj.id);
          var emoji = getSpriteEmoji(obj);

          return (
            <div
              key={obj.id}
              className={'viewport-object ' + (selectedObject === obj.id ? 'selected' : '')}
              style={{ left: obj.x, top: obj.y, zIndex: obj.zIndex, opacity: obj.opacity != null ? obj.opacity : 1 }}
              onMouseDown={function(e) { handleObjDown(e, obj.id); }}
            >
              {obj.type === 'player' ? (
                <AeroPlayer obj={obj} frame={frameCount} />
              ) : obj.type === 'physics_ball' ? (
                <PhysBall obj={obj} />
              ) : obj.customImage && !(obj.vectorShapes && obj.vectorShapes.length > 0) ? (
                <div style={{ width: obj.width, height: obj.height, position: 'relative' }}>
                  <img src={obj.customImage} alt={obj.name} style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'rotate(' + (obj.rotation || 0) + 'deg)' }} />
                  <div style={{ position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: '#888', whiteSpace: 'nowrap' }}>{obj.name}</div>
                </div>
              ) : emoji ? (
                <div style={{ width: obj.width, height: obj.height, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <span style={{ fontSize: Math.min(obj.width, obj.height) * 0.7 }}>{emoji}</span>
                  <div style={{ position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: '#888', whiteSpace: 'nowrap' }}>{obj.name}</div>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  {renderObj(obj)}
                  <div style={{ position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: '#888', whiteSpace: 'nowrap' }}>{obj.name}</div>
                </div>
              )}

              {/* Say bubble */}
              {sayData && (
                <div style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', background: 'white', color: '#333', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', border: '1px solid #ccc', zIndex: 100 }}>
                  {sayData.text}
                </div>
              )}

              {/* Selection handles */}
              {selectedObject === obj.id && !isPlaying && (
                <>
                  <div style={{ position: 'absolute', top: -2, left: -2, width: 5, height: 5, background: '#fff', border: '1px solid #4a90d9' }} />
                  <div style={{ position: 'absolute', top: -2, right: -2, width: 5, height: 5, background: '#fff', border: '1px solid #4a90d9' }} />
                  <div style={{ position: 'absolute', bottom: -2, left: -2, width: 5, height: 5, background: '#fff', border: '1px solid #4a90d9' }} />
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 5, height: 5, background: '#fff', border: '1px solid #4a90d9' }} />
                </>
              )}
            </div>
          );
        })}
      </div>

      {isPlaying && (
        <div style={{ position: 'absolute', top: 4, left: 4, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, zIndex: 20, background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.4)' }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: '#4caf50' }} />
          <span style={{ color: '#2e7d32', fontSize: 9, fontWeight: 'bold' }}>RUNNING</span>
        </div>
      )}
    </div>
  );
};

export default Viewport2D5;
