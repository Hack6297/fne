import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

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

const BlocklyWorkspace = forwardRef(function BlocklyWorkspace(props: Props, ref: any) {
  const { selectedSpriteId, onScriptsChange, onLog } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<any>(null);
  const spriteDataMap = useRef<Record<string, any>>({});
  const isSwapping = useRef(false);
  const onScriptsChangeRef = useRef(onScriptsChange);
  const selectedSpriteIdRef = useRef(selectedSpriteId);
  const didInit = useRef(false);

  onScriptsChangeRef.current = onScriptsChange;
  selectedSpriteIdRef.current = selectedSpriteId;

  function registerBlocks(Blockly: any) {
    var blocks: any[] = [
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

    for (var i = 0; i < blocks.length; i++) {
      (function(b) {
        if (Blockly.Blocks[b.id]) return;
        Blockly.Blocks[b.id] = {
          init: function() {
            var json: any = {
              type: b.id,
              colour: b.color,
              tooltip: b.msg,
            };
            if (b.cblock) {
              if (b.hasElse) {
                json.message0 = b.msg;
                json.args0 = b.args || [];
                json.message1 = '%1';
                json.args1 = [{ type: 'input_statement', name: 'DO' }];
                json.message2 = 'else';
                json.message3 = '%1';
                json.args3 = [{ type: 'input_statement', name: 'ELSE' }];
                json.previousStatement = null;
                json.nextStatement = null;
              } else {
                json.message0 = b.msg;
                json.args0 = b.args || [];
                json.message1 = '%1';
                json.args1 = [{ type: 'input_statement', name: 'DO' }];
                json.previousStatement = null;
                json.nextStatement = null;
              }
            } else {
              json.message0 = b.msg;
              json.args0 = b.args || [];
              if (b.prev) json.previousStatement = null;
              if (b.next) json.nextStatement = null;
            }
            if (b.hat) {
              json.previousStatement = undefined;
              delete json.previousStatement;
            }
            this.jsonInit(json);
            if (b.hat) {
              this.setDeletable(true);
              this.setMovable(true);
            }
          }
        };
      })(blocks[i]);
    }
  }

  function extractBlocks(workspace: any): PlacedBlock[] {
    var result: PlacedBlock[] = [];
    var allBlocks = workspace.getTopBlocks(true);
    var processed = new Set<string>();

    function processBlock(block: any, prevUid?: string, parentUid?: string) {
      if (!block || processed.has(block.id)) return;
      processed.add(block.id);

      var inputs: string[] = [];
      var inputList = block.inputList || [];
      for (var i = 0; i < inputList.length; i++) {
        var inp = inputList[i];
        if (inp.fieldRow) {
          for (var j = 0; j < inp.fieldRow.length; j++) {
            var f = inp.fieldRow[j];
            if (f.name && f.getValue) {
              inputs.push(String(f.getValue()));
            }
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
        spriteId: selectedSpriteIdRef.current
      };

      if (prevUid) pb.prevUid = prevUid;
      if (parentUid) pb.parentUid = parentUid;

      var nextBlock = block.getNextBlock ? block.getNextBlock() : null;
      if (nextBlock && !processed.has(nextBlock.id)) {
        pb.nextUid = nextBlock.id;
      }

      var doInput = block.getInput ? block.getInput('DO') : null;
      if (doInput && doInput.connection && doInput.connection.targetBlock()) {
        var innerBlock = doInput.connection.targetBlock();
        pb.innerUids = [];
        var cur = innerBlock;
        while (cur && !processed.has(cur.id)) {
          pb.innerUids.push(cur.id);
          cur = cur.getNextBlock ? cur.getNextBlock() : null;
        }
      }

      var elseInput = block.getInput ? block.getInput('ELSE') : null;
      if (elseInput && elseInput.connection && elseInput.connection.targetBlock()) {
        var elseBlock = elseInput.connection.targetBlock();
        pb.elseUids = [];
        var cur2 = elseBlock;
        while (cur2 && !processed.has(cur2.id)) {
          pb.elseUids.push(cur2.id);
          cur2 = cur2.getNextBlock ? cur2.getNextBlock() : null;
        }
      }

      result.push(pb);

      if (doInput && doInput.connection && doInput.connection.targetBlock()) {
        var ib = doInput.connection.targetBlock();
        while (ib && !processed.has(ib.id)) {
          processBlock(ib, undefined, block.id);
          ib = ib.getNextBlock ? ib.getNextBlock() : null;
        }
      }

      if (elseInput && elseInput.connection && elseInput.connection.targetBlock()) {
        var eb = elseInput.connection.targetBlock();
        while (eb && !processed.has(eb.id)) {
          processBlock(eb, undefined, block.id);
          eb = eb.getNextBlock ? eb.getNextBlock() : null;
        }
      }

      if (nextBlock && !processed.has(nextBlock.id)) {
        processBlock(nextBlock, block.id);
      }
    }

    for (var t = 0; t < allBlocks.length; t++) {
      processBlock(allBlocks[t]);
    }
    return result;
  }

  function saveWorkspace(ws: any) {
    try {
      if ((window as any).Blockly && (window as any).Blockly.serialization) {
        spriteDataMap.current[selectedSpriteIdRef.current] = {
          type: 'json',
          data: (window as any).Blockly.serialization.workspaces.save(ws)
        };
      }
    } catch (e) {
      // ignore
    }
  }

  function loadWorkspace(ws: any, spriteId: string) {
    try {
      var saved = spriteDataMap.current[spriteId];
      if (saved && saved.type === 'json' && (window as any).Blockly && (window as any).Blockly.serialization) {
        (window as any).Blockly.serialization.workspaces.load(saved.data, ws);
      }
    } catch (e) {
      // ignore
    }
  }

  useImperativeHandle(ref, function() {
    return {
      getAllWorkspaceData: function() {
        if (workspaceRef.current) {
          saveWorkspace(workspaceRef.current);
        }
        var copy: Record<string, any> = {};
        var keys = Object.keys(spriteDataMap.current);
        for (var i = 0; i < keys.length; i++) {
          copy[keys[i]] = spriteDataMap.current[keys[i]];
        }
        return copy;
      }
    };
  });

  useEffect(function() {
    var Blockly = (window as any).Blockly;
    if (!Blockly || !containerRef.current || didInit.current) return;
    didInit.current = true;

    try {
      registerBlocks(Blockly);
    } catch (e) {
      // ignore
    }

    var toolbox = {
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

    try {
      workspaceRef.current = Blockly.inject(containerRef.current, {
        toolbox: toolbox,
        grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
        zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 3, minScale: 0.3 },
        trashcan: true,
        media: '',
        sounds: false,
        renderer: 'zelos',
      });

      loadWorkspace(workspaceRef.current, selectedSpriteIdRef.current);

      workspaceRef.current.addChangeListener(function(e: any) {
        if (isSwapping.current) return;
        if (!e.type || e.type === 'ui' || e.type === 'viewport_change' || e.type === 'toolbox_item_select' || e.type === 'click') return;
        if (e.type === 'create' || e.type === 'delete' || e.type === 'move' || e.type === 'change') {
          var blocks = extractBlocks(workspaceRef.current);
          onScriptsChangeRef.current(blocks, selectedSpriteIdRef.current);
        }
      });

      if (onLog) onLog('Blockly workspace ready');
    } catch (e) {
      if (onLog) onLog('Blockly init error: ' + e);
    }

    return function() {
      if (workspaceRef.current) {
        try { workspaceRef.current.dispose(); } catch (e) {}
        workspaceRef.current = null;
      }
      didInit.current = false;
    };
  }, []);

  useEffect(function() {
    if (!workspaceRef.current || !didInit.current) return;
    isSwapping.current = true;
    saveWorkspace(workspaceRef.current);
    try { workspaceRef.current.clear(); } catch (e) {}
    loadWorkspace(workspaceRef.current, selectedSpriteId);
    setTimeout(function() {
      isSwapping.current = false;
      if (workspaceRef.current) {
        var blocks = extractBlocks(workspaceRef.current);
        onScriptsChangeRef.current(blocks, selectedSpriteId);
      }
    }, 100);
  }, [selectedSpriteId]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '300px' }} />
  );
});

export default BlocklyWorkspace;
