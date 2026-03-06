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

const BlocklyWorkspace = forwardRef(function BlocklyWorkspace(props: Props, ref: any) {
  const { selectedSpriteId, onScriptsChange, onLog } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<any>(null);
  const spriteDataMap = useRef<Record<string, any>>({});
  const isSwapping = useRef(false);
  const onScriptsChangeRef = useRef(onScriptsChange);
  const prevSpriteIdRef = useRef(selectedSpriteId);
  const currentSpriteIdRef = useRef(selectedSpriteId);
  const didInit = useRef(false);

  onScriptsChangeRef.current = onScriptsChange;
  currentSpriteIdRef.current = selectedSpriteId;

  function registerBlocks() {
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
      { id: 'log_var', msg: 'log variable %1', color: '#888888', prev: true, next: true, args: [{ type: 
