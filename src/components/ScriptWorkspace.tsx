import React, { useState, useRef, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { PlacedBlock, BLOCK_DEFINITIONS, BLOCK_CATEGORIES, BlockDef, ConsoleLog } from '../types';

interface Props {
  blocks: PlacedBlock[];
  setBlocks: (b: PlacedBlock[] | ((prev: PlacedBlock[]) => PlacedBlock[])) => void;
  onLog: (log: ConsoleLog) => void;
  currentSpriteId: string;
}

var BLOCK_H = 36;
var SNAP_DIST = 18;
var C_INNER_MIN = 40;
var C_ELSE_MIN = 40;
var C_BOTTOM = 20;

function getBlockHeight(block: PlacedBlock, allBlocks: PlacedBlock[]): number {
  var def = BLOCK_DEFINITIONS.find(function(d) { return d.id === block.blockId; });
  if (!def || def.shape !== 'c-block') return BLOCK_H;
  var innerH = C_INNER_MIN;
  if (block.innerUids && block.innerUids.length > 0) {
    innerH = 0;
    for (var i = 0; i < block.innerUids.length; i++) {
      var ib = allBlocks.find(function(b) { return b.uid === block.innerUids[i]; });
      if (ib) innerH += getBlockHeight(ib, allBlocks);
    }
    if (innerH < C_INNER_MIN) innerH = C_INNER_MIN;
  }
  var elseH = 0;
  if (block.blockId === 'ctrl_if_else') {
    elseH = C_ELSE_MIN;
    if (block.elseUids && block.elseUids.length > 0) {
      elseH = 0;
      for (var j = 0; j < block.elseUids.length; j++) {
        var eb = allBlocks.find(function(b) { return b.uid === block.elseUids[j]; });
        if (eb) elseH += getBlockHeight(eb, allBlocks);
      }
      if (elseH < C_ELSE_MIN) elseH = C_ELSE_MIN;
    }
  }
  return BLOCK_H + innerH + elseH + C_BOTTOM;
}

var ScriptWorkspace: React.FC<Props> = function({ blocks, setBlocks, currentSpriteId }) {
  var [selectedCat, setSelectedCat] = useState(BLOCK_CATEGORIES[0].name);
  var [dragId, setDragId] = useState<string | null>(null);
  var [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  var [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
  var wsRef = useRef<HTMLDivElement>(null);
  var isPanning = useRef(false);
  var panStart = useRef({ x: 0, y: 0, sx: 0, sy: 0 });

  var catBlocks = BLOCK_DEFINITIONS.filter(function(d) { return d.category === selectedCat; });

  var addBlockFromPalette = useCallback(function(def: BlockDef) {
    var newBlock: PlacedBlock = {
      uid: uuid(),
      blockId: def.id,
      x: 200 - scrollPos.x + Math.random() * 40,
      y: 100 - scrollPos.y + Math.random() * 40,
      inputs: def.inputs ? def.inputs.map(function(inp) { return inp.default || ''; }) : [],
      nextUid: null,
      prevUid: null,
      innerUids: [],
      elseUids: [],
      spriteId: currentSpriteId,
    };
    setBlocks(function(prev: PlacedBlock[]) { return prev.concat([newBlock]); });
  }, [setBlocks, currentSpriteId, scrollPos]);

  var deleteBlock = useCallback(function(uid: string) {
    setBlocks(function(prev: PlacedBlock[]) {
      var block = prev.find(function(b) { return b.uid === uid; });
      if (!block) return prev;
      var updated = prev.map(function(b) {
        var nb = { ...b };
        if (nb.nextUid === uid) nb.nextUid = block!.nextUid;
        if (nb.prevUid === uid) nb.prevUid = block!.prevUid;
        nb.innerUids = nb.innerUids.filter(function(u) { return u !== uid; });
        nb.elseUids = nb.elseUids.filter(function(u) { return u !== uid; });
        return nb;
      });
      return updated.filter(function(b) { return b.uid !== uid; });
    });
  }, [setBlocks]);

  var updateInput = useCallback(function(uid: string, idx: number, value: string) {
    setBlocks(function(prev: PlacedBlock[]) {
      return prev.map(function(b) {
        if (b.uid !== uid) return b;
        var newInputs = b.inputs.slice();
        newInputs[idx] = value;
        return { ...b, inputs: newInputs };
      });
    });
  }, [setBlocks]);

  var handleBlockMouseDown = useCallback(function(e: React.MouseEvent, uid: string) {
    e.stopPropagation();
    if (e.button !== 0) return;
    var block = blocks.find(function(b) { return b.uid === uid; });
    if (!block) return;
    setDragId(uid);
    setDragOffset({ x: e.clientX - (block.x + scrollPos.x), y: e.clientY - (block.y + scrollPos.y) });

    // Detach from prev
    if (block.prevUid) {
      setBlocks(function(prev: PlacedBlock[]) {
        return prev.map(function(b) {
          if (b.uid === block!.prevUid && b.nextUid === uid) return { ...b, nextUid: null };
          if (b.uid === uid) return { ...b, prevUid: null };
          // Remove from inner/else
          var nb = { ...b };
          nb.innerUids = nb.innerUids.filter(function(u) { return u !== uid; });
          nb.elseUids = nb.elseUids.filter(function(u) { return u !== uid; });
          return nb;
        });
      });
    }
  }, [blocks, scrollPos, setBlocks]);

  var handleMouseMove = useCallback(function(e: React.MouseEvent) {
    if (isPanning.current) {
      setScrollPos({
        x: panStart.current.sx + (e.clientX - panStart.current.x),
        y: panStart.current.sy + (e.clientY - panStart.current.y),
      });
      return;
    }
    if (!dragId) return;
    var newX = e.clientX - dragOffset.x - scrollPos.x;
    var newY = e.clientY - dragOffset.y - scrollPos.y;
    setBlocks(function(prev: PlacedBlock[]) {
      return prev.map(function(b) {
        if (b.uid !== dragId) return b;
        return { ...b, x: newX, y: newY };
      });
    });
  }, [dragId, dragOffset, scrollPos, setBlocks]);

  var handleMouseUp = useCallback(function() {
    if (isPanning.current) { isPanning.current = false; return; }
    if (!dragId) return;
    var draggedBlock = blocks.find(function(b) { return b.uid === dragId; });
    if (!draggedBlock) { setDragId(null); return; }

    // Try snap to another block
    var bestTarget: PlacedBlock | null = null;
    var bestDist = SNAP_DIST;
    var snapType: 'bottom' | 'inner' | 'else' = 'bottom';

    for (var i = 0; i < blocks.length; i++) {
      var other = blocks[i];
      if (other.uid === dragId) continue;
      if (other.spriteId !== currentSpriteId) continue;
      var def = BLOCK_DEFINITIONS.find(function(d) { return d.id === other.blockId; });
      var oh = getBlockHeight(other, blocks);

      // Snap below
      if (!other.nextUid) {
        var bottomY = other.y + oh;
        var dist = Math.sqrt(Math.pow(draggedBlock.x - other.x, 2) + Math.pow(draggedBlock.y - bottomY, 2));
        if (dist < bestDist) {
          bestDist = dist;
          bestTarget = other;
          snapType = 'bottom';
        }
      }

      // Snap inside c-block
      if (def && def.shape === 'c-block' && other.innerUids.length === 0) {
        var innerY = other.y + BLOCK_H;
        var innerDist = Math.sqrt(Math.pow(draggedBlock.x - (other.x + 16), 2) + Math.pow(draggedBlock.y - innerY, 2));
        if (innerDist < bestDist) {
          bestDist = innerDist;
          bestTarget = other;
          snapType = 'inner';
        }
      }

      // Snap into else slot
      if (def && other.blockId === 'ctrl_if_else' && other.elseUids.length === 0) {
        var innerHt = C_INNER_MIN;
        if (other.innerUids.length > 0) {
          innerHt = 0;
          for (var k = 0; k < other.innerUids.length; k++) {
            var ub = blocks.find(function(b) { return b.uid === other.innerUids[k]; });
            if (ub) innerHt += getBlockHeight(ub, blocks);
          }
        }
        var elseY = other.y + BLOCK_H + innerHt + 20;
        var elseDist = Math.sqrt(Math.pow(draggedBlock.x - (other.x + 16), 2) + Math.pow(draggedBlock.y - elseY, 2));
        if (elseDist < bestDist) {
          bestDist = elseDist;
          bestTarget = other;
          snapType = 'else';
        }
      }
    }

    if (bestTarget) {
      setBlocks(function(prev: PlacedBlock[]) {
        return prev.map(function(b) {
          if (snapType === 'bottom') {
            if (b.uid === bestTarget!.uid) return { ...b, nextUid: dragId };
            if (b.uid === dragId) {
              var th = getBlockHeight(bestTarget!, prev);
              return { ...b, prevUid: bestTarget!.uid, x: bestTarget!.x, y: bestTarget!.y + th };
            }
          }
          if (snapType === 'inner') {
            if (b.uid === bestTarget!.uid) return { ...b, innerUids: b.innerUids.concat([dragId!]) };
            if (b.uid === dragId) return { ...b, x: bestTarget!.x + 16, y: bestTarget!.y + BLOCK_H };
          }
          if (snapType === 'else') {
            if (b.uid === bestTarget!.uid) return { ...b, elseUids: b.elseUids.concat([dragId!]) };
            if (b.uid === dragId) {
              var iH = C_INNER_MIN;
              if (bestTarget!.innerUids.length > 0) {
                iH = 0;
                for (var m = 0; m < bestTarget!.innerUids.length; m++) {
                  var mb = prev.find(function(bb) { return bb.uid === bestTarget!.innerUids[m]; });
                  if (mb) iH += getBlockHeight(mb, prev);
                }
              }
              return { ...b, x: bestTarget!.x + 16, y: bestTarget!.y + BLOCK_H + iH + 20 };
            }
          }
          return b;
        });
      });
    }
    setDragId(null);
  }, [dragId, blocks, currentSpriteId, setBlocks]);

  var handleWsBgDown = useCallback(function(e: React.MouseEvent) {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY, sx: scrollPos.x, sy: scrollPos.y };
      e.preventDefault();
    }
  }, [scrollPos]);

  // Render a single block
  var renderBlock = function(block: PlacedBlock, isInner?: boolean): React.ReactNode {
    var def = BLOCK_DEFINITIONS.find(function(d) { return d.id === block.blockId; });
    if (!def) return null;
    var isCBlock = def.shape === 'c-block';
    var isHat = def.shape === 'hat';
    var isCap = def.shape === 'cap';
    getBlockHeight(block, blocks); // used for layout

    var darkColor = def.color;
    var lightColor = def.color + 'cc';
    var borderColor = def.color.replace('#', '');
    var r = parseInt(borderColor.substring(0, 2), 16);
    var g = parseInt(borderColor.substring(2, 4), 16);
    var b2 = parseInt(borderColor.substring(4, 6), 16);
    var darkerBorder = 'rgb(' + Math.max(0, r - 40) + ',' + Math.max(0, g - 40) + ',' + Math.max(0, b2 - 40) + ')';

    var blockStyle: React.CSSProperties = {
      position: isInner ? 'relative' : 'absolute',
      left: isInner ? 0 : block.x + scrollPos.x,
      top: isInner ? 0 : block.y + scrollPos.y,
      minWidth: 140,
      cursor: 'grab',
      zIndex: dragId === block.uid ? 1000 : 10,
      userSelect: 'none',
      marginBottom: isInner ? 2 : 0,
    };

    return (
      <div key={block.uid} style={blockStyle} onMouseDown={function(e) { handleBlockMouseDown(e, block.uid); }}>
        {/* Main block header */}
        <div style={{
          background: 'linear-gradient(180deg, ' + lightColor + ' 0%, ' + darkColor + ' 100%)',
          border: '2px solid ' + darkerBorder,
          borderRadius: isHat ? '10px 10px 4px 4px' : '4px',
          borderBottomLeftRadius: isCBlock ? 0 : (isCap ? '10px' : '4px'),
          borderBottomRightRadius: isCBlock ? 0 : (isCap ? '10px' : '4px'),
          padding: '4px 8px',
          height: BLOCK_H - 4,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          color: '#fff',
          fontSize: 11,
          fontWeight: 600,
          textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 4px rgba(0,0,0,0.2)',
          position: 'relative',
        }}>
          {/* Notch on top (if not hat) */}
          {!isHat && !isInner && (
            <div style={{ position: 'absolute', top: -4, left: 16, width: 20, height: 4, background: darkColor, borderRadius: '2px 2px 0 0' }} />
          )}
          <span style={{ whiteSpace: 'nowrap' }}>{def.label}</span>
          {/* Inputs */}
          {def.inputs && def.inputs.map(function(inp, idx) {
            if (inp.type === 'dropdown') {
              return (
                <select key={idx} value={block.inputs[idx] || inp.default || ''}
                  onChange={function(e) { e.stopPropagation(); updateInput(block.uid, idx, e.target.value); }}
                  onMouseDown={function(e) { e.stopPropagation(); }}
                  style={{ fontSize: 10, padding: '1px 2px', borderRadius: 3, border: '1px solid ' + darkerBorder, background: '#fff', color: '#333', maxWidth: 90 }}>
                  {(inp.options || []).map(function(opt) { return <option key={opt} value={opt}>{opt}</option>; })}
                </select>
              );
            }
            return (
              <input key={idx} type={inp.type === 'number' ? 'number' : 'text'}
                value={block.inputs[idx] || ''}
                onChange={function(e) { e.stopPropagation(); updateInput(block.uid, idx, e.target.value); }}
                onMouseDown={function(e) { e.stopPropagation(); }}
                style={{ width: inp.type === 'number' ? 40 : 60, fontSize: 10, padding: '1px 4px', borderRadius: 3, border: '1px solid ' + darkerBorder, background: '#fff', color: '#333' }}
                placeholder={inp.placeholder}
              />
            );
          })}
          {/* Delete button */}
          <button
            onClick={function(e) { e.stopPropagation(); deleteBlock(block.uid); }}
            onMouseDown={function(e) { e.stopPropagation(); }}
            style={{ marginLeft: 'auto', width: 16, height: 16, border: 'none', background: 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: 8, fontSize: 9, cursor: 'pointer', lineHeight: '16px', padding: 0 }}
          >✕</button>
          {/* Bottom notch */}
          {!isCBlock && !isCap && (
            <div style={{ position: 'absolute', bottom: -4, left: 16, width: 20, height: 4, background: darkColor, borderRadius: '0 0 2px 2px' }} />
          )}
        </div>

        {/* C-block inner area */}
        {isCBlock && (
          <>
            <div style={{
              marginLeft: 16,
              minHeight: C_INNER_MIN,
              background: 'rgba(255,255,255,0.15)',
              borderLeft: '3px solid ' + darkerBorder,
              borderRight: '2px solid ' + darkerBorder,
              padding: 4,
            }}>
              {block.innerUids.map(function(iu) {
                var innerBlock = blocks.find(function(b) { return b.uid === iu; });
                if (!innerBlock) return null;
                return renderBlock(innerBlock, true);
              })}
              {block.innerUids.length === 0 && (
                <div style={{ height: C_INNER_MIN - 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>
                  drop blocks here
                </div>
              )}
            </div>

            {/* Else section for if-else */}
            {block.blockId === 'ctrl_if_else' && (
              <>
                <div style={{
                  background: 'linear-gradient(180deg, ' + lightColor + ' 0%, ' + darkColor + ' 100%)',
                  border: '2px solid ' + darkerBorder,
                  borderTop: 'none',
                  borderBottom: 'none',
                  padding: '3px 8px',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
                }}>else</div>
                <div style={{
                  marginLeft: 16,
                  minHeight: C_ELSE_MIN,
                  background: 'rgba(255,255,255,0.1)',
                  borderLeft: '3px solid ' + darkerBorder,
                  borderRight: '2px solid ' + darkerBorder,
                  padding: 4,
                }}>
                  {block.elseUids.map(function(eu) {
                    var elseBlock = blocks.find(function(b) { return b.uid === eu; });
                    if (!elseBlock) return null;
                    return renderBlock(elseBlock, true);
                  })}
                  {block.elseUids.length === 0 && (
                    <div style={{ height: C_ELSE_MIN - 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>
                      drop blocks here
                    </div>
                  )}
                </div>
              </>
            )}

            {/* C-block bottom cap */}
            <div style={{
              background: 'linear-gradient(180deg, ' + darkColor + ' 0%, ' + darkerBorder + ' 100%)',
              border: '2px solid ' + darkerBorder,
              borderTop: 'none',
              borderRadius: '0 0 4px 4px',
              height: C_BOTTOM,
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', bottom: -4, left: 16, width: 20, height: 4, background: darkColor, borderRadius: '0 0 2px 2px' }} />
            </div>
          </>
        )}
      </div>
    );
  };

  // Filter blocks that are not inside other blocks
  var topBlocks = blocks.filter(function(b) {
    if (b.spriteId !== currentSpriteId) return false;
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].innerUids.indexOf(b.uid) >= 0) return false;
      if (blocks[i].elseUids.indexOf(b.uid) >= 0) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Category list */}
      <div style={{ width: 76, background: '#e8e8e8', borderRight: '1px solid #bbb', overflowY: 'auto', flexShrink: 0 }}>
        {BLOCK_CATEGORIES.map(function(cat) {
          var isActive = selectedCat === cat.name;
          return (
            <div key={cat.name}
              onClick={function() { setSelectedCat(cat.name); }}
              style={{
                padding: '6px 4px',
                fontSize: 9,
                fontWeight: isActive ? 700 : 400,
                cursor: 'pointer',
                background: isActive ? cat.color : 'transparent',
                color: isActive ? '#fff' : '#555',
                textAlign: 'center',
                borderBottom: '1px solid #ccc',
                textShadow: isActive ? '0 1px 1px rgba(0,0,0,0.3)' : 'none',
              }}>
              <div style={{ fontSize: 14 }}>{cat.icon}</div>
              {cat.name}
            </div>
          );
        })}
      </div>

      {/* Block palette */}
      <div className="has-scrollbar" style={{ width: 160, background: '#f0f0f0', borderRight: '1px solid #bbb', overflowY: 'auto', padding: 6, flexShrink: 0 }}>
        {catBlocks.map(function(def) {
          var darkC = def.color;
          return (
            <div key={def.id}
              onClick={function() { addBlockFromPalette(def); }}
              style={{
                background: 'linear-gradient(180deg, ' + darkC + 'cc 0%, ' + darkC + ' 100%)',
                border: '2px solid rgba(0,0,0,0.3)',
                borderRadius: def.shape === 'hat' ? '8px 8px 3px 3px' : '3px',
                padding: '4px 6px',
                marginBottom: 4,
                color: '#fff',
                fontSize: 10,
                fontWeight: 600,
                cursor: 'pointer',
                textShadow: '1px 1px 1px rgba(0,0,0,0.4)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 1px 2px rgba(0,0,0,0.15)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={def.label + (def.shape === 'c-block' ? ' (C-block)' : '')}
            >
              {def.shape === 'c-block' && '⤶ '}
              {def.label}
            </div>
          );
        })}
      </div>

      {/* Workspace canvas — infinite scrollable */}
      <div ref={wsRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#fff', cursor: isPanning.current ? 'grabbing' : 'default' }}
        onMouseDown={handleWsBgDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid pattern */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"
              patternTransform={'translate(' + (scrollPos.x % 20) + ',' + (scrollPos.y % 20) + ')'}>
              <circle cx="1" cy="1" r="0.5" fill="#ddd" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Render all top-level blocks */}
        {topBlocks.map(function(block) { return renderBlock(block); })}

        {/* Empty state */}
        {topBlocks.length === 0 && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#bbb', fontSize: 12, textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📜</div>
            Click blocks from the palette to add them here<br />
            Drag blocks near each other to snap them together<br />
            Alt+drag to pan the workspace
          </div>
        )}

        {/* Scroll position indicator */}
        <div style={{ position: 'absolute', bottom: 4, right: 4, fontSize: 8, color: '#bbb', pointerEvents: 'none' }}>
          {Math.round(-scrollPos.x)}, {Math.round(-scrollPos.y)}
        </div>
      </div>
    </div>
  );
};

export default ScriptWorkspace;
