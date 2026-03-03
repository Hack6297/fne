import React, { useRef, useState, useEffect } from 'react';

interface Props {
  sceneBg: string | null;
  onSave: (dataUrl: string) => void;
  onClear: () => void;
  onUpload: () => void;
  onClose: () => void;
}

var BgPaintDialog: React.FC<Props> = function({ sceneBg, onSave, onClear, onUpload, onClose }) {
  var canvasRef = useRef<HTMLCanvasElement>(null);
  var [color, setColor] = useState('#4a90d9');
  var [brushSize, setBrushSize] = useState(4);
  var [painting, setPainting] = useState(false);

  useEffect(function() {
    var canvas = canvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (sceneBg) {
      var img = new Image();
      img.onload = function() { ctx!.drawImage(img, 0, 0, canvas!.width, canvas!.height); };
      img.src = sceneBg;
    } else {
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#228B22';
      ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
    }
  }, [sceneBg]);

  var draw = function(e: React.MouseEvent) {
    if (!painting) return;
    var canvas = canvasRef.current;
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var rect = canvas.getBoundingClientRect();
    var x = (e.clientX - rect.left) * (canvas.width / rect.width);
    var y = (e.clientY - rect.top) * (canvas.height / rect.height);
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* 7.css window active */}
      <div className="window active" style={{ width: 540, maxWidth: '90vw' }}>
        <div className="title-bar">
          <div className="title-bar-text">Paint Background</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose}></button>
          </div>
        </div>
        <div className="window-body has-space">
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input type="color" value={color} onChange={function(e) { setColor(e.target.value); }} style={{ width: 28, height: 22 }} />
            {['#e74c3c','#3498db','#2ecc71','#f39c12','#87CEEB','#228B22','#FFF','#000'].map(function(c) {
              return <button key={c} style={{ width: 18, height: 18, background: c, border: color === c ? '2px solid #333' : '1px solid #aaa', borderRadius: 2, padding: 0, cursor: 'pointer' }} onClick={function() { setColor(c); }} />;
            })}
            <span style={{ fontSize: 10, color: '#888', marginLeft: 8 }}>Size:</span>
            <input type="range" min="1" max="20" value={brushSize} onChange={function(e) { setBrushSize(+e.target.value); }} style={{ width: 80 }} />
            <span style={{ fontSize: 10, color: '#888' }}>{brushSize}px</span>
          </div>
          <canvas
            ref={canvasRef}
            width={480} height={320}
            style={{ width: '100%', border: '2px inset #999', cursor: 'crosshair', background: '#fff' }}
            onMouseDown={function(e) { setPainting(true); draw(e); }}
            onMouseMove={draw}
            onMouseUp={function() { setPainting(false); }}
            onMouseLeave={function() { setPainting(false); }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            <button onClick={function() {
              var canvas = canvasRef.current;
              if (canvas) onSave(canvas.toDataURL());
              onClose();
            }}>Save</button>
            <button onClick={function() {
              var canvas = canvasRef.current;
              if (!canvas) return;
              var ctx = canvas.getContext('2d');
              if (ctx) { ctx.fillStyle = '#87CEEB'; ctx.fillRect(0, 0, 480, 320); ctx.fillStyle = '#228B22'; ctx.fillRect(0, 224, 480, 96); }
            }}>Clear</button>
            <button onClick={onUpload}>Upload</button>
            <button onClick={function() { onClear(); onClose(); }}>Remove BG</button>
            <button onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BgPaintDialog;
