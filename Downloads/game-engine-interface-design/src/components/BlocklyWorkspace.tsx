import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import { PlacedBlock } from '../types';

interface StickyNote { id: string; x: number; y: number; text: string; color: string; }

interface Props {
  selectedSpriteId: string;
  onScriptsChange: (blocks: PlacedBlock[]) => void;
  initialWorkspaceData?: Record<string, any>;
}

export interface BlocklyWorkspaceHandle {
  getAllWorkspaceData: () => Record<string, any>;
}

var BlocklyWorkspaceComponent = forwardRef<BlocklyWorkspaceHandle, Props>(function BWC(props, ref) {
  var containerRef = useRef<HTMLDivElement>(null);
  var wsRef = useRef<Blockly.WorkspaceSvg | null>(null);
  var spriteXml = useRef<Record<string, any>>({});
  var curSprite = useRef(props.selectedSpriteId);
  var swapping = useRef(false);
  var cbRef = useRef(props.onScriptsChange);
  var sidRef = useRef(props.selectedSpriteId);
  var notesRef = useRef<StickyNote[]>([]);
  var notesDivRef = useRef<HTMLDivElement>(null);
  var didInit = useRef(false);
  var didLoadInit = useRef(false);

  cbRef.current = props.onScriptsChange;
  sidRef.current = props.selectedSpriteId;

  useEffect(function() {
    if (props.initialWorkspaceData && !didLoadInit.current) {
      spriteXml.current = JSON.parse(JSON.stringify(props.initialWorkspaceData));
      didLoadInit.current = true;
    }
  }, [props.initialWorkspaceData]);

  var save = useCallback(function(w: Blockly.WorkspaceSvg) {
    if (!w) return null;
    try { return { type: 'json', data: Blockly.serialization.workspaces.save(w) }; }
    catch(_) { return null; }
  }, []);

  var load = useCallback(function(w: Blockly.WorkspaceSvg, d: any) {
    if (!w || !d) return false;
    try {
      if (d.type === 'json' && d.data) { Blockly.serialization.workspaces.load(d.data, w); return true; }
    } catch(_) {}
    return false;
  }, []);

  useImperativeHandle(ref, function() {
    return {
      getAllWorkspaceData: function() {
        var w = wsRef.current;
        if (w) { var d = save(w); if (d) spriteXml.current[curSprite.current] = d; }
        return JSON.parse(JSON.stringify(spriteXml.current));
      }
    };
  }, [save]);

  var getBlocks = useCallback(function(): PlacedBlock[] {
    var w = wsRef.current;
    if (!w) return [];
    try {
      var tops = w.getTopBlocks(true);
      var res: PlacedBlock[] = [];
      var seen = new Set<string>();

      var proc = function(b: Blockly.Block, pv: string|null): string|undefined {
        if (!b || seen.has(b.id)) return undefined;
        seen.add(b.id);
        var inp: string[] = [];
        var il = b.inputList || [];
        for (var i = 0; i < il.length; i++) {
          var fr = il[i].fieldRow || [];
          for (var j = 0; j < fr.length; j++) {
            var f = fr[j];
            if (f.name && f.getValue) inp.push(String(f.getValue()));
          }
        }
        var pos = b.getRelativeToSurfaceXY();
        var pb: PlacedBlock = {
          uid: b.id, blockId: b.type, inputs: inp,
          x: pos.x, y: pos.y, nextUid: null, prevUid: pv,
          innerUids: [], elseUids: [], spriteId: sidRef.current,
        };

        var doIn = b.getInput('DO') || b.getInput('DO0');
        if (doIn && doIn.connection && doIn.connection.targetBlock()) {
          var ib: Blockly.Block|null = doIn.connection.targetBlock();
          var lu: string|null = null;
          while (ib && !seen.has(ib.id)) {
            var u = proc(ib, lu);
            if (u) {
              pb.innerUids.push(u);
              if (lu) { var p = res.find(function(r){return r.uid===lu}); if(p) p.nextUid=u; }
              lu = u;
            }
            ib = ib.getNextBlock();
          }
        }

        var elIn = b.getInput('ELSE') || b.getInput('DO1');
        if (elIn && elIn.connection && elIn.connection.targetBlock()) {
          var eb: Blockly.Block|null = elIn.connection.targetBlock();
          var lu2: string|null = null;
          while (eb && !seen.has(eb.id)) {
            var u2 = proc(eb, lu2);
            if (u2) {
              pb.elseUids.push(u2);
              if (lu2) { var p2 = res.find(function(r){return r.uid===lu2}); if(p2) p2.nextUid=u2; }
              lu2 = u2;
            }
            eb = eb.getNextBlock();
          }
        }

        res.push(pb);
        return b.id;
      };

      for (var t = 0; t < tops.length; t++) {
        var c: Blockly.Block|null = tops[t];
        var pU: string|null = null;
        while (c && !seen.has(c.id)) {
          var uid = proc(c, pU);
          if (uid && pU) { var pp = res.find(function(r){return r.uid===pU}); if(pp) pp.nextUid=uid; }
          pU = uid || null;
          c = c.getNextBlock();
        }
      }
      return res;
    } catch(_) { return []; }
  }, []);

  useEffect(function() {
    if (didInit.current) return;
    if (!containerRef.current) return;
    didInit.current = true;

    try {
      var conds: [string,string][] = [
        ['key w held','key w held'],['key a held','key a held'],['key s held','key s held'],['key d held','key d held'],
        ['key space held','key space held'],['key up held','key ArrowUp held'],['key down held','key ArrowDown held'],
        ['key left held','key ArrowLeft held'],['key right held','key ArrowRight held'],
        ['touching ground','touching ground'],['touching edge','touching edge'],['not touching ground','not touching ground'],
        ['score > 0','score > 0'],['score > 10','score > 10'],['score = 0','score = 0'],
      ];

      var defs: Record<string,any> = {
        evt_start:{message0:'▶ when green button clicked',colour:'#E6A822',hat:true,next:true},
        evt_key_pressed:{message0:'when key %1 pressed',args0:[{type:'field_dropdown',name:'KEY',options:[['space','space'],['w','w'],['a','a'],['s','s'],['d','d'],['up arrow','ArrowUp'],['down arrow','ArrowDown'],['left arrow','ArrowLeft'],['right arrow','ArrowRight'],['any','any']]}],colour:'#E6A822',hat:true,next:true},
        evt_clicked:{message0:'when this sprite clicked',colour:'#E6A822',hat:true,next:true},
        evt_touching:{message0:'when touching %1',args0:[{type:'field_dropdown',name:'TARGET',options:[['edge','edge'],['other sprite','sprite'],['ground','ground']]}],colour:'#E6A822',hat:true,next:true},
        evt_stop_clicked:{message0:'⏹ when stop button clicked',colour:'#E6A822',hat:true,next:true},

        ctrl_forever:{message0:'forever',message1:'%1',args1:[{type:'input_statement',name:'DO'}],colour:'#4C97FF',prev:true},
        ctrl_if:{message0:'if %1 then',args0:[{type:'field_dropdown',name:'COND',options:conds}],message1:'%1',args1:[{type:'input_statement',name:'DO'}],colour:'#4C97FF',prev:true,next:true},
        ctrl_if_else:{message0:'if %1 then',args0:[{type:'field_dropdown',name:'COND',options:conds}],message1:'%1',args1:[{type:'input_statement',name:'DO0'}],message2:'else',message3:'%1',args3:[{type:'input_statement',name:'DO1'}],colour:'#4C97FF',prev:true,next:true},
        ctrl_repeat:{message0:'repeat %1 times',args0:[{type:'field_number',name:'TIMES',value:10}],message1:'%1',args1:[{type:'input_statement',name:'DO'}],colour:'#4C97FF',prev:true,next:true},
        ctrl_wait:{message0:'wait %1 secs',args0:[{type:'field_number',name:'SECS',value:1}],colour:'#4C97FF',prev:true,next:true},
        ctrl_stop:{message0:'stop all',colour:'#4C97FF',prev:true},
        ctrl_set_speed:{message0:'set speed to %1',args0:[{type:'field_number',name:'SPD',value:5}],colour:'#4C97FF',prev:true,next:true},
        ctrl_go_to:{message0:'go to x: %1 y: %2',args0:[{type:'field_number',name:'X',value:0},{type:'field_number',name:'Y',value:0}],colour:'#4C97FF',prev:true,next:true},
        ctrl_glide_to:{message0:'glide to x: %1 y: %2',args0:[{type:'field_number',name:'X',value:0},{type:'field_number',name:'Y',value:0}],colour:'#4C97FF',prev:true,next:true},

        phys_gravity:{message0:'set gravity to %1',args0:[{type:'field_number',name:'G',value:0.5}],colour:'#FF8C1A',prev:true,next:true},
        phys_jump:{message0:'jump with force %1',args0:[{type:'field_number',name:'F',value:12}],colour:'#FF8C1A',prev:true,next:true},
        phys_force:{message0:'apply force x: %1 y: %2',args0:[{type:'field_number',name:'FX',value:0},{type:'field_number',name:'FY',value:-5}],colour:'#FF8C1A',prev:true,next:true},
        phys_velocity:{message0:'set velocity x: %1 y: %2',args0:[{type:'field_number',name:'VX',value:0},{type:'field_number',name:'VY',value:0}],colour:'#FF8C1A',prev:true,next:true},
        phys_mass:{message0:'set mass to %1',args0:[{type:'field_number',name:'M',value:1}],colour:'#FF8C1A',prev:true,next:true},
        phys_bounce:{message0:'set bounce to %1',args0:[{type:'field_number',name:'B',value:0.5}],colour:'#FF8C1A',prev:true,next:true},
        phys_friction:{message0:'set friction to %1',args0:[{type:'field_number',name:'FR',value:0.1}],colour:'#FF8C1A',prev:true,next:true},
        phys_change_x:{message0:'change x by %1',args0:[{type:'field_number',name:'DX',value:10}],colour:'#FF8C1A',prev:true,next:true},
        phys_change_y:{message0:'change y by %1',args0:[{type:'field_number',name:'DY',value:10}],colour:'#FF8C1A',prev:true,next:true},
        phys_set_x:{message0:'set x to %1',args0:[{type:'field_number',name:'X',value:0}],colour:'#FF8C1A',prev:true,next:true},
        phys_set_y:{message0:'set y to %1',args0:[{type:'field_number',name:'Y',value:0}],colour:'#FF8C1A',prev:true,next:true},

        looks_color:{message0:'set color to %1',args0:[{type:'field_colour',name:'CLR',colour:'#ff0000'}],colour:'#9966FF',prev:true,next:true},
        looks_size:{message0:'set size w: %1 h: %2',args0:[{type:'field_number',name:'W',value:50},{type:'field_number',name:'H',value:50}],colour:'#9966FF',prev:true,next:true},
        looks_change_size:{message0:'change size by %1',args0:[{type:'field_number',name:'DS',value:10}],colour:'#9966FF',prev:true,next:true},
        looks_show:{message0:'show',colour:'#9966FF',prev:true,next:true},
        looks_hide:{message0:'hide',colour:'#9966FF',prev:true,next:true},
        looks_ghost:{message0:'set ghost effect to %1 %',args0:[{type:'field_number',name:'G',value:50}],colour:'#9966FF',prev:true,next:true},
        looks_say:{message0:'say %1',args0:[{type:'field_input',name:'MSG',text:'Hello!'}],colour:'#9966FF',prev:true,next:true},
        looks_say_for:{message0:'say %1 for %2 secs',args0:[{type:'field_input',name:'MSG',text:'Hi!'},{type:'field_number',name:'SECS',value:2}],colour:'#9966FF',prev:true,next:true},
        looks_rotate:{message0:'turn %1 degrees',args0:[{type:'field_number',name:'DEG',value:15}],colour:'#9966FF',prev:true,next:true},
        looks_set_rotation:{message0:'set rotation to %1',args0:[{type:'field_number',name:'ROT',value:0}],colour:'#9966FF',prev:true,next:true},
        looks_camera_follow:{message0:'camera follow this sprite',colour:'#9966FF',prev:true,next:true},
        looks_layer:{message0:'set layer to %1',args0:[{type:'field_number',name:'L',value:1}],colour:'#9966FF',prev:true,next:true},

        snd_play:{message0:'play sound %1',args0:[{type:'field_dropdown',name:'SND',options:[['pop','pop'],['click','click'],['beep','beep'],['jump','jump'],['coin','coin'],['hit','hit']]}],colour:'#CF63CF',prev:true,next:true},
        snd_play_uploaded:{message0:'play uploaded sound %1',args0:[{type:'field_dropdown',name:'IDX',options:[['Sound 1','0'],['Sound 2','1'],['Sound 3','2'],['Sound 4','3'],['Sound 5','4']]}],colour:'#CF63CF',prev:true,next:true},
        snd_volume:{message0:'set volume to %1 %',args0:[{type:'field_number',name:'VOL',value:100}],colour:'#CF63CF',prev:true,next:true},
        snd_stop:{message0:'stop all sounds',colour:'#CF63CF',prev:true,next:true},

        math_set_var:{message0:'set %1 to %2',args0:[{type:'field_input',name:'VAR',text:'my variable'},{type:'field_number',name:'VAL',value:0}],colour:'#59C059',prev:true,next:true},
        math_change_var:{message0:'change %1 by %2',args0:[{type:'field_input',name:'VAR',text:'my variable'},{type:'field_number',name:'VAL',value:1}],colour:'#59C059',prev:true,next:true},
        math_set_score:{message0:'set score to %1',args0:[{type:'field_number',name:'S',value:0}],colour:'#59C059',prev:true,next:true},
        math_change_score:{message0:'change score by %1',args0:[{type:'field_number',name:'DS',value:1}],colour:'#59C059',prev:true,next:true},
        math_reset_score:{message0:'reset score',colour:'#59C059',prev:true,next:true},
        math_log_score:{message0:'log score',colour:'#59C059',prev:true,next:true},
        math_random:{message0:'set %1 to random %2 to %3',args0:[{type:'field_input',name:'VAR',text:'result'},{type:'field_number',name:'MIN',value:1},{type:'field_number',name:'MAX',value:10}],colour:'#59C059',prev:true,next:true},

        file_save:{message0:'save game as %1',args0:[{type:'field_input',name:'NAME',text:'save1'}],colour:'#5CB1D6',prev:true,next:true},
        file_load:{message0:'load game %1',args0:[{type:'field_input',name:'NAME',text:'save1'}],colour:'#5CB1D6',prev:true,next:true},
        file_export:{message0:'export level as JSON',colour:'#5CB1D6',prev:true,next:true},
        file_import:{message0:'import level from JSON',colour:'#5CB1D6',prev:true,next:true},
        file_delete:{message0:'delete save %1',args0:[{type:'field_input',name:'NAME',text:'save1'}],colour:'#5CB1D6',prev:true,next:true},

        log_msg:{message0:'log %1',args0:[{type:'field_input',name:'MSG',text:'hello'}],colour:'#888888',prev:true,next:true},
        log_var:{message0:'log variable %1',args0:[{type:'field_input',name:'VAR',text:'my variable'}],colour:'#888888',prev:true,next:true},

        lib_player_controls:{message0:'🎮 Simple Player Controls',colour:'#00BCD4',prev:true,next:true},
        lib_platform_lr:{message0:'↔ Platform Left-Right range %1 speed %2',args0:[{type:'field_number',name:'RANGE',value:100},{type:'field_number',name:'SPD',value:2}],colour:'#00BCD4',prev:true,next:true},
        lib_platform_ud:{message0:'↕ Platform Up-Down range %1 speed %2',args0:[{type:'field_number',name:'RANGE',value:100},{type:'field_number',name:'SPD',value:2}],colour:'#00BCD4',prev:true,next:true},
      };

      var ids = Object.keys(defs);
      for (var k = 0; k < ids.length; k++) {
        (function(bid: string, d: any) {
          try { delete (Blockly.Blocks as any)[bid]; } catch(_) {}
          (Blockly.Blocks as any)[bid] = {
            init: function(this: any) {
              var j: any = { type: bid, message0: d.message0, args0: d.args0 || [], colour: d.colour };
              if (d.message1 !== undefined) { j.message1 = d.message1; j.args1 = d.args1 || []; }
              if (d.message2 !== undefined) { j.message2 = d.message2; j.args2 = d.args2 || []; }
              if (d.message3 !== undefined) { j.message3 = d.message3; j.args3 = d.args3 || []; }
              if (d.hat) { j.nextStatement = null; }
              else {
                if (d.prev) j.previousStatement = null;
                if (d.next) j.nextStatement = null;
              }
              this.jsonInit(j);
            }
          };
        })(ids[k], defs[ids[k]]);
      }

      var toolbox = {
        kind: 'categoryToolbox',
        contents: [
          {kind:'category',name:'⚡ Events',colour:'#E6A822',contents:[
            {kind:'block',type:'evt_start'},{kind:'block',type:'evt_key_pressed'},
            {kind:'block',type:'evt_clicked'},{kind:'block',type:'evt_touching'},
            {kind:'block',type:'evt_stop_clicked'},
          ]},
          {kind:'category',name:'🎮 Controls',colour:'#4C97FF',contents:[
            {kind:'block',type:'ctrl_forever'},{kind:'block',type:'ctrl_if'},
            {kind:'block',type:'ctrl_if_else'},{kind:'block',type:'ctrl_repeat'},
            {kind:'block',type:'ctrl_wait'},{kind:'block',type:'ctrl_stop'},
            {kind:'block',type:'ctrl_set_speed'},{kind:'block',type:'ctrl_go_to'},
            {kind:'block',type:'ctrl_glide_to'},
          ]},
          {kind:'category',name:'🔧 Physics',colour:'#FF8C1A',contents:[
            {kind:'block',type:'phys_gravity'},{kind:'block',type:'phys_jump'},
            {kind:'block',type:'phys_force'},{kind:'block',type:'phys_velocity'},
            {kind:'block',type:'phys_mass'},{kind:'block',type:'phys_bounce'},
            {kind:'block',type:'phys_friction'},{kind:'block',type:'phys_change_x'},
            {kind:'block',type:'phys_change_y'},{kind:'block',type:'phys_set_x'},
            {kind:'block',type:'phys_set_y'},
          ]},
          {kind:'category',name:'👁 Looks',colour:'#9966FF',contents:[
            {kind:'block',type:'looks_color'},{kind:'block',type:'looks_size'},
            {kind:'block',type:'looks_change_size'},{kind:'block',type:'looks_show'},
            {kind:'block',type:'looks_hide'},{kind:'block',type:'looks_ghost'},
            {kind:'block',type:'looks_say'},{kind:'block',type:'looks_say_for'},
            {kind:'block',type:'looks_rotate'},{kind:'block',type:'looks_set_rotation'},
            {kind:'block',type:'looks_camera_follow'},{kind:'block',type:'looks_layer'},
          ]},
          {kind:'category',name:'🔊 Sound',colour:'#CF63CF',contents:[
            {kind:'block',type:'snd_play'},{kind:'block',type:'snd_play_uploaded'},
            {kind:'block',type:'snd_volume'},{kind:'block',type:'snd_stop'},
          ]},
          {kind:'category',name:'🔢 Math',colour:'#59C059',contents:[
            {kind:'block',type:'math_set_var'},{kind:'block',type:'math_change_var'},
            {kind:'block',type:'math_set_score'},{kind:'block',type:'math_change_score'},
            {kind:'block',type:'math_reset_score'},{kind:'block',type:'math_log_score'},
            {kind:'block',type:'math_random'},
          ]},
          {kind:'category',name:'📁 File',colour:'#5CB1D6',contents:[
            {kind:'block',type:'file_save'},{kind:'block',type:'file_load'},
            {kind:'block',type:'file_export'},{kind:'block',type:'file_import'},
            {kind:'block',type:'file_delete'},
          ]},
          {kind:'category',name:'📋 Logs',colour:'#888888',contents:[
            {kind:'block',type:'log_msg'},{kind:'block',type:'log_var'},
          ]},
          {kind:'category',name:'📚 Library',colour:'#00BCD4',contents:[
            {kind:'block',type:'lib_player_controls'},
            {kind:'block',type:'lib_platform_lr'},
            {kind:'block',type:'lib_platform_ud'},
          ]},
        ]
      };

      var w = Blockly.inject(containerRef.current!, {
        toolbox: toolbox,
        grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
        zoom: { controls: true, wheel: true, startScale: 0.8, maxScale: 3, minScale: 0.3 },
        trashcan: true,
        move: { scrollbars: true, drag: true, wheel: true },
        sounds: false,
        media: '',
      });

      wsRef.current = w;

      var initData = spriteXml.current[props.selectedSpriteId];
      if (initData) {
        swapping.current = true;
        load(w, initData);
        setTimeout(function() {
          swapping.current = false;
          cbRef.current(getBlocks());
        }, 50);
      }

      w.addChangeListener(function(ev: any) {
        if (swapping.current) return;
        if (ev.type === 'create' || ev.type === 'delete' || ev.type === 'move' || ev.type === 'change') {
          cbRef.current(getBlocks());
        }
      });

      curSprite.current = props.selectedSpriteId;

    } catch(e) {
      console.error('Blockly init failed:', e);
    }

    return function() {
      if (wsRef.current) {
        try { wsRef.current.dispose(); } catch(_) {}
        wsRef.current = null;
      }
    };
  }, []);

  useEffect(function() {
    var w = wsRef.current;
    if (!w || !didInit.current) return;
    if (curSprite.current === props.selectedSpriteId) return;

    swapping.current = true;

    var saved = save(w);
    if (saved) {
      spriteXml.current[curSprite.current] = saved;
    }

    try { w.clear(); } catch(_) {}

    var newData = spriteXml.current[props.selectedSpriteId];
    if (newData) {
      load(w, newData);
    }

    curSprite.current = props.selectedSpriteId;

    setTimeout(function() {
      swapping.current = false;
      cbRef.current(getBlocks());
    }, 100);
  }, [props.selectedSpriteId, save, load, getBlocks]);

  var addNote = useCallback(function() {
    var colors = ['#fff9a6','#a6d4ff','#ffc1e3','#b5ffb5','#ffd6a6'];
    notesRef.current.push({
      id: 'n' + Date.now(), x: 100 + Math.random() * 200, y: 50 + Math.random() * 100,
      text: '', color: colors[Math.floor(Math.random() * 5)],
    });
    drawNotes();
  }, []);

  var drawNotes = useCallback(function() {
    var nd = notesDivRef.current;
    if (!nd) return;
    nd.innerHTML = '';
    for (var i = 0; i < notesRef.current.length; i++) {
      var n = notesRef.current[i];
      var el = document.createElement('div');
      el.style.cssText = 'position:absolute;left:'+n.x+'px;top:'+n.y+'px;width:160px;z-index:1000;pointer-events:auto;';
      el.innerHTML = '<div class="window active" style="width:100%"><div class="title-bar" style="cursor:grab"><div class="title-bar-text" style="font-size:10px">📝 Note</div><div class="title-bar-controls"><button aria-label="Close" class="nc"></button></div></div><div class="window-body" style="padding:4px;background:'+n.color+'"><textarea style="width:100%;min-height:60px;border:none;background:transparent;resize:vertical;font-size:11px;outline:none">'+n.text+'</textarea></div></div>';
      (function(note: StickyNote, div: HTMLDivElement) {
        var tb = div.querySelector('.title-bar') as HTMLElement;
        if (tb) {
          var drag = false, ox = 0, oy = 0;
          tb.onmousedown = function(e) { drag = true; ox = e.clientX - note.x; oy = e.clientY - note.y; e.preventDefault(); };
          document.addEventListener('mousemove', function(e) { if (!drag) return; note.x = e.clientX - ox; note.y = e.clientY - oy; div.style.left = note.x+'px'; div.style.top = note.y+'px'; });
          document.addEventListener('mouseup', function() { drag = false; });
        }
        var cb = div.querySelector('.nc');
        if (cb) cb.addEventListener('click', function() { notesRef.current = notesRef.current.filter(function(x){return x.id !== note.id}); drawNotes(); });
        var ta = div.querySelector('textarea');
        if (ta) {
          ta.addEventListener('input', function() { note.text = (ta as HTMLTextAreaElement).value; });
          ta.addEventListener('keydown', function(e) { e.stopPropagation(); });
        }
      })(n, el);
      nd.appendChild(el);
    }
  }, []);

  return (
    <div style={{width:'100%',height:'100%',position:'relative'}}>
      <div ref={containerRef} style={{width:'100%',height:'100%',position:'absolute',top:0,left:0}} />
      <div ref={notesDivRef} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none'}} />
      <button onClick={addNote} title="Add note" style={{position:'absolute',top:6,right:6,zIndex:1001,padding:'3px 8px',fontSize:11,cursor:'pointer',background:'#fff9a6',border:'1px solid #d4c84a',borderRadius:3}}>📝 Note</button>
    </div>
  );
});

export default BlocklyWorkspaceComponent;
