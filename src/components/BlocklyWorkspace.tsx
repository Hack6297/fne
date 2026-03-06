import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';

interface PlacedBlock {
  uid: string;
  blockId: string;
  inputs: string[];
  x: number;
  y: number;
  nextUid?: string;
  prevUid?: string;
  parentUid?: string;
  innerUids?: string[];
  elseUids?: string[];
  spriteId?: string;
}

interface Props {
  selectedSpriteId: string;
  onScriptsChange: (blocks: PlacedBlock[], spriteId: string) => void;
  onLog?: (msg: string) => void;
}

var blocksRegistered = false;

function registerAllBlocks() {
  if (blocksRegistered) return;
  blocksRegistered = true;

  var defs = [
    { id: 'evt_start', msg: '▶ when green button clicked', color: '#c4a000', hat: true, next: true },
    { id: 'evt_key_pressed', msg: 'when key %1 pressed', color: '#c4a000', hat: true, next: true, args: [{ type: 'field_dropdown', name: 'KEY', options: [['space','space'],['w','w'],['a','a'],['s','s'],['d','d'],['up arrow','ArrowUp'],['down arrow','ArrowDown'],['left arrow','ArrowLeft'],['right arrow','ArrowRight'],['e','e'],['q','q'],['enter','Enter'],['shift','Shift']] }] },
    { id: 'evt_clicked', msg: 'when this sprite clicked', color: '#c4a000', hat: true, next: true },
    { id: 'evt_touching', msg: 'when touching %1', color: '#c4a000', hat: true, next: true, args: [{ type: 'field_input', name: 'TARGET', text: 'edge' }] },
    { id: 'evt_stop_clicked', msg: '⏹ when stop clicked', color: '#c4a000', hat: true, next: true },
    { id: 'evt_receive', msg: 'when I receive %1', color: '#c4a000', hat: true, next: true, args: [{ type: 'field_input', name: 'MSG', text: 'message1' }] },
    { id: 'ctrl_forever', msg: 'forever', color: '#4a6cd4', cblock: true },
    { id: 'ctrl_if', msg: 'if %1 then', color: '#4a6cd4', cblock: true, args: [{ type: 'field_dropdown', name: 'COND', options: [['key w held','key w held'],['key a held','key a held'],['key s held','key s held'],['key d held','key d held'],['key space held','key Space held'],['touching ground','touching ground'],['touching edge','touching edge'],['not touching ground','not touching ground'],['score > 0','score > 0'],['score > 10','score > 10'],['score = 0','score = 0'],['lives > 0','lives > 0']] }] },
    { id: 'ctrl_if_else', msg: 'if %1 then', color: '#4a6cd4', cblock: true, hasElse: true, args: [{ type: 'field_dropdown', name: 'COND', options: [['key w held','key w held'],['key a held','key a held'],['key s held','key s held'],['key d held','key d held'],['key space held','key Space held'],['touching ground','touching ground'],['touching edge','touching edge'],['not touching ground','not touching ground'],['score > 0','score > 0'],['score > 10','score > 10']] }] },
    { id: 'ctrl_repeat', msg: 'repeat %1 times', color: '#4a6cd4', cblock: true, args: [{ type: 'field_number', name: 'TIMES', value: 10 }] },
    { id: 'ctrl_wait', msg: 'wait %1 secs', color: '#4a6cd4', prev: true, next: true, args: [{ type: 'field_number', name: 'SECS', value: 1 }] },
    { id: 'ctrl_stop_all', msg: 'stop all', color: '#4a6cd4', prev: true },
    { id: 'ctrl_set_speed', msg: 'set speed to %1', color: '#4a6cd4', prev: true, next: true, args: [{ type: 'field_number', name: 'SPEED', value: 5 }] },
    { id: 'ctrl_go_to', msg: 'go to x: %1 y: %2', color: '#4a6cd4', prev: true, next: true, args: [{ type: 'field_number', name: 'X', value: 0 },{ type: 'field_number', name: 'Y', value: 0 }] },
    { id: 'ctrl_glide_to', msg: 'glide %1 secs to x: %2 y: %3', color: '#4a6cd4', prev: true, next: true, args: [{ type: 'field_number', name: 'SECS', value: 1 },{ type: 'field_number', name: 'X', value: 0 },{ type: 'field_number', name: 'Y', value: 0 }] },
    { id: 'ctrl_broadcast', msg: 'broadcast %1', color: '#4a6cd4', prev: true, next: true, args: [{ type: 'field_input', name: 'MSG', text: 'message1' }] },
    { id: 'ctrl_broadcast_wait', msg: 'broadcast %1 and wait', color: '#4a6cd4', prev: true, next: true, args: [{ type: 'field_input', name: 'MSG', text: 'message1' }] },
    { id: 'phys_set_gravity', msg: 'set gravity to %1', color: '#e8601c', prev: true, next: true, args: [{ type: 'field_number', name: 'G', value: 0.6 }] },
    { id: 'phys_jump', msg: 'jump with force %1', color: '#e8601c', prev: true, next: true, args: [{ type: 'field_number', name: 'FORCE', value: 12 }] },
    { id: 'phys_force', msg: 'apply force x: %1 y: %2', color: '#e8601c', prev: true, next: true, args: [{ type: 'field_number', name: 'FX', value: 0 },{ type: 'field_number', name: 'FY', value: -5 }] },
    { id: 'phys_velocity', msg: 'set velocity x: %1 y: %2', color: '#e8601c', prev: true, next: true, args: [{ type: 'field_number', name: 'VX', value: 0 },{ type: 'field_number', name: 'VY', value: 0 }] },
    { id: 'phys_mass', msg: 'set mass to %1', color: '#e8601c', prev: true, next: true, args: [{ type: 'field_number', name: 'MASS', value: 1 }] },
    { id: 'phys_bounce', msg: 'set bounce to %1', color: '#e8601c', prev: true, next: true, args: [{ type: 'field_number', name: 'BOUNCE', value: 0.5 }] },
    { id: 'phys_friction', msg: 'set friction to %1', color: '#e8601c', prev: true, next: true, args: [{ type: 'field_number', name: 'FRICTION', value: 0.8 }] },
    { id: 'phys_change_x', msg: 'change x by %1', color: '#e8601c', prev: true, next: true, args: [{ type: 'field_number', name: 'DX', value: 10 }] },
    { id: 'phys_change_y', msg: 'change y by %1', color: '#e8601c', prev: true, next: true, args: [{ type: 'field_number', name: 'DY', value: 10 }] },
    { id: 'phys_set_x', msg: 'set x to %1', color: '#e8601c', prev: true, next: true, args: [{ type: 'field_number', name: 'X', value: 0 }] },
    { id: 'phys_set_y', msg: 'set y to %1', color: '#e8601c', prev: true, next: true, args: [{ type: 'field_number', name: 'Y', value: 0 }] },
    { id: 'looks_color', msg: 'set color to %1', color: '#7b2f8e', prev: true, next: true, args: [{ type: 'field_colour', name: 'COLOR', colour: '#ff0000' }] },
    { id: 'looks_size', msg: 'set size w: %1 h: %2', color: '#7b2f8e', prev: true, next: true, args: [{ type: 'field_number', name: 'W', value: 60 },{ type: 'field_number', name: 'H', value: 60 }] },
    { id: 'looks_change_size', msg: 'change size by %1', color: '#7b2f8e', prev: true, next: true, args: [{ type: 'field_number', name: 'DS', value: 10 }] },
    { id: 'looks_show', msg: 'show', color: '#7b2f8e', prev: true, next: true },
    { id: 'looks_hide', msg: 'hide', color: '#7b2f8e', prev: true, next: true },
    { id: 'looks_ghost', msg: 'set ghost effect to %1 %', color: '#7b2f8e', prev: true, next: true, args: [{ type: 'field_number', name: 'GHOST', value: 50 }] },
    { id: 'looks_say', msg: 'say %1', color: '#7b2f8e', prev: true, next: true, args: [{ type: 'field_input', name: 'TEXT', text: 'Hello!' }] },
    { id: 'looks_say_for', msg: 'say %1 for %2 secs', color: '#7b2f8e', prev: true, next: true, args: [{ type: 'field_input', name: 'TEXT', text: 'Hello!' },{ type: 'field_number', name: 'SECS', value: 2 }] },
    { id: 'looks_rotate', msg: 'turn %1 degrees', color: '#7b2f8e', prev: true, next: true, args: [{ type: 'field_number', name: 'DEG', value: 15 }] },
    { id: 'looks_set_rotation', msg: 'set rotation to %1', color: '#7b2f8e', prev: true, next: true, args: [{ type: 'field_number', name: 'DEG', value: 0 }] },
    { id: 'looks_camera_follow', msg: 'camera follow this', color: '#7b2f8e', prev: true, next: true },
    { id: 'looks_layer', msg: 'set layer to %1', color: '#7b2f8e', prev: true, next: true, args: [{ type: 'field_number', name: 'LAYER', value: 1 }] },
    { id: 'snd_play', msg: 'play sound %1', color: '#c94fc9', prev: true, next: true, args: [{ type: 'field_dropdown', name: 'SND', options: [['pop','pop'],['jump','jump'],['coin','coin'],['hit','hit'],['beep','beep']] }] },
    { id: 'snd_play_uploaded', msg: 'play uploaded sound %1', color: '#c94fc9', prev: true, next: true, args: [{ type: 'field_dropdown', name: 'IDX', options: [['Sound 1','0'],['Sound 2','1'],['Sound 3','2'],['Sound 4','3'],['Sound 5','4']] }] },
    { id: 'snd_volume', msg: 'set volume to %1 %', color: '#c94fc9', prev: true, next: true, args: [{ type: 'field_number', name: 'VOL', value: 100 }] },
    { id: 'snd_stop', msg: 'stop all sounds', color: '#c94fc9', prev: true, next: true },
    { id: 'math_set_var', msg: 'set %1 to %2', color: '#49a249', prev: true, next: true, args: [{ type: 'field_input', name: 'VAR', text: 'myVar' },{ type: 'field_number', name: 'VAL', value: 0 }] },
    { id: 'math_change_var', msg: 'change %1 by %2', color: '#49a249', prev: true, next: true, args: [{ type: 'field_input', name: 'VAR', text: 'myVar' },{ type: 'field_number', name: 'VAL', value: 1 }] },
    { id: 'math_set_score', msg: 'set score to %1', color: '#49a249', prev: true, next: true, args: [{ type: 'field_number', name: 'SCORE', value: 0 }] },
    { id: 'math_change_score', msg: 'change score by %1', color: '#49a249', prev: true, next: true, args: [{ type: 'field_number', name: 'DS', value: 1 }] },
    { id: 'math_reset_score', msg: 'reset score', color: '#49a249', prev: true, next: true },
    { id: 'math_log_score', msg: 'log score', color: '#49a249', prev: true, next: true },
    { id: 'math_random', msg: 'set %1 to random %2 to %3', color: '#49a249', prev: true, next: true, args: [{ type: 'field_input', name: 'VAR', text: 'rand' },{ type: 'field_number', name: 'MIN', value: 1 },{ type: 'field_number', name: 'MAX', value: 10 }] },
    { id: 'math_log_vars', msg: 'log all variables', color: '#49a249', prev: true, next: true },
    { id: 'file_save', msg: 'save game as %1', color: '#2e8e8e', prev: true, next: true, args: [{ type: 'field_input', name: 'NAME', text: 'save1' }] },
    { id: 'file_load', msg: 'load game %1', color: '#2e8e8e', prev: true, next: true, args: [{ type: 'field_input', name: 'NAME', text: 'save1' }] },
    { id: 'file_export', msg: 'export as JSON', color: '#2e8e8e', prev: true, next: true },
    { id: 'file_import', msg: 'import level JSON', color: '#2e8e8e', prev: true, next: true },
    { id: 'file_delete', msg: 'delete save %1', color: '#2e8e8e', prev: true, next: true, args: [{ type: 'field_input', name: 'NAME', text: 'save1' }] },
    { id: 'log_msg', msg: 'log %1', color: '#888888', prev: true, next: true, args: [{ type: 'field_input', name: 'MSG', text: 'hello' }] },
    { id: 'log_var', msg: 'log variable %1', color: '#888888', prev: true, next: true, args: [{ type: 'field_input', name: 'VAR', text: 'myVar' }] },
    { id: 'lib_player_controls', msg: '🎮 Simple Player Controls', color: '#17becf', prev: true, next: true },
    { id: 'lib_platform_lr', msg: '↔️ Platform Move Left-Right', color: '#17becf', prev: true, next: true },
    { id: 'lib_platform_ud', msg: '↕️ Platform Move Up-Down', color: '#17becf', prev: true, next: true },
  ];

  for (var i = 0; i < defs.length; i++) {
    (function(b: any) {
      if (Blockly.Blocks[b.id]) return;
      Blockly.Blocks[b.id] = {
        init: function(this: any) {
          var j: any = { type: b.id, colour: b.color, tooltip: b.msg };
          if (b.cblock) {
            if (b.hasElse) {
              j.message0 = b.msg; j.args0 = b.args || [];
              j.message1 = '%1'; j.args1 = [{ type: 'input_statement', name: 'DO' }];
              j.message2 = 'else';
              j.message3 = '%1'; j.args3 = [{ type: 'input_statement', name: 'ELSE' }];
              j.previousStatement = null; j.nextStatement = null;
            } else {
              j.message0 = b.msg; j.args0 = b.args || [];
              j.message1 = '%1'; j.args1 = [{ type: 'input_statement', name: 'DO' }];
              j.previousStatement = null; j.nextStatement = null;
            }
          } else {
            j.message0 = b.msg; j.args0 = b.args || [];
            if (b.prev) j.previousStatement = null;
            if (b.next) j.nextStatement = null;
          }
          if (b.hat) { delete j.previousStatement; j.nextStatement = null; }
          this.jsonInit(j);
        }
      };
    })(defs[i]);
  }
}

var TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    { kind: 'category', name: '⚡ Events', colour: '#c4a000', contents: [
      { kind: 'block', type: 'evt_start' },
      { kind: 'block', type: 'evt_key_pressed' },
      { kind: 'block', type: 'evt_clicked' },
      { kind: 'block', type: 'evt_touching' },
      { kind: 'block', type: 'evt_stop_clicked' },
      { kind: 'block', type: 'evt_receive' },
    ]},
    { kind: 'category', name: '🎮 Controls', colour: '#4a6cd4', contents: [
      { kind: 'block', type: 'ctrl_forever' },
      { kind: 'block', type: 'ctrl_if' },
      { kind: 'block', type: 'ctrl_if_else' },
      { kind: 'block', type: 'ctrl_repeat' },
      { kind: 'block', type: 'ctrl_wait' },
      { kind: 'block', type: 'ctrl_stop_all' },
      { kind: 'block', type: 'ctrl_set_speed' },
      { kind: 'block', type: 'ctrl_go_to' },
      { kind: 'block', type: 'ctrl_glide_to' },
      { kind: 'block', type: 'ctrl_broadcast' },
      { kind: 'block', type: 'ctrl_broadcast_wait' },
    ]},
    { kind: 'category', name: '🔧 Physics', colour: '#e8601c', contents: [
      { kind: 'block', type: 'phys_set_gravity' },
      { kind: 'block', type: 'phys_jump' },
      { kind: 'block', type: 'phys_force' },
      { kind: 'block', type: 'phys_velocity' },
      { kind: 'block', type: 'phys_mass' },
      { kind: 'block', type: 'phys_bounce' },
      { kind: 'block', type: 'phys_friction' },
      { kind: 'block', type: 'phys_change_x' },
      { kind: 'block', type: 'phys_change_y' },
      { kind: 'block', type: 'phys_set_x' },
      { kind: 'block', type: 'phys_set_y' },
    ]},
    { kind: 'category', name: '👁️ Looks', colour: '#7b2f8e', contents: [
      { kind: 'block', type: 'looks_color' },
      { kind: 'block', type: 'looks_size' },
      { kind: 'block', type: 'looks_change_size' },
      { kind: 'block', type: 'looks_show' },
      { kind: 'block', type: 'looks_hide' },
      { kind: 'block', type: 'looks_ghost' },
      { kind: 'block', type: 'looks_say' },
      { kind: 'block', type: 'looks_say_for' },
      { kind: 'block', type: 'looks_rotate' },
      { kind: 'block', type: 'looks_set_rotation' },
      { kind: 'block', type: 'looks_camera_follow' },
      { kind: 'block', type: 'looks_layer' },
    ]},
    { kind: 'category', name: '🔊 Sound', colour: '#c94fc9', contents: [
      { kind: 'block', type: 'snd_play' },
      { kind: 'block', type: 'snd_play_uploaded' },
      { kind: 'block', type: 'snd_volume' },
      { kind: 'block', type: 'snd_stop' },
    ]},
    { kind: 'category', name: '🔢 Math', colour: '#49a249', contents: [
      { kind: 'block', type: 'math_set_var' },
      { kind: 'block', type: 'math_change_var' },
      { kind: 'block', type: 'math_set_score' },
      { kind: 'block', type: 'math_change_score' },
      { kind: 'block', type: 'math_reset_score' },
      { kind: 'block', type: 'math_log_score' },
      { kind: 'block', type: 'math_random' },
      { kind: 'block', type: 'math_log_vars' },
    ]},
    { kind: 'category', name: '📁 File', colour: '#2e8e8e', contents: [
      { kind: 'block', type: 'file_save' },
      { kind: 'block', type: 'file_load' },
      { kind: 'block', type: 'file_export' },
      { kind: 'block', type: 'file_import' },
      { kind: 'block', type: 'file_delete' },
    ]},
    { kind: 'category', name: '📋 Logs', colour: '#888888', contents: [
      { kind: 'block', type: 'log_msg' },
      { kind: 'block', type: 'log_var' },
    ]},
    { kind: 'category', name: '📚 Library', colour: '#17becf', contents: [
      { kind: 'block', type: 'lib_player_controls' },
      { kind: 'block', type: 'lib_platform_lr' },
      { kind: 'block', type: 'lib_platform_ud' },
    ]},
  ]
};

var INJECT_OPTIONS: any = {
  toolbox: TOOLBOX,
  grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
  zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 3, minScale: 0.3 },
  trashcan: true,
  media: '',
  sounds: false,
  renderer: 'geras',
};

var BlocklyWorkspace = forwardRef(function BlocklyWorkspace(props: Props, ref: any) {
  var selectedSpriteId = props.selectedSpriteId;
  var onScriptsChange = props.onScriptsChange;
  var onLog = props.onLog;
  var containerRef = useRef<HTMLDivElement>(null);
  var workspaceRef = useRef<any>(null);
  var spriteDataMap = useRef<Record<string, any>>({});
  var isSwapping = useRef(false);
  var onScriptsChangeRef = useRef(onScriptsChange);
  var prevSpriteIdRef = useRef(selectedSpriteId);
  var currentSpriteIdRef = useRef(selectedSpriteId);
  var didInit = useRef(false);

  onScriptsChangeRef.current = onScriptsChange;
  currentSpriteIdRef.current = selectedSpriteId;

  function extractBlocks(workspace: any): PlacedBlock[] {
    var result: PlacedBlock[] = [];
    var tops = workspace.getTopBlocks(true);
    var done = new Set<string>();

    function walk(block: any, prev?: string, parent?: string) {
      if (!block || done.has(block.id)) return;
      done.add(block.id);

      var inputs: string[] = [];
      var il = block.inputList || [];
      for (var i = 0; i < il.length; i++) {
        var row = il[i].fieldRow || [];
        for (var k = 0; k < row.length; k++) {
          if (row[k].name && row[k].getValue) {
            inputs.push(String(row[k].getValue()));
          }
        }
      }

      var pos = block.getRelativeToSurfaceXY ? block.getRelativeToSurfaceXY() : { x: 0, y: 0 };
      var pb: PlacedBlock = {
        uid: block.id,
        blockId: block.type,
        inputs: inputs,
        x: pos.x,
        y: pos.y,
        spriteId: currentSpriteIdRef.current
      };
      if (prev) pb.prevUid = prev;
      if (parent) pb.parentUid = parent;

      var nb = block.getNextBlock ? block.getNextBlock() : null;
      if (nb && !done.has(nb.id)) pb.nextUid = nb.id;

      var doIn = block.getInput ? block.getInput('DO') : null;
      if (doIn && doIn.connection && doIn.connection.targetBlock()) {
        pb.innerUids = [];
        var c: any = doIn.connection.targetBlock();
        while (c && !done.has(c.id)) { pb.innerUids.push(c.id); c = c.getNextBlock ? c.getNextBlock() : null; }
      }

      var elIn = block.getInput ? block.getInput('ELSE') : null;
      if (elIn && elIn.connection && elIn.connection.targetBlock()) {
        pb.elseUids = [];
        var e: any = elIn.connection.targetBlock();
        while (e && !done.has(e.id)) { pb.elseUids.push(e.id); e = e.getNextBlock ? e.getNextBlock() : null; }
      }

      result.push(pb);

      if (doIn && doIn.connection && doIn.connection.targetBlock()) {
        var d: any = doIn.connection.targetBlock();
        while (d && !done.has(d.id)) { walk(d, undefined, block.id); d = d.getNextBlock ? d.getNextBlock() : null; }
      }
      if (elIn && elIn.connection && elIn.connection.targetBlock()) {
        var f: any = elIn.connection.targetBlock();
        while (f && !done.has(f.id)) { walk(f, undefined, block.id); f = f.getNextBlock ? f.getNextBlock() : null; }
      }
      if (nb && !done.has(nb.id)) walk(nb, block.id);
    }

    for (var t = 0; t < tops.length; t++) walk(tops[t]);
    return result;
  }

  function saveWs(ws: any, sid: string) {
    try {
      spriteDataMap.current[sid] = {
        type: 'json',
        data: Blockly.serialization.workspaces.save(ws)
      };
    } catch (_) {}
  }

  function loadWs(ws: any, sid: string) {
    try {
      var s = spriteDataMap.current[sid];
      if (s && s.type === 'json') {
        Blockly.serialization.workspaces.load(s.data, ws);
      }
    } catch (_) {}
  }

  useImperativeHandle(ref, function() {
    return {
      getAllWorkspaceData: function() {
        if (workspaceRef.current) saveWs(workspaceRef.current, currentSpriteIdRef.current);
        var copy: Record<string, any> = {};
        var keys = Object.keys(spriteDataMap.current);
        for (var i = 0; i < keys.length; i++) copy[keys[i]] = spriteDataMap.current[keys[i]];
        return copy;
      }
    };
  });

  useEffect(function() {
    if (!containerRef.current || didInit.current) return;
    didInit.current = true;

    registerAllBlocks();

    try {
      workspaceRef.current = Blockly.inject(containerRef.current, INJECT_OPTIONS);
      loadWs(workspaceRef.current, currentSpriteIdRef.current);

      workspaceRef.current.addChangeListener(function(ev: any) {
        if (isSwapping.current) return;
        var t = ev.type;
        if (!t || t === 'ui' || t === 'viewport_change' || t === 'toolbox_item_select' || t === 'click') return;
        if (t === 'create' || t === 'delete' || t === 'move' || t === 'change') {
          onScriptsChangeRef.current(extractBlocks(workspaceRef.current), currentSpriteIdRef.current);
        }
      });

      if (onLog) onLog('Blockly ready (geras renderer)');
    } catch (err) {
      if (onLog) onLog('Blockly error: ' + err);
    }

    return function() {
      if (workspaceRef.current) {
        try { workspaceRef.current.dispose(); } catch (_) {}
        workspaceRef.current = null;
      }
      didInit.current = false;
    };
  }, []);

  useEffect(function() {
    if (!workspaceRef.current || !didInit.current) return;
    var old = prevSpriteIdRef.current;
    prevSpriteIdRef.current = selectedSpriteId;
    if (old === selectedSpriteId) return;

    isSwapping.current = true;
    saveWs(workspaceRef.current, old);
    try { workspaceRef.current.clear(); } catch (_) {}
    loadWs(workspaceRef.current, selectedSpriteId);

    setTimeout(function() {
      isSwapping.current = false;
      if (workspaceRef.current) {
        onScriptsChangeRef.current(extractBlocks(workspaceRef.current), selectedSpriteId);
      }
    }, 100);
  }, [selectedSpriteId]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '300px' }} />;
});

export default BlocklyWorkspace;
