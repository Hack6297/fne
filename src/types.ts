export type BlockCategory = 'Controls' | 'Physics' | 'Looks' | 'Sound' | 'Math' | 'File' | 'Events' | 'Logs' | 'Library';
export type BlockShape = 'stack' | 'hat' | 'cap' | 'c-block' | 'reporter' | 'boolean';

export interface BlockDef {
  id: string;
  category: BlockCategory;
  label: string;
  inputs?: { type: 'number' | 'text' | 'dropdown'; placeholder?: string; options?: string[]; default?: string }[];
  color: string;
  isHat?: boolean;
  shape: BlockShape;
}

export interface PlacedBlock {
  uid: string;
  blockId: string;
  x: number;
  y: number;
  inputs: string[];
  nextUid: string | null;
  prevUid: string | null;
  innerUids: string[];
  elseUids: string[];
  spriteId: string;
}

export interface SpriteLibraryItem {
  id: string;
  name: string;
  icon: string;
  category: 'characters' | 'objects' | 'effects' | 'nature';
  color: string;
  shape: 'circle' | 'rect' | 'triangle' | 'custom';
  width: number;
  height: number;
}

export interface VectorPoint {
  x: number; y: number;
  cx1?: number; cy1?: number;
  cx2?: number; cy2?: number;
}

export interface VectorShape {
  type: 'rect' | 'circle' | 'line' | 'path' | 'text';
  x: number; y: number;
  width?: number; height?: number; radius?: number;
  fill: string; stroke: string; strokeWidth: number;
  rotation?: number; text?: string; points?: VectorPoint[];
}

export interface SoundSlot {
  id: string; name: string; url: string; duration?: number;
}

export interface ViewportObject {
  id: string;
  type: 'cube' | 'sphere' | 'plane' | 'ramp' | 'cylinder' | 'light' | 'camera' | 'trigger' | 'player' | 'physics_ball';
  x: number; y: number; width: number; height: number;
  color: string; name: string; zIndex: number;
  rotation?: number; vx?: number; vy?: number;
  mass?: number; bounce?: number; friction?: number;
  isStatic?: boolean; visible?: boolean; opacity?: number;
  hasGravity?: boolean; isGrounded?: boolean;
  speed?: number; jumpForce?: number; facingRight?: boolean;
  customImage?: string; customTexture?: string;
  vectorShapes?: VectorShape[]; spriteLibraryId?: string;
  sounds?: SoundSlot[];
  costumes?: { id: string; name: string; image?: string; shapes?: VectorShape[] }[];
  currentCostume?: number;
}

export interface LevelData {
  id: string; name: string; author: string; description: string;
  objects: ViewportObject[]; scripts: PlacedBlock[];
  likes: number; downloads: number; thumbnail?: string;
  createdAt: string; plays?: number; tags?: string[];
}

export interface ConsoleLog {
  id: string; type: 'info' | 'warn' | 'error' | 'log';
  message: string; timestamp: string;
}

export var SPRITE_LIBRARY: SpriteLibraryItem[] = [
  { id: 'spr_cat', name: 'Cat', icon: '🐱', category: 'characters', color: '#FF9F43', shape: 'custom', width: 40, height: 50 },
  { id: 'spr_dog', name: 'Dog', icon: '🐕', category: 'characters', color: '#A0522D', shape: 'custom', width: 45, height: 45 },
  { id: 'spr_robot', name: 'Robot', icon: '🤖', category: 'characters', color: '#95A5A6', shape: 'rect', width: 40, height: 50 },
  { id: 'spr_alien', name: 'Alien', icon: '👽', category: 'characters', color: '#2ECC71', shape: 'circle', width: 40, height: 45 },
  { id: 'spr_ghost', name: 'Ghost', icon: '👻', category: 'characters', color: '#ECF0F1', shape: 'custom', width: 35, height: 45 },
  { id: 'spr_wizard', name: 'Wizard', icon: '🧙', category: 'characters', color: '#8E44AD', shape: 'custom', width: 40, height: 55 },
  { id: 'spr_ninja', name: 'Ninja', icon: '🥷', category: 'characters', color: '#2C3E50', shape: 'custom', width: 38, height: 50 },
  { id: 'spr_astronaut', name: 'Astronaut', icon: '🧑‍🚀', category: 'characters', color: '#FAFAFA', shape: 'custom', width: 40, height: 55 },
  { id: 'spr_ball_red', name: 'Red Ball', icon: '🔴', category: 'objects', color: '#E74C3C', shape: 'circle', width: 30, height: 30 },
  { id: 'spr_ball_blue', name: 'Blue Ball', icon: '🔵', category: 'objects', color: '#3498DB', shape: 'circle', width: 30, height: 30 },
  { id: 'spr_star', name: 'Star', icon: '⭐', category: 'objects', color: '#F1C40F', shape: 'custom', width: 30, height: 30 },
  { id: 'spr_coin', name: 'Coin', icon: '🪙', category: 'objects', color: '#F39C12', shape: 'circle', width: 25, height: 25 },
  { id: 'spr_key', name: 'Key', icon: '🔑', category: 'objects', color: '#FFD700', shape: 'custom', width: 25, height: 15 },
  { id: 'spr_gem', name: 'Gem', icon: '💎', category: 'objects', color: '#00CED1', shape: 'custom', width: 25, height: 25 },
  { id: 'spr_heart', name: 'Heart', icon: '❤️', category: 'objects', color: '#E74C3C', shape: 'custom', width: 28, height: 25 },
  { id: 'spr_box', name: 'Crate', icon: '📦', category: 'objects', color: '#D4A574', shape: 'rect', width: 40, height: 40 },
  { id: 'spr_fire', name: 'Fire', icon: '🔥', category: 'effects', color: '#FF6B35', shape: 'custom', width: 30, height: 40 },
  { id: 'spr_spark', name: 'Sparkle', icon: '✨', category: 'effects', color: '#FFE066', shape: 'custom', width: 25, height: 25 },
  { id: 'spr_cloud', name: 'Cloud', icon: '☁️', category: 'nature', color: '#ECF0F1', shape: 'custom', width: 60, height: 35 },
  { id: 'spr_tree', name: 'Tree', icon: '🌳', category: 'nature', color: '#27AE60', shape: 'custom', width: 50, height: 60 },
  { id: 'spr_flower', name: 'Flower', icon: '🌸', category: 'nature', color: '#FF69B4', shape: 'custom', width: 25, height: 30 },
  { id: 'spr_rock', name: 'Rock', icon: '🪨', category: 'nature', color: '#7F8C8D', shape: 'custom', width: 40, height: 30 },
  { id: 'spr_mushroom', name: 'Mushroom', icon: '🍄', category: 'nature', color: '#E74C3C', shape: 'custom', width: 30, height: 30 },
  { id: 'spr_sun', name: 'Sun', icon: '☀️', category: 'nature', color: '#F1C40F', shape: 'circle', width: 50, height: 50 },
];

export var BLOCK_CATEGORIES: { name: BlockCategory; color: string; cssClass: string; icon: string }[] = [
  { name: 'Events', color: '#C88330', cssClass: 'block-events', icon: '⚡' },
  { name: 'Controls', color: '#E1A820', cssClass: 'block-controls', icon: '🎮' },
  { name: 'Physics', color: '#4A6CD4', cssClass: 'block-physics', icon: '🔧' },
  { name: 'Looks', color: '#8B45A6', cssClass: 'block-looks', icon: '👁️' },
  { name: 'Sound', color: '#7B2F7B', cssClass: 'block-sound', icon: '🔊' },
  { name: 'Math', color: '#62B562', cssClass: 'block-math', icon: '🔢' },
  { name: 'File', color: '#4C9BBD', cssClass: 'block-file', icon: '📁' },
  { name: 'Logs', color: '#CF4A5E', cssClass: 'block-logs', icon: '📋' },
  { name: 'Library', color: '#00BCD4', cssClass: 'block-library', icon: '📚' },
];

var ALL_KEY_OPTIONS = ['Any','W','A','S','D','Space','Enter','Escape','Shift','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','1','2','3','4','5','Q','E','R','F'];

var IF_CONDITIONS = [
  'true', 'false',
  'key W held','key A held','key S held','key D held','key Space held',
  'key ArrowUp held','key ArrowDown held','key ArrowLeft held','key ArrowRight held',
  'key Enter held','key Shift held','key Q held','key E held',
  'touching ground','touching edge',
  'not touching ground',
  'score > 0', 'score < 0', 'score = 0', 'score > 10', 'score > 100',
  'lives > 0', 'lives = 0',
  'health > 0', 'health = 0',
  'mouse down',
];

export var BLOCK_DEFINITIONS: BlockDef[] = [
  // ===== EVENTS =====
  { id: 'evt_start', category: 'Events', label: '▶ when green button clicked', inputs: [], color: '#C88330', isHat: true, shape: 'hat' },
  { id: 'evt_stop_clicked', category: 'Events', label: '🛑 when stop button clicked', inputs: [], color: '#C88330', isHat: true, shape: 'hat' },
  { id: 'evt_key_press', category: 'Events', label: 'when key pressed', inputs: [{ type: 'dropdown', options: ALL_KEY_OPTIONS, default: 'Any' }], color: '#C88330', isHat: true, shape: 'hat' },
  { id: 'evt_click', category: 'Events', label: 'when this sprite clicked', inputs: [], color: '#C88330', isHat: true, shape: 'hat' },
  { id: 'evt_message', category: 'Events', label: 'when I receive', inputs: [{ type: 'text', placeholder: 'message', default: 'msg1' }], color: '#C88330', isHat: true, shape: 'hat' },
  { id: 'evt_broadcast', category: 'Events', label: 'broadcast', inputs: [{ type: 'text', placeholder: 'message', default: 'msg1' }], color: '#C88330', shape: 'stack' },
  { id: 'evt_collision', category: 'Events', label: 'when touching', inputs: [{ type: 'dropdown', options: ['Any','Edge','Ground','Platform'], default: 'Any' }], color: '#C88330', isHat: true, shape: 'hat' },

  // ===== CONTROLS (flow only — NO movement) =====
  { id: 'ctrl_forever', category: 'Controls', label: 'forever', inputs: [], color: '#E1A820', shape: 'c-block' },
  { id: 'ctrl_if', category: 'Controls', label: 'if', inputs: [{ type: 'dropdown', options: IF_CONDITIONS, default: 'true' }], color: '#E1A820', shape: 'c-block' },
  { id: 'ctrl_if_else', category: 'Controls', label: 'if — else', inputs: [{ type: 'dropdown', options: IF_CONDITIONS, default: 'true' }], color: '#E1A820', shape: 'c-block' },
  { id: 'ctrl_repeat', category: 'Controls', label: 'repeat', inputs: [{ type: 'number', placeholder: '10', default: '10' }], color: '#E1A820', shape: 'c-block' },
  { id: 'ctrl_wait', category: 'Controls', label: 'wait seconds', inputs: [{ type: 'number', placeholder: '1', default: '1' }], color: '#E1A820', shape: 'stack' },
  { id: 'ctrl_stop', category: 'Controls', label: 'stop all', inputs: [], color: '#E1A820', shape: 'cap' },
  { id: 'ctrl_set_speed', category: 'Controls', label: 'set speed to', inputs: [{ type: 'number', placeholder: '3', default: '3' }], color: '#E1A820', shape: 'stack' },
  { id: 'ctrl_go_to', category: 'Controls', label: 'go to x: y:', inputs: [{ type: 'number', placeholder: '100', default: '100' }, { type: 'number', placeholder: '200', default: '200' }], color: '#E1A820', shape: 'stack' },
  { id: 'ctrl_glide', category: 'Controls', label: 'glide to x: y:', inputs: [{ type: 'number', placeholder: '200', default: '200' }, { type: 'number', placeholder: '150', default: '150' }], color: '#E1A820', shape: 'stack' },

  // ===== PHYSICS (forces + movement + jump) =====
  { id: 'phys_gravity', category: 'Physics', label: 'set gravity to', inputs: [{ type: 'number', placeholder: '0.5', default: '0.5' }], color: '#4A6CD4', shape: 'stack' },
  { id: 'phys_jump', category: 'Physics', label: 'jump with force', inputs: [{ type: 'number', placeholder: '12', default: '12' }], color: '#4A6CD4', shape: 'stack' },
  { id: 'phys_change_x', category: 'Physics', label: 'change x by', inputs: [{ type: 'number', placeholder: '10', default: '10' }], color: '#4A6CD4', shape: 'stack' },
  { id: 'phys_change_y', category: 'Physics', label: 'change y by', inputs: [{ type: 'number', placeholder: '10', default: '10' }], color: '#4A6CD4', shape: 'stack' },
  { id: 'phys_set_x', category: 'Physics', label: 'set x to', inputs: [{ type: 'number', placeholder: '100', default: '100' }], color: '#4A6CD4', shape: 'stack' },
  { id: 'phys_set_y', category: 'Physics', label: 'set y to', inputs: [{ type: 'number', placeholder: '100', default: '100' }], color: '#4A6CD4', shape: 'stack' },
  { id: 'phys_add_force', category: 'Physics', label: 'add force x: y:', inputs: [{ type: 'number', placeholder: '0', default: '0' }, { type: 'number', placeholder: '-10', default: '-10' }], color: '#4A6CD4', shape: 'stack' },
  { id: 'phys_set_mass', category: 'Physics', label: 'set mass to', inputs: [{ type: 'number', placeholder: '1', default: '1' }], color: '#4A6CD4', shape: 'stack' },
  { id: 'phys_set_bounce', category: 'Physics', label: 'set bounciness to', inputs: [{ type: 'number', placeholder: '0.5', default: '0.5' }], color: '#4A6CD4', shape: 'stack' },
  { id: 'phys_set_friction', category: 'Physics', label: 'set friction to', inputs: [{ type: 'number', placeholder: '0.3', default: '0.3' }], color: '#4A6CD4', shape: 'stack' },
  { id: 'phys_velocity_x', category: 'Physics', label: 'set velocity x to', inputs: [{ type: 'number', placeholder: '0', default: '0' }], color: '#4A6CD4', shape: 'stack' },
  { id: 'phys_velocity_y', category: 'Physics', label: 'set velocity y to', inputs: [{ type: 'number', placeholder: '0', default: '0' }], color: '#4A6CD4', shape: 'stack' },
  { id: 'phys_enable_gravity', category: 'Physics', label: 'enable gravity', inputs: [], color: '#4A6CD4', shape: 'stack' },
  { id: 'phys_disable_gravity', category: 'Physics', label: 'disable gravity', inputs: [], color: '#4A6CD4', shape: 'stack' },
  { id: 'phys_make_static', category: 'Physics', label: 'make static', inputs: [], color: '#4A6CD4', shape: 'stack' },
  { id: 'phys_make_dynamic', category: 'Physics', label: 'make dynamic', inputs: [], color: '#4A6CD4', shape: 'stack' },

  // ===== LOOKS =====
  { id: 'looks_set_color', category: 'Looks', label: 'set color to', inputs: [{ type: 'dropdown', options: ['Red','Blue','Green','Yellow','Purple','White','Black','Orange','Cyan','Pink'], default: 'Red' }], color: '#8B45A6', shape: 'stack' },
  { id: 'looks_set_size', category: 'Looks', label: 'set size w: h:', inputs: [{ type: 'number', placeholder: '50', default: '50' }, { type: 'number', placeholder: '50', default: '50' }], color: '#8B45A6', shape: 'stack' },
  { id: 'looks_change_size', category: 'Looks', label: 'change size by', inputs: [{ type: 'number', placeholder: '10', default: '10' }], color: '#8B45A6', shape: 'stack' },
  { id: 'looks_show', category: 'Looks', label: 'show', inputs: [], color: '#8B45A6', shape: 'stack' },
  { id: 'looks_hide', category: 'Looks', label: 'hide', inputs: [], color: '#8B45A6', shape: 'stack' },
  { id: 'looks_set_opacity', category: 'Looks', label: 'set ghost effect to %', inputs: [{ type: 'number', placeholder: '0', default: '0' }], color: '#8B45A6', shape: 'stack' },
  { id: 'looks_say', category: 'Looks', label: 'say', inputs: [{ type: 'text', placeholder: 'Hello!', default: 'Hello!' }], color: '#8B45A6', shape: 'stack' },
  { id: 'looks_say_sec', category: 'Looks', label: 'say for secs', inputs: [{ type: 'text', placeholder: 'Hello!', default: 'Hello!' }, { type: 'number', placeholder: '2', default: '2' }], color: '#8B45A6', shape: 'stack' },
  { id: 'looks_rotate', category: 'Looks', label: 'turn ↻ degrees', inputs: [{ type: 'number', placeholder: '15', default: '15' }], color: '#8B45A6', shape: 'stack' },
  { id: 'looks_set_rotation', category: 'Looks', label: 'set rotation to', inputs: [{ type: 'number', placeholder: '0', default: '0' }], color: '#8B45A6', shape: 'stack' },
  { id: 'looks_camera_follow', category: 'Looks', label: 'camera follow this', inputs: [], color: '#8B45A6', shape: 'stack' },
  { id: 'looks_set_layer', category: 'Looks', label: 'set layer to', inputs: [{ type: 'number', placeholder: '1', default: '1' }], color: '#8B45A6', shape: 'stack' },

  // ===== SOUND =====
  { id: 'snd_play', category: 'Sound', label: 'play sound', inputs: [{ type: 'dropdown', options: ['Jump','Coin','Hit','Explosion','Click','Win','Lose','Powerup'], default: 'Jump' }], color: '#7B2F7B', shape: 'stack' },
  { id: 'snd_play_uploaded', category: 'Sound', label: 'play uploaded sound', inputs: [{ type: 'dropdown', options: ['Sound 1','Sound 2','Sound 3','Sound 4','Sound 5'], default: 'Sound 1' }], color: '#7B2F7B', shape: 'stack' },
  { id: 'snd_stop', category: 'Sound', label: 'stop all sounds', inputs: [], color: '#7B2F7B', shape: 'stack' },
  { id: 'snd_volume', category: 'Sound', label: 'set volume to %', inputs: [{ type: 'number', placeholder: '100', default: '100' }], color: '#7B2F7B', shape: 'stack' },
  { id: 'snd_beep', category: 'Sound', label: 'play note', inputs: [{ type: 'number', placeholder: '60', default: '60' }], color: '#7B2F7B', shape: 'stack' },
  { id: 'snd_drum', category: 'Sound', label: 'play drum', inputs: [{ type: 'dropdown', options: ['Snare','Bass','HiHat','Clap','Tom'], default: 'Snare' }], color: '#7B2F7B', shape: 'stack' },

  // ===== MATH =====
  { id: 'math_set_var', category: 'Math', label: 'set variable to', inputs: [{ type: 'text', placeholder: 'myVar', default: 'myVar' }, { type: 'number', placeholder: '0', default: '0' }], color: '#62B562', shape: 'stack' },
  { id: 'math_change_var', category: 'Math', label: 'change variable by', inputs: [{ type: 'text', placeholder: 'myVar', default: 'myVar' }, { type: 'number', placeholder: '1', default: '1' }], color: '#62B562', shape: 'stack' },
  { id: 'math_set_score', category: 'Math', label: 'set score to', inputs: [{ type: 'number', placeholder: '0', default: '0' }], color: '#62B562', shape: 'stack' },
  { id: 'math_change_score', category: 'Math', label: 'change score by', inputs: [{ type: 'number', placeholder: '1', default: '1' }], color: '#62B562', shape: 'stack' },
  { id: 'math_random', category: 'Math', label: 'set var to random', inputs: [{ type: 'text', placeholder: 'myVar', default: 'myVar' }, { type: 'number', placeholder: '1', default: '1' }, { type: 'number', placeholder: '10', default: '10' }], color: '#62B562', shape: 'stack' },
  { id: 'math_log_score', category: 'Math', label: 'log score', inputs: [], color: '#62B562', shape: 'stack' },
  { id: 'math_reset_score', category: 'Math', label: 'reset score to 0', inputs: [], color: '#62B562', shape: 'stack' },

  // ===== FILE =====
  { id: 'file_save', category: 'File', label: 'save game as', inputs: [{ type: 'text', placeholder: 'SaveName', default: 'MyLevel' }], color: '#4C9BBD', shape: 'stack' },
  { id: 'file_load', category: 'File', label: 'load game', inputs: [{ type: 'text', placeholder: 'SaveName', default: 'MyLevel' }], color: '#4C9BBD', shape: 'stack' },
  { id: 'file_export', category: 'File', label: 'export as JSON', inputs: [], color: '#4C9BBD', shape: 'stack' },
  { id: 'file_import', category: 'File', label: 'import level JSON', inputs: [], color: '#4C9BBD', shape: 'stack' },
  { id: 'file_delete_save', category: 'File', label: 'delete save', inputs: [{ type: 'text', placeholder: 'SaveName', default: 'MyLevel' }], color: '#4C9BBD', shape: 'stack' },

  // ===== LOGS =====
  { id: 'log_print', category: 'Logs', label: 'log', inputs: [{ type: 'text', placeholder: 'Hello!', default: 'Hello!' }], color: '#CF4A5E', shape: 'stack' },
  { id: 'log_warn', category: 'Logs', label: 'warn', inputs: [{ type: 'text', placeholder: 'Warning!', default: 'Warning!' }], color: '#CF4A5E', shape: 'stack' },
  { id: 'log_error', category: 'Logs', label: 'error', inputs: [{ type: 'text', placeholder: 'Error!', default: 'Error!' }], color: '#CF4A5E', shape: 'stack' },
  { id: 'log_var', category: 'Logs', label: 'log variable', inputs: [{ type: 'text', placeholder: 'score', default: 'score' }], color: '#CF4A5E', shape: 'stack' },
  { id: 'log_clear', category: 'Logs', label: 'clear console', inputs: [], color: '#CF4A5E', shape: 'stack' },
  { id: 'log_all_vars', category: 'Logs', label: 'log all variables', inputs: [], color: '#CF4A5E', shape: 'stack' },

  // ===== LIBRARY (pre-built behaviors) =====
  { id: 'lib_player_controls', category: 'Library', label: '🎮 Simple Player Controls', inputs: [], color: '#00BCD4', shape: 'stack' },
  { id: 'lib_platform_lr', category: 'Library', label: '↔️ Platform Move Left-Right', inputs: [{ type: 'number', placeholder: '100', default: '100' }, { type: 'number', placeholder: '2', default: '2' }], color: '#00BCD4', shape: 'stack' },
  { id: 'lib_platform_ud', category: 'Library', label: '↕️ Platform Move Up-Down', inputs: [{ type: 'number', placeholder: '80', default: '80' }, { type: 'number', placeholder: '2', default: '2' }], color: '#00BCD4', shape: 'stack' },
];
