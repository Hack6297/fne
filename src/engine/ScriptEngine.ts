import { PlacedBlock, ViewportObject, ConsoleLog } from '../types';
import { v4 as uuid } from 'uuid';

export interface EngineState {
  objects: ViewportObject[];
  variables: Record<string, number>;
  gravity: number;
  keysDown: Set<string>;
  logs: ConsoleLog[];
  messages: string[];
  sayTexts: Map<string, { text: string; timer: number }>;
  particles: Map<string, { type: string; timer: number }>;
  glows: Map<string, string>;
  cameraX: number;
  cameraY: number;
  cameraFollow: string | null;
  clickedSpriteId: string | null;
  activeForeverChains: Set<string>;
  volume: number;
  activeAudioElements: HTMLAudioElement[];
  frameCount: number;
  stopClicked: boolean;
}

// ============================================================
// BLOCK CHAIN BUILDER
// ============================================================
export function getBlockChains(blocks: PlacedBlock[], spriteId: string): PlacedBlock[][] {
  var spriteBlocks = blocks.filter(function(b) { return b.spriteId === spriteId; });
  var isChild = new Set<string>();
  spriteBlocks.forEach(function(b) {
    if (b.nextUid) isChild.add(b.nextUid);
    if (b.innerUids) b.innerUids.forEach(function(u) { isChild.add(u); });
    if (b.elseUids) b.elseUids.forEach(function(u) { isChild.add(u); });
  });
  var headBlocks = spriteBlocks.filter(function(b) { return !isChild.has(b.uid); });
  var chains: PlacedBlock[][] = [];
  for (var h = 0; h < headBlocks.length; h++) {
    var head = headBlocks[h];
    var chain: PlacedBlock[] = [head];
    var current = head;
    var visited = new Set<string>();
    visited.add(current.uid);
    while (current.nextUid) {
      var next = spriteBlocks.find(function(b) { return b.uid === current.nextUid; });
      if (!next || visited.has(next.uid)) break;
      visited.add(next.uid);
      chain.push(next);
      current = next;
    }
    chains.push(chain);
  }
  return chains;
}

// ============================================================
// CONDITION EVALUATOR
// ============================================================
function evaluateCondition(condition: string, state: EngineState, spriteId: string): boolean {
  if (!condition || condition === '') return false;
  var c = condition.trim();
  if (c === 'true') return true;
  if (c === 'false') return false;
  if (c.startsWith('not ')) return !evaluateCondition(c.slice(4), state, spriteId);
  if (c.indexOf(' and ') >= 0) {
    var parts = c.split(' and ');
    for (var i = 0; i < parts.length; i++) { if (!evaluateCondition(parts[i].trim(), state, spriteId)) return false; }
    return true;
  }
  if (c.indexOf(' or ') >= 0) {
    var parts2 = c.split(' or ');
    for (var j = 0; j < parts2.length; j++) { if (evaluateCondition(parts2[j].trim(), state, spriteId)) return true; }
    return false;
  }
  if (c.startsWith('key ') && c.endsWith(' held')) {
    var key = c.slice(4, c.length - 5).trim();
    if (key === 'Any' || key === 'any') return state.keysDown.size > 0;
    return state.keysDown.has(key) || state.keysDown.has(key.toLowerCase()) || state.keysDown.has(key.toUpperCase());
  }
  if (c === 'touching ground') { var s = state.objects.find(function(o) { return o.id === spriteId; }); return !!(s && s.isGrounded); }
  if (c === 'not touching ground') { var s2 = state.objects.find(function(o) { return o.id === spriteId; }); return !s2 || !s2.isGrounded; }
  if (c === 'touching edge') { var s3 = state.objects.find(function(o) { return o.id === spriteId; }); return !!s3 && (s3.x < -5000 || s3.x > 10000 || s3.y < -5000 || s3.y > 10000); }
  var m = c.match(/^(\w+)\s*(>=|<=|!=|>|<|=)\s*(-?\d+\.?\d*)$/);
  if (m) {
    var vv = state.variables[m[1]] || 0;
    var val = parseFloat(m[3]);
    switch(m[2]) { case '>': return vv > val; case '<': return vv < val; case '=': return vv === val; case '>=': return vv >= val; case '<=': return vv <= val; case '!=': return vv !== val; }
  }
  return false;
}

// ============================================================
// HAT BLOCK IDS — these are the event/hat blocks
// They must match EXACTLY what BlocklyWorkspace registers
// ============================================================
var HAT_BLOCKS = new Set([
  'evt_start', 'evt_key_pressed', 'evt_clicked', 'evt_touching', 'evt_stop_clicked'
]);

function isHatBlock(blockId: string): boolean {
  return HAT_BLOCKS.has(blockId);
}

// ============================================================
// CHAIN EXECUTOR
// ============================================================
export function executeChain(
  chain: PlacedBlock[],
  state: EngineState,
  triggerType: 'start' | 'keypress' | 'forever' | 'timer' | 'collision' | 'click' | 'stop',
  spriteId: string,
  allBlocks: PlacedBlock[],
): EngineState {
  if (chain.length === 0) return state;
  var headBlock = chain[0];
  var chainKey = headBlock.uid + ':' + spriteId;

  // Find if chain contains a forever block
  var foreverIdx = -1;
  for (var fi = 0; fi < chain.length; fi++) {
    if (chain[fi].blockId === 'ctrl_forever') { foreverIdx = fi; break; }
  }
  var hasForever = foreverIdx >= 0;

  // FOREVER TRIGGER: Only run chains that are already active
  if (triggerType === 'forever') {
    if (hasForever && state.activeForeverChains.has(chainKey)) {
      // Run the forever block's inner blocks
      return executeSingleBlock(chain[foreverIdx], state, spriteId, allBlocks);
    }
    return state; // Don't run anything else on 'forever' trigger
  }

  // For non-forever triggers, check if the hat block matches
  var shouldRun = false;
  switch (headBlock.blockId) {
    case 'evt_start':
      shouldRun = (triggerType === 'start');
      break;
    case 'evt_stop_clicked':
      shouldRun = (triggerType === 'stop');
      break;
    case 'evt_key_pressed': {
      if (triggerType === 'keypress') {
        var keyVal = headBlock.inputs[0] || 'any';
        if (keyVal === 'any' || keyVal === 'Any') shouldRun = state.keysDown.size > 0;
        else shouldRun = state.keysDown.has(keyVal) || state.keysDown.has(keyVal.toLowerCase()) || state.keysDown.has(keyVal.toUpperCase());
      }
      break;
    }
    case 'evt_clicked': {
      shouldRun = (triggerType === 'click') && (state.clickedSpriteId === spriteId);
      break;
    }
    case 'evt_touching':
      shouldRun = (triggerType === 'collision');
      break;
    default:
      // NOT a recognized hat block — don't run on triggers
      shouldRun = false;
      break;
  }

  if (!shouldRun) return state;

  // Mark chain as active if it contains forever
  var newState = state;
  if (hasForever) {
    var newActive = new Set(state.activeForeverChains);
    newActive.add(chainKey);
    newState = { ...newState, activeForeverChains: newActive };
  }

  // Execute blocks in chain, skip the hat block (index 0)
  var startIdx = isHatBlock(headBlock.blockId) ? 1 : 0;
  for (var i = startIdx; i < chain.length; i++) {
    newState = executeSingleBlock(chain[i], newState, spriteId, allBlocks);
  }
  return newState;
}

// ============================================================
// HELPERS
// ============================================================
function getSprite(state: EngineState, spriteId: string): ViewportObject | undefined {
  return state.objects.find(function(o) { return o.id === spriteId; });
}
function updateSprite(state: EngineState, spriteId: string, updates: Partial<ViewportObject>): EngineState {
  return { ...state, objects: state.objects.map(function(o) { return o.id === spriteId ? { ...o, ...updates } : o; }) };
}
function executeInnerBlocks(uids: string[], state: EngineState, spriteId: string, allBlocks: PlacedBlock[]): EngineState {
  var s = state;
  for (var i = 0; i < uids.length; i++) {
    var block = allBlocks.find(function(b) { return b.uid === uids[i]; });
    if (block) s = executeSingleBlock(block, s, spriteId, allBlocks);
  }
  return s;
}
function mkLog(type: 'info' | 'warn' | 'error' | 'log', message: string): ConsoleLog {
  return { id: uuid(), type: type, message: message, timestamp: new Date().toLocaleTimeString() };
}

// ============================================================
// SINGLE BLOCK EXECUTOR
// ALL block IDs must match EXACTLY what BlocklyWorkspace registers
// ============================================================
function executeSingleBlock(block: PlacedBlock, state: EngineState, spriteId: string, allBlocks: PlacedBlock[]): EngineState {
  var inputs = block.inputs;
  var sprite = getSprite(state, spriteId);

  switch (block.blockId) {

    // ===== C-BLOCKS =====
    case 'ctrl_forever':
      return executeInnerBlocks(block.innerUids || [], state, spriteId, allBlocks);

    case 'ctrl_if': {
      if (evaluateCondition(inputs[0] || 'false', state, spriteId))
        return executeInnerBlocks(block.innerUids || [], state, spriteId, allBlocks);
      return state;
    }
    case 'ctrl_if_else': {
      if (evaluateCondition(inputs[0] || 'false', state, spriteId))
        return executeInnerBlocks(block.innerUids || [], state, spriteId, allBlocks);
      else
        return executeInnerBlocks(block.elseUids || [], state, spriteId, allBlocks);
    }
    case 'ctrl_repeat': {
      var times = Math.min(Math.max(parseInt(inputs[0]) || 1, 1), 100);
      var s = state;
      for (var ri = 0; ri < times; ri++) s = executeInnerBlocks(block.innerUids || [], s, spriteId, allBlocks);
      return s;
    }

    // ===== CONTROLS =====
    case 'ctrl_set_speed':
      if (!sprite) return state;
      return updateSprite(state, spriteId, { speed: parseFloat(inputs[0]) || 3 });
    case 'ctrl_go_to':
      if (!sprite) return state;
      return updateSprite(state, spriteId, { x: parseFloat(inputs[0]) || 0, y: parseFloat(inputs[1]) || 0 });
    case 'ctrl_glide_to': {
      if (!sprite) return state;
      var tx = parseFloat(inputs[0]) || 200;
      var ty = parseFloat(inputs[1]) || 150;
      return updateSprite(state, spriteId, { x: sprite.x + (tx - sprite.x) * 0.1, y: sprite.y + (ty - sprite.y) * 0.1 });
    }
    case 'ctrl_wait': return state;
    case 'ctrl_stop': return { ...state, activeForeverChains: new Set() };

    // ===== PHYSICS =====
    case 'phys_gravity':
      return { ...state, gravity: parseFloat(inputs[0]) || 0.5 };
    case 'phys_jump': {
      if (!sprite) return state;
      var jumpForce = parseFloat(inputs[0]) || 12;
      if (sprite.isGrounded) return updateSprite(state, spriteId, { vy: -jumpForce, isGrounded: false });
      return state;
    }
    case 'phys_force': {
      if (!sprite) return state;
      return updateSprite(state, spriteId, { vx: (sprite.vx || 0) + (parseFloat(inputs[0]) || 0), vy: (sprite.vy || 0) + (parseFloat(inputs[1]) || 0) });
    }
    case 'phys_velocity': {
      if (!sprite) return state;
      return updateSprite(state, spriteId, { vx: parseFloat(inputs[0]) || 0, vy: parseFloat(inputs[1]) || 0 });
    }
    case 'phys_mass':
      if (!sprite) return state;
      return updateSprite(state, spriteId, { mass: parseFloat(inputs[0]) || 1 });
    case 'phys_bounce':
      if (!sprite) return state;
      return updateSprite(state, spriteId, { bounce: parseFloat(inputs[0]) || 0 });
    case 'phys_friction':
      if (!sprite) return state;
      return updateSprite(state, spriteId, { friction: parseFloat(inputs[0]) || 0.3 });
    case 'phys_change_x': {
      if (!sprite) return state;
      var dx = parseFloat(inputs[0]) || 0;
      return updateSprite(state, spriteId, { x: sprite.x + dx, facingRight: dx > 0 ? true : dx < 0 ? false : sprite.facingRight });
    }
    case 'phys_change_y':
      if (!sprite) return state;
      return updateSprite(state, spriteId, { y: sprite.y + (parseFloat(inputs[0]) || 0) });
    case 'phys_set_x':
      if (!sprite) return state;
      return updateSprite(state, spriteId, { x: parseFloat(inputs[0]) || 0 });
    case 'phys_set_y':
      if (!sprite) return state;
      return updateSprite(state, spriteId, { y: parseFloat(inputs[0]) || 0 });

    // ===== LOOKS =====
    case 'looks_color': {
      if (!sprite) return state;
      var colorMap: Record<string,string> = { Red:'#e74c3c',Blue:'#3498db',Green:'#2ecc71',Yellow:'#f1c40f',Purple:'#9b59b6',White:'#ecf0f1',Black:'#2c3e50',Orange:'#e67e22',Cyan:'#1abc9c',Pink:'#ff6b9d' };
      return updateSprite(state, spriteId, { color: colorMap[inputs[0]] || inputs[0] || '#e74c3c' });
    }
    case 'looks_size':
      if (!sprite) return state;
      return updateSprite(state, spriteId, { width: parseFloat(inputs[0]) || 50, height: parseFloat(inputs[1]) || 50 });
    case 'looks_change_size': {
      if (!sprite) return state;
      var d = parseFloat(inputs[0]) || 10;
      return updateSprite(state, spriteId, { width: Math.max(5, sprite.width + d), height: Math.max(5, sprite.height + d) });
    }
    case 'looks_show':
      if (!sprite) return state;
      return updateSprite(state, spriteId, { visible: true });
    case 'looks_hide':
      if (!sprite) return state;
      return updateSprite(state, spriteId, { visible: false });
    case 'looks_ghost': {
      if (!sprite) return state;
      var ghost = parseFloat(inputs[0]) || 0;
      return updateSprite(state, spriteId, { opacity: Math.max(0, Math.min(1, 1 - ghost / 100)) });
    }
    case 'looks_say': {
      var sm = new Map(state.sayTexts);
      sm.set(spriteId, { text: inputs[0] || 'Hello!', timer: 9999 });
      return { ...state, sayTexts: sm };
    }
    case 'looks_say_for': {
      var sm2 = new Map(state.sayTexts);
      sm2.set(spriteId, { text: inputs[0] || 'Hello!', timer: Math.round((parseFloat(inputs[1]) || 2) * 30) });
      return { ...state, sayTexts: sm2 };
    }
    case 'looks_rotate':
      if (!sprite) return state;
      return updateSprite(state, spriteId, { rotation: (sprite.rotation || 0) + (parseFloat(inputs[0]) || 15) });
    case 'looks_set_rotation':
      if (!sprite) return state;
      return updateSprite(state, spriteId, { rotation: parseFloat(inputs[0]) || 0 });
    case 'looks_camera_follow':
      return { ...state, cameraFollow: spriteId };
    case 'looks_layer':
      if (!sprite) return state;
      return updateSprite(state, spriteId, { zIndex: parseInt(inputs[0]) || 1 });

    // ===== SOUND =====
    case 'snd_play': {
      try {
        var ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        var freqMap: Record<string,number> = { pop:800, click:1400, beep:440, jump:523, coin:988, hit:147, whoosh:300 };
        osc.frequency.value = freqMap[inputs[0]] || 440;
        osc.type = (inputs[0] === 'hit') ? 'sawtooth' : (inputs[0] === 'beep') ? 'square' : 'sine';
        gain.gain.value = Math.max(0.01, Math.min(0.3, (state.volume || 100) / 500));
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      } catch (_e) {}
      return state;
    }
    case 'snd_play_uploaded': {
      if (!sprite) return state;
      var sounds = sprite.sounds || [];
      if (sounds.length === 0) return { ...state, logs: state.logs.concat([mkLog('warn', 'No uploaded sounds on "' + (sprite.name || spriteId) + '"')]) };
      var sndIdx = parseInt(inputs[0]) || 0;
      if (sndIdx >= sounds.length) sndIdx = sounds.length - 1;
      if (sndIdx < 0) sndIdx = 0;
      try { var audio = new Audio(sounds[sndIdx].url); audio.volume = Math.max(0, Math.min(1, (state.volume || 100) / 100)); audio.play().catch(function(){}); } catch(_e) {}
      return state;
    }
    case 'snd_volume':
      return { ...state, volume: Math.max(0, Math.min(100, parseFloat(inputs[0]) || 100)) };
    case 'snd_stop':
      if (state.activeAudioElements) state.activeAudioElements.forEach(function(a) { try { a.pause(); } catch(_e){} });
      return { ...state, activeAudioElements: [] };

    // ===== MATH =====
    case 'math_set_var':
      return { ...state, variables: { ...state.variables, [inputs[0] || 'myVar']: parseFloat(inputs[1]) || 0 } };
    case 'math_change_var': {
      var vn = inputs[0] || 'myVar';
      return { ...state, variables: { ...state.variables, [vn]: (state.variables[vn] || 0) + (parseFloat(inputs[1]) || 1) } };
    }
    case 'math_set_score':
      return { ...state, variables: { ...state.variables, score: parseFloat(inputs[0]) || 0 } };
    case 'math_change_score':
      return { ...state, variables: { ...state.variables, score: (state.variables['score'] || 0) + (parseFloat(inputs[0]) || 1) } };
    case 'math_reset_score':
      return { ...state, variables: { ...state.variables, score: 0 } };
    case 'math_log_score':
      return { ...state, logs: state.logs.concat([mkLog('info', 'Score = ' + (state.variables['score'] || 0))]) };
    case 'math_random': {
      var rv = inputs[0] || 'myVar';
      var lo = parseFloat(inputs[1]) || 1;
      var hi = parseFloat(inputs[2]) || 10;
      return { ...state, variables: { ...state.variables, [rv]: Math.floor(Math.random() * (hi - lo + 1)) + lo } };
    }

    // ===== FILE =====
    case 'file_save': {
      var sk = inputs[0] || 'MyLevel';
      try { localStorage.setItem('fne_save_' + sk, JSON.stringify({ objects: state.objects, variables: state.variables })); return { ...state, logs: state.logs.concat([mkLog('info', 'Saved "' + sk + '"')]) }; }
      catch(_e) { return { ...state, logs: state.logs.concat([mkLog('error', 'Save failed')]) }; }
    }
    case 'file_load': {
      var lk = inputs[0] || 'MyLevel';
      try { var ld = localStorage.getItem('fne_save_' + lk); if (ld) { var p = JSON.parse(ld); return { ...state, objects: p.objects || state.objects, variables: p.variables || state.variables, logs: state.logs.concat([mkLog('info', 'Loaded "' + lk + '"')]) }; }
      return { ...state, logs: state.logs.concat([mkLog('warn', 'No save: "' + lk + '"')]) }; }
      catch(_e) { return { ...state, logs: state.logs.concat([mkLog('error', 'Load failed')]) }; }
    }
    case 'file_export': {
      try { var ed = JSON.stringify({ objects: state.objects, variables: state.variables }, null, 2); var blob = new Blob([ed], { type: 'application/json' }); var url = URL.createObjectURL(blob); var a = document.createElement('a'); a.href = url; a.download = 'level.json'; a.click(); URL.revokeObjectURL(url); return { ...state, logs: state.logs.concat([mkLog('info', 'Exported JSON')]) }; }
      catch(_e) { return { ...state, logs: state.logs.concat([mkLog('error', 'Export failed')]) }; }
    }
    case 'file_import': {
      try { var fi2 = document.createElement('input'); fi2.type = 'file'; fi2.accept = '.json'; fi2.click(); return { ...state, logs: state.logs.concat([mkLog('info', 'Import dialog opened')]) }; }
      catch(_e) { return state; }
    }
    case 'file_delete': {
      try { localStorage.removeItem('fne_save_' + (inputs[0] || 'MyLevel')); return { ...state, logs: state.logs.concat([mkLog('info', 'Deleted save')]) }; }
      catch(_e) { return state; }
    }

    // ===== LOGS =====
    case 'log_msg':
      return { ...state, logs: state.logs.concat([mkLog('log', inputs[0] || '')]) };
    case 'log_var': {
      var lvn = inputs[0] || 'myVar';
      return { ...state, logs: state.logs.concat([mkLog('info', lvn + ' = ' + (state.variables[lvn] !== undefined ? state.variables[lvn] : 'undefined'))]) };
    }

    // ===== LIBRARY =====
    case 'lib_player_controls': {
      if (!sprite) return state;
      var spd = sprite.speed || 5;
      var ns = state;
      if (state.keysDown.has('d') || state.keysDown.has('D') || state.keysDown.has('ArrowRight'))
        ns = updateSprite(ns, spriteId, { x: (getSprite(ns, spriteId)?.x || 0) + spd, facingRight: true });
      if (state.keysDown.has('a') || state.keysDown.has('A') || state.keysDown.has('ArrowLeft'))
        ns = updateSprite(ns, spriteId, { x: (getSprite(ns, spriteId)?.x || 0) - spd, facingRight: false });
      var spr = getSprite(ns, spriteId);
      if (spr && spr.isGrounded && (state.keysDown.has(' ') || state.keysDown.has('Space') || state.keysDown.has('w') || state.keysDown.has('W') || state.keysDown.has('ArrowUp')))
        ns = updateSprite(ns, spriteId, { vy: -12, isGrounded: false });
      return ns;
    }
    case 'lib_platform_lr': {
      if (!sprite) return state;
      var range = parseFloat(inputs[0]) || 100;
      var pspd = parseFloat(inputs[1]) || 2;
      var ox = (sprite as any)._originX;
      if (ox === undefined) return updateSprite(state, spriteId, { _originX: sprite.x, _platformDir: 1 } as any);
      var dir = (sprite as any)._platformDir || 1;
      var nx = sprite.x + pspd * dir;
      if (nx > ox + range || nx < ox - range) dir = -dir;
      return updateSprite(state, spriteId, { x: nx, _platformDir: dir } as any);
    }
    case 'lib_platform_ud': {
      if (!sprite) return state;
      var ry = parseFloat(inputs[0]) || 80;
      var psy = parseFloat(inputs[1]) || 2;
      var oy = (sprite as any)._originY;
      if (oy === undefined) return updateSprite(state, spriteId, { _originY: sprite.y, _platformDirY: 1 } as any);
      var dy2 = (sprite as any)._platformDirY || 1;
      var ny = sprite.y + psy * dy2;
      if (ny > oy + ry || ny < oy - ry) dy2 = -dy2;
      return updateSprite(state, spriteId, { y: ny, _platformDirY: dy2 } as any);
    }

    default:
      return state;
  }
}

// ============================================================
// PHYSICS STEP
// ============================================================
function getRampSurfaceY(x: number, ramp: ViewportObject): number {
  var localX = x - ramp.x;
  var t = Math.max(0, Math.min(1, localX / ramp.width));
  return ramp.y + ramp.height * (1 - t);
}

export function physicsStep(state: EngineState): EngineState {
  var newObjects = state.objects.map(function(obj) {
    if (obj.isStatic || obj.type === 'light' || obj.type === 'camera' || obj.type === 'trigger') return obj;
    if (obj.visible === false) return obj;
    var x = obj.x, y = obj.y, vx = obj.vx || 0, vy = obj.vy || 0;
    var hasGravity = obj.hasGravity !== false;
    var bounce = obj.bounce != null ? obj.bounce : 0.3;
    var friction = obj.friction != null ? obj.friction : 0.8;
    if (hasGravity) vy += state.gravity;
    x += vx; y += vy;
    vx *= friction;
    if (Math.abs(vx) < 0.01) vx = 0;
    var isGrounded = false;
    for (var oi = 0; oi < state.objects.length; oi++) {
      var other = state.objects[oi];
      if (other.id === obj.id) continue;
      if (other.type === 'light' || other.type === 'camera' || other.type === 'trigger') continue;
      if (other.visible === false) continue;
      if (other.type === 'ramp') {
        var cx = x + obj.width / 2;
        var ob = y + obj.height;
        if (cx >= other.x && cx <= other.x + other.width) {
          var sy = getRampSurfaceY(cx, other);
          if (ob >= sy && ob <= sy + 20 && vy >= 0) { y = sy - obj.height; vy = vy > 2 ? -vy * bounce : 0; isGrounded = true; }
        }
        continue;
      }
      var oL = x, oR = x + obj.width, oT = y, oB = y + obj.height;
      var tL = other.x, tR = other.x + other.width, tT = other.y, tB = other.y + other.height;
      if (oR > tL && oL < tR && oB > tT && oT < tB) {
        var ol = oR - tL, or2 = tR - oL, ot = oB - tT, ob2 = tB - oT;
        var mn = Math.min(ol, or2, ot, ob2);
        if (mn === ot && vy >= 0) { y = tT - obj.height; vy = vy > 2 ? -vy * bounce : 0; isGrounded = true; }
        else if (mn === ob2 && vy < 0) { y = tB; vy = 0; }
        else if (mn === ol && vx > 0) { x = tL - obj.width; vx = 0; }
        else if (mn === or2 && vx < 0) { x = tR; vx = 0; }
      }
    }
    return { ...obj, x: x, y: y, vx: vx, vy: vy, isGrounded: isGrounded };
  });
  var camX = state.cameraX, camY = state.cameraY;
  if (state.cameraFollow) {
    var tgt = newObjects.find(function(o) { return o.id === state.cameraFollow; });
    if (tgt) { camX += (tgt.x - 200 - camX) * 0.1; camY += (tgt.y - 150 - camY) * 0.1; }
  }
  return { ...state, objects: newObjects, cameraX: camX, cameraY: camY, clickedSpriteId: null };
}
