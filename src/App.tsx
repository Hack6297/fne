import React, { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { v4 as uuid } from 'uuid';
import Viewport2D5 from './components/Viewport2D5';
import CommunityPanel from './components/CommunityPanel';
import ConsolePanel from './components/ConsolePanel';
import VectorEditor from './components/VectorEditor';
import SpriteLibrary from './components/SpriteLibrary';
import BgPaintDialog from './components/BgPaintDialog';
import { ViewportObject, PlacedBlock, ConsoleLog, VectorShape, SpriteLibraryItem, SPRITE_LIBRARY, SoundSlot } from './types';
import { EngineState, getBlockChains, executeChain, physicsStep } from './engine/ScriptEngine';

// LAZY LOAD BlocklyWorkspace - this is the critical fix for loading speed
var LazyBlocklyWorkspace = React.lazy(function() { return import('./components/BlocklyWorkspace'); });

var PID = 'player1';

var DEFAULT_OBJECTS: ViewportObject[] = [
  { id: PID, type: 'player', x: 150, y: 180, width: 44, height: 58, color: '#4FC3F7', name: 'Player', zIndex: 5, vx: 0, vy: 0, mass: 1, bounce: 0.2, friction: 0.85, hasGravity: true, isGrounded: false, speed: 5, jumpForce: 12, facingRight: true, visible: true, opacity: 1, sounds: [], costumes: [] },
  { id: 'ground1', type: 'plane', x: -500, y: 320, width: 2000, height: 30, color: '#66BB6A', name: 'Ground', zIndex: 1, isStatic: true },
  { id: 'plat1', type: 'cube', x: 250, y: 260, width: 120, height: 20, color: '#42A5F5', name: 'Platform1', zIndex: 2, isStatic: true },
  { id: 'plat2', type: 'cube', x: 450, y: 210, width: 100, height: 20, color: '#AB47BC', name: 'Platform2', zIndex: 2, isStatic: true },
  { id: 'ramp1', type: 'ramp', x: 80, y: 280, width: 100, height: 40, color: '#FFA726', name: 'Ramp1', zIndex: 2, isStatic: true, rotation: 0 },
  { id: 'ball1', type: 'physics_ball', x: 500, y: 100, width: 28, height: 28, color: '#EF5350', name: 'PhysBall', zIndex: 3, isStatic: false, vx: 0, vy: 0, mass: 0.8, bounce: 0.7, friction: 0.95, hasGravity: true },
  { id: 'coin1', type: 'sphere', x: 290, y: 235, width: 20, height: 20, color: '#FFEE58', name: 'Coin1', zIndex: 3, isStatic: true },
];

var DEFAULT_SCRIPTS: PlacedBlock[] = [];

var initEngine = function(objs: ViewportObject[]): EngineState {
  return {
    objects: JSON.parse(JSON.stringify(objs)),
    variables: {}, gravity: 0.5, keysDown: new Set(),
    logs: [], messages: [],
    sayTexts: new Map(), particles: new Map(), glows: new Map(),
    cameraX: 0, cameraY: 0, cameraFollow: PID,
    clickedSpriteId: null,
    activeForeverChains: new Set(),
    volume: 100,
    activeAudioElements: [],
    frameCount: 0,
    stopClicked: false,
  };
};

type WorkspaceTab = 'scripts' | 'costumes' | 'sounds';

function BlocklyFallback() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>Loading block editor...</p>
        <div style={{ width: 220, margin: '0 auto' }}>
          <div role="progressbar" className="animate">
            <div style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

var App: React.FC = function() {
  var [page, setPage] = useState<'editor' | 'community'>('editor');
  var [objects, setObjects] = useState<ViewportObject[]>(DEFAULT_OBJECTS);
  var [selSpriteId, setSelSpriteId] = useState(PID);
  var [scripts, setScripts] = useState<PlacedBlock[]>(DEFAULT_SCRIPTS);
  var [logs, setLogs] = useState<ConsoleLog[]>([
    { id: '0', type: 'info', message: 'FunnyNetworkEngine v0.8 ready', timestamp: new Date().toLocaleTimeString() },
  ]);
  var [showVectorEditor, setShowVectorEditor] = useState(false);
  var [showSpriteLibrary, setShowSpriteLibrary] = useState(false);
  var [isPlaying, setIsPlaying] = useState(false);
  var [levelName, setLevelName] = useState('My First Level');
  var [wsTab, setWsTab] = useState<WorkspaceTab>('scripts');
  var [engineState, setEngineState] = useState<EngineState>(initEngine(DEFAULT_OBJECTS));
  var [sceneBg, setSceneBg] = useState<string | null>(null);
  var [showBgPaint, setShowBgPaint] = useState(false);
  var [clipboard, setClipboard] = useState<ViewportObject | null>(null);
  var [workspaceKey, setWorkspaceKey] = useState(0);
  var [importedWorkspaceData, setImportedWorkspaceData] = useState<Record<string, any> | undefined>(undefined);

  var savedRef = useRef<ViewportObject[]>([]);
  var frameRef = useRef(0);
  var keysRef = useRef(new Set<string>());
  var startFiredRef = useRef(false);
  var [, tick] = useState(0);
  var [sceneScroll, setSceneScroll] = useState({ x: 0, y: 0 });
  var blocklyRef = useRef<any>(null);

  var selObj = objects.find(function(o) { return o.id === selSpriteId; }) || null;
  var spriteScripts = scripts.filter(function(s) { return s.spriteId === selSpriteId; });

  var addLog = useCallback(function(l: ConsoleLog) {
    setLogs(function(p) { return p.length > 200 ? p.slice(-150).concat([l]) : p.concat([l]); });
  }, []);

  var updateObj = useCallback(function(u: ViewportObject) {
    setObjects(function(p) { return p.map(function(o) { return o.id === u.id ? u : o; }); });
  }, []);

  var delObj = useCallback(function(id: string) {
    setObjects(function(p) { return p.filter(function(o) { return o.id !== id; }); });
    setScripts(function(p) { return p.filter(function(s) { return s.spriteId !== id; }); });
    if (selSpriteId === id) {
      var remaining = objects.filter(function(o) { return o.id !== id; });
      setSelSpriteId(remaining.length > 0 ? remaining[0].id : '');
    }
    addLog({ id: uuid(), type: 'info', message: 'Deleted sprite', timestamp: new Date().toLocaleTimeString() });
  }, [addLog, selSpriteId, objects]);

  var copySprite = useCallback(function() {
    if (!selObj) return;
    setClipboard(JSON.parse(JSON.stringify(selObj)));
    addLog({ id: uuid(), type: 'info', message: 'Copied: ' + selObj.name, timestamp: new Date().toLocaleTimeString() });
  }, [selObj, addLog]);

  var pasteSprite = useCallback(function() {
    if (!clipboard) return;
    var newId = uuid();
    var newObj: ViewportObject = JSON.parse(JSON.stringify(clipboard));
    newObj.id = newId;
    newObj.name = (clipboard.name || 'Sprite') + ' Copy';
    newObj.x = (clipboard.x || 0) + 30 + Math.random() * 20;
    newObj.y = (clipboard.y || 0) + 30 + Math.random() * 20;
    setObjects(function(p) { return p.concat([newObj]); });
    var srcScripts = scripts.filter(function(s) { return s.spriteId === clipboard!.id; });
    if (srcScripts.length > 0) {
      var newScripts = srcScripts.map(function(s) { return { ...s, uid: uuid(), spriteId: newId }; });
      setScripts(function(p) { return p.concat(newScripts); });
    }
    setSelSpriteId(newId);
  }, [clipboard, scripts]);

  var addFromLib = useCallback(function(spr: SpriteLibraryItem) {
    var o: ViewportObject = {
      id: uuid(), type: spr.shape === 'circle' ? 'sphere' : 'cube',
      x: 200 + Math.random() * 200, y: 150 + Math.random() * 80,
      width: spr.width, height: spr.height, color: spr.color, name: spr.name, zIndex: 3,
      isStatic: false, vx: 0, vy: 0, mass: 1, bounce: 0.3, friction: 0.85,
      hasGravity: true, visible: true, opacity: 1, spriteLibraryId: spr.id, sounds: [], costumes: [],
    };
    setObjects(function(p) { return p.concat([o]); });
    setSelSpriteId(o.id);
    setShowSpriteLibrary(false);
  }, []);

  var uploadSprite = useCallback(function() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/png,image/jpeg,image/gif,image/svg+xml,image/webp';
    inp.addEventListener('change', function() {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.addEventListener('load', function() {
        var dataUrl = reader.result as string;
        if (!dataUrl) return;
        var newId = uuid();
        var spriteName = f!.name.replace(/\.[^.]+$/, '') || 'Sprite';
        var newObj: ViewportObject = {
          id: newId, type: 'cube',
          x: 200 + Math.random() * 150, y: 150 + Math.random() * 80,
          width: 60, height: 60, color: '#FFF', name: spriteName, zIndex: 3,
          isStatic: false, vx: 0, vy: 0, mass: 1, bounce: 0.3, friction: 0.85,
          hasGravity: true, visible: true, opacity: 1, customImage: dataUrl, sounds: [], costumes: [],
        };
        setObjects(function(prev) { return prev.concat([newObj]); });
        setSelSpriteId(newId);
        addLog({ id: uuid(), type: 'info', message: 'Imported sprite: ' + spriteName, timestamp: new Date().toLocaleTimeString() });
      });
      reader.readAsDataURL(f);
    });
    inp.click();
  }, [addLog]);

  var uploadTexture = useCallback(function() {
    if (!selObj) return;
    var capturedId = selObj.id;
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.addEventListener('change', function() {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.addEventListener('load', function() {
        var dataUrl = reader.result as string;
        setObjects(function(prev) {
          return prev.map(function(o) {
            if (o.id !== capturedId) return o;
            return { ...o, customTexture: dataUrl };
          });
        });
      });
      reader.readAsDataURL(f);
    });
    inp.click();
  }, [selObj]);

  var uploadSound = useCallback(function() {
    if (!selObj) {
      addLog({ id: uuid(), type: 'warn', message: 'Select a sprite first', timestamp: new Date().toLocaleTimeString() });
      return;
    }
    var capturedId = selObj.id;
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.mp3,.wav,.ogg,.m4a,audio/*';
    inp.addEventListener('change', function() {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var sndName = f.name.replace(/\.[^.]+$/, '') || 'Sound';
      var reader = new FileReader();
      reader.addEventListener('load', function() {
        var dataUrl = reader.result;
        if (!dataUrl || typeof dataUrl !== 'string') return;
        var sndId = uuid();
        var snd: SoundSlot = { id: sndId, name: sndName, url: dataUrl };
        setObjects(function(prev) {
          return prev.map(function(o) {
            if (o.id !== capturedId) return o;
            return { ...o, sounds: (o.sounds || []).concat([snd]) };
          });
        });
        addLog({ id: uuid(), type: 'info', message: 'Sound "' + sndName + '" added', timestamp: new Date().toLocaleTimeString() });
      });
      reader.readAsDataURL(f);
    });
    inp.click();
  }, [selObj, addLog]);

  var playSound = useCallback(function(url: string) {
    try { var a = new Audio(url); a.volume = 0.5; a.play().catch(function() {}); } catch (_e) { /* */ }
  }, []);

  var uploadBackground = useCallback(function() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.addEventListener('change', function() {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var r = new FileReader();
      r.addEventListener('load', function() {
        setSceneBg(r.result as string);
      });
      r.readAsDataURL(f);
    });
    inp.click();
  }, []);

  var addObj = useCallback(function(type: ViewportObject['type']) {
    var o: ViewportObject = {
      id: uuid(), type: type,
      x: 200 + Math.random() * 200, y: 150 + Math.random() * 100,
      width: type === 'plane' ? 200 : type === 'physics_ball' ? 28 : type === 'player' ? 44 : 50,
      height: type === 'plane' ? 20 : type === 'physics_ball' ? 28 : type === 'player' ? 58 : 50,
      color: type === 'player' ? '#4FC3F7' : type === 'physics_ball' ? '#EF5350' : ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6'][Math.floor(Math.random()*5)],
      name: type === 'player' ? 'Player' : type + '_' + Date.now().toString(36), zIndex: type === 'player' ? 5 : 2,
      isStatic: type !== 'player' && type !== 'sphere' && type !== 'physics_ball',
      vx: 0, vy: 0, mass: type === 'physics_ball' ? 0.8 : 1,
      bounce: type === 'physics_ball' ? 0.7 : 0.2, friction: 0.85,
      hasGravity: type === 'player' || type === 'physics_ball',
      speed: type === 'player' ? 5 : 0, jumpForce: type === 'player' ? 12 : 0,
      facingRight: true, visible: true, opacity: 1, sounds: [], costumes: [],
    };
    setObjects(function(p) { return p.concat([o]); });
    setSelSpriteId(o.id);
  }, []);

  var vectorSave = useCallback(function(shapes: VectorShape[]) {
    if (selObj) updateObj({ ...selObj, vectorShapes: shapes });
  }, [selObj, updateObj]);

  var exportLevel = useCallback(function() {
    var wsData: Record<string, any> = {};
    if (blocklyRef.current && blocklyRef.current.getAllWorkspaceData) {
      wsData = blocklyRef.current.getAllWorkspaceData();
    }
    var d = JSON.stringify({ objects: objects, scripts: scripts, levelName: levelName, sceneBg: sceneBg, workspaceData: wsData }, null, 2);
    var b = new Blob([d], { type: 'application/json' });
    var u = URL.createObjectURL(b);
    var a = document.createElement('a');
    a.href = u; a.download = levelName + '.json'; a.click();
    URL.revokeObjectURL(u);
  }, [objects, scripts, levelName, sceneBg]);

  var saveLevel = useCallback(function() {
    var wsData: Record<string, any> = {};
    if (blocklyRef.current && blocklyRef.current.getAllWorkspaceData) {
      wsData = blocklyRef.current.getAllWorkspaceData();
    }
    var d = JSON.stringify({ objects: objects, scripts: scripts, levelName: levelName, sceneBg: sceneBg, workspaceData: wsData });
    localStorage.setItem('fne_level', d);
    addLog({ id: uuid(), type: 'info', message: 'Saved "' + levelName + '"', timestamp: new Date().toLocaleTimeString() });
  }, [objects, scripts, levelName, sceneBg, addLog]);

  var loadLevel = useCallback(function() {
    try {
      var d = localStorage.getItem('fne_level');
      if (d) {
        var parsed = JSON.parse(d);
        setObjects(parsed.objects || DEFAULT_OBJECTS);
        setScripts(parsed.scripts || []);
        setLevelName(parsed.levelName || 'Loaded');
        if (parsed.sceneBg) setSceneBg(parsed.sceneBg);
        if (parsed.workspaceData) setImportedWorkspaceData(parsed.workspaceData);
        setWorkspaceKey(function(k) { return k + 1; });
        addLog({ id: uuid(), type: 'info', message: 'Level loaded', timestamp: new Date().toLocaleTimeString() });
      }
    } catch (_e) {
      addLog({ id: uuid(), type: 'error', message: 'Failed to load', timestamp: new Date().toLocaleTimeString() });
    }
  }, [addLog]);

  var importLevel = useCallback(function() {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json';
    inp.addEventListener('change', function() {
      var f = inp.files && inp.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.addEventListener('load', function() {
        try {
          var data = JSON.parse(reader.result as string);
          if (data.objects) {
            var fixedObjects = data.objects.map(function(o: any) {
              return {
                ...o,
                sounds: o.sounds || [],
                costumes: o.costumes || [],
                visible: o.visible !== false,
                opacity: o.opacity != null ? o.opacity : 1,
                vx: o.vx || 0, vy: o.vy || 0,
                mass: o.mass || 1,
                bounce: o.bounce != null ? o.bounce : 0.3,
                friction: o.friction != null ? o.friction : 0.85,
              };
            });
            setObjects(fixedObjects);
          }
          if (data.scripts) setScripts(data.scripts);
          if (data.levelName) setLevelName(data.levelName);
          if (data.sceneBg) setSceneBg(data.sceneBg);
          if (data.workspaceData) setImportedWorkspaceData(data.workspaceData);
          setWorkspaceKey(function(k) { return k + 1; });
          addLog({ id: uuid(), type: 'info', message: 'Imported: ' + (data.levelName || f!.name), timestamp: new Date().toLocaleTimeString() });
        } catch (_err) {
          addLog({ id: uuid(), type: 'error', message: 'Failed to parse JSON', timestamp: new Date().toLocaleTimeString() });
        }
      });
      reader.readAsText(f);
    });
    inp.click();
  }, [addLog]);

  var handleSpriteClick = useCallback(function(spriteId: string) {
    setEngineState(function(prev) { return { ...prev, clickedSpriteId: spriteId }; });
  }, []);

  var handlePlay = useCallback(function() {
    if (!isPlaying) {
      savedRef.current = JSON.parse(JSON.stringify(objects));
      var eng = initEngine(objects);
      eng.cameraFollow = PID;
      setEngineState(eng);
      startFiredRef.current = false;
    } else {
      setEngineState(function(prev) {
        var st = { ...prev, stopClicked: true };
        for (var oi = 0; oi < st.objects.length; oi++) {
          var obj = st.objects[oi];
          var chains = getBlockChains(scripts, obj.id);
          for (var ci = 0; ci < chains.length; ci++) {
            st = executeChain(chains[ci], st, 'stop', obj.id, scripts);
          }
        }
        return st;
      });
      setTimeout(function() {
        setObjects(savedRef.current);
        var resetEng = initEngine(savedRef.current);
        resetEng.activeForeverChains = new Set();
        setEngineState(resetEng);
        setSceneScroll({ x: 0, y: 0 });
      }, 50);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, objects, scripts]);

  // Keyboard
  useEffect(function() {
    var handleKeyDown = function(e: KeyboardEvent) {
      if (isPlaying) {
        var k = e.key === ' ' ? 'Space' : e.key;
        keysRef.current.add(k);
        keysRef.current.add(k.toUpperCase());
        if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key) >= 0) e.preventDefault();
        return;
      }
      var tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selSpriteId) {
          var obj = objects.find(function(o) { return o.id === selSpriteId; });
          if (obj && confirm('Delete sprite "' + obj.name + '"?')) delObj(selSpriteId);
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); copySprite(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); pasteSprite(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveLevel(); return; }

      var scrollSpeed = 15;
      if (e.key === 'w' || e.key === 'W') { setSceneScroll(function(p) { return { x: p.x, y: p.y + scrollSpeed }; }); e.preventDefault(); }
      if (e.key === 's' || e.key === 'S') { setSceneScroll(function(p) { return { x: p.x, y: p.y - scrollSpeed }; }); e.preventDefault(); }
      if (e.key === 'a' || e.key === 'A') { setSceneScroll(function(p) { return { x: p.x + scrollSpeed, y: p.y }; }); e.preventDefault(); }
      if (e.key === 'd' || e.key === 'D') { setSceneScroll(function(p) { return { x: p.x - scrollSpeed, y: p.y }; }); e.preventDefault(); }
    };
    var handleKeyUp = function(e: KeyboardEvent) {
      if (isPlaying) {
        var k = e.key === ' ' ? 'Space' : e.key;
        keysRef.current.delete(k);
        keysRef.current.delete(k.toUpperCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return function() { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [isPlaying, selSpriteId, objects, delObj, copySprite, pasteSprite, saveLevel]);

  // Game loop
  useEffect(function() {
    if (!isPlaying) { startFiredRef.current = false; return; }
    var loop = function() {
      frameRef.current++;
      setEngineState(function(prev) {
        try {
          var st: EngineState = { ...prev, keysDown: new Set(keysRef.current), frameCount: prev.frameCount + 1 };
          for (var oi = 0; oi < st.objects.length; oi++) {
            var obj = st.objects[oi];
            var chains = getBlockChains(scripts, obj.id);
            if (!startFiredRef.current) {
              for (var ci = 0; ci < chains.length; ci++) st = executeChain(chains[ci], st, 'start', obj.id, scripts);
            }
            if (st.keysDown.size > 0) {
              for (var ki = 0; ki < chains.length; ki++) st = executeChain(chains[ki], st, 'keypress', obj.id, scripts);
            }
            if (st.clickedSpriteId) {
              for (var cli = 0; cli < chains.length; cli++) st = executeChain(chains[cli], st, 'click', obj.id, scripts);
            }
            for (var fi = 0; fi < chains.length; fi++) st = executeChain(chains[fi], st, 'forever', obj.id, scripts);
          }
          if (!startFiredRef.current) startFiredRef.current = true;
          st = physicsStep(st);
          if (!st.cameraFollow) st.cameraFollow = PID;
          var ns = new Map(st.sayTexts);
          ns.forEach(function(d, id) {
            if (d.timer <= 0) ns.delete(id);
            else ns.set(id, { ...d, timer: d.timer - 1 });
          });
          st.sayTexts = ns;
          if (st.logs.length > prev.logs.length) {
            st.logs.slice(prev.logs.length).forEach(function(l) { addLog(l); });
          }
          st.clickedSpriteId = null;
          return st;
        } catch (err) { console.error('Game loop error:', err); return prev; }
      });
      tick(function(f) { return f + 1; });
    };
    var iv = setInterval(loop, 1000 / 30);
    return function() { clearInterval(iv); };
  }, [isPlaying, scripts, addLog]);

  useEffect(function() {
    if (isPlaying) setObjects(engineState.objects);
  }, [engineState.objects, isPlaying]);

  var getSpriteIcon = function(o: ViewportObject) {
    if (o.spriteLibraryId) {
      var l = SPRITE_LIBRARY.find(function(s) { return s.id === o.spriteLibraryId; });
      if (l) return l.icon;
    }
    if (o.customImage) return '🖼️';
    var m: Record<string, string> = { player: '🏃', physics_ball: '⚽', ramp: '◺', sphere: '●', plane: '▬', cube: '▢', light: '💡', camera: '📷', trigger: '◻', cylinder: '⬭' };
    return m[o.type] || '◻';
  };

  if (page === 'community') {
    return <CommunityPanel onClose={function() { setPage('editor'); }} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* TITLE BAR */}
      <div className="window active" style={{ borderRadius: 0, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div className="title-bar">
          <div className="title-bar-text">🎮 FunnyNetworkEngine</div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>
      </div>

      {/* MENUBAR */}
      <ul role="menubar" className="can-hover" style={{ margin: 0, padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <li role="menuitem" tabIndex={0} aria-haspopup="true">
          File
          <ul role="menu">
            <li role="menuitem"><a href="#menubar" onClick={function(e) { e.preventDefault(); setObjects(DEFAULT_OBJECTS); setScripts([]); setLevelName('New Level'); setImportedWorkspaceData(undefined); setWorkspaceKey(function(k) { return k + 1; }); }}>New Level</a></li>
            <li role="menuitem"><a href="#menubar" onClick={function(e) { e.preventDefault(); loadLevel(); }}>Open Level <span>Ctrl+O</span></a></li>
            <li role="menuitem" className="has-divider"><a href="#menubar" onClick={function(e) { e.preventDefault(); saveLevel(); }}>Save Level <span>Ctrl+S</span></a></li>
            <li role="menuitem"><a href="#menubar" onClick={function(e) { e.preventDefault(); exportLevel(); }}>Export as JSON</a></li>
            <li role="menuitem" className="has-divider"><a href="#menubar" onClick={function(e) { e.preventDefault(); importLevel(); }}>Import Level (JSON)</a></li>
            <li role="menuitem"><a href="#menubar" onClick={function(e) { e.preventDefault(); uploadBackground(); }}>Upload Background</a></li>
            <li role="menuitem"><a href="#menubar" onClick={function(e) { e.preventDefault(); setShowBgPaint(true); }}>Paint Background</a></li>
          </ul>
        </li>
        <li role="menuitem" tabIndex={0} aria-haspopup="true">
          Edit
          <ul role="menu">
            <li role="menuitem"><a href="#menubar" onClick={function(e) { e.preventDefault(); copySprite(); }}>Copy Sprite <span>Ctrl+C</span></a></li>
            <li role="menuitem"><a href="#menubar" onClick={function(e) { e.preventDefault(); pasteSprite(); }}>Paste Sprite <span>Ctrl+V</span></a></li>
            <li role="menuitem" className="has-divider"><a href="#menubar" onClick={function(e) { e.preventDefault(); if (selSpriteId) delObj(selSpriteId); }}>Delete Sprite <span>Del</span></a></li>
            <li role="menuitem"><a href="#menubar" onClick={function(e) { e.preventDefault(); if (selObj) setShowVectorEditor(true); }}>Vector Editor</a></li>
          </ul>
        </li>
        <li role="menuitem" tabIndex={0} aria-haspopup="true">
          View
          <ul role="menu">
            <li role="menuitem"><a href="#menubar" onClick={function(e) { e.preventDefault(); setSceneScroll({ x: 0, y: 0 }); }}>Reset View</a></li>
            <li role="menuitem" tabIndex={0} aria-haspopup="true">
              Add Sprite
              <ul role="menu">
                <li role="menuitem"><button onClick={function() { addObj('player'); }}>🏃 Player</button></li>
                <li role="menuitem"><button onClick={function() { addObj('cube'); }}>▢ Cube</button></li>
                <li role="menuitem"><button onClick={function() { addObj('sphere'); }}>● Sphere</button></li>
                <li role="menuitem"><button onClick={function() { addObj('plane'); }}>▬ Ground</button></li>
                <li role="menuitem"><button onClick={function() { addObj('ramp'); }}>◺ Ramp</button></li>
                <li role="menuitem"><button onClick={function() { addObj('physics_ball'); }}>⚽ Physics Ball</button></li>
              </ul>
            </li>
            <li role="menuitem"><a href="#menubar" onClick={function(e) { e.preventDefault(); setShowSpriteLibrary(true); }}>Sprite Library</a></li>
          </ul>
        </li>
        <li role="menuitem" tabIndex={0}>
          <a href="#menubar" onClick={function(e) { e.preventDefault(); setPage('community'); }} style={{ textDecoration: 'none', color: 'inherit' }}>Community</a>
        </li>
        <li role="menuitem" tabIndex={0} aria-haspopup="true">
          Help
          <ul role="menu">
            <li role="menuitem"><a href="#menubar" onClick={function(e) { e.preventDefault(); alert('WASD = scroll scene\nDel/Backspace = delete sprite\nCtrl+C = copy sprite\nCtrl+V = paste sprite\nCtrl+S = save level'); }}>Keyboard Shortcuts</a></li>
            <li role="menuitem"><a href="#menubar" onClick={function(e) { e.preventDefault(); alert('FunnyNetworkEngine v0.8\nVisual Scripting Engine\nWindows 7 Aero Theme'); }}>About</a></li>
          </ul>
        </li>

        <li style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, paddingRight: 8, listStyle: 'none' }}>
          <input
            style={{ background: '#fff', border: '1px solid #a0a4a8', borderRadius: 2, padding: '1px 6px', fontSize: 11, color: '#333', width: 120 }}
            value={levelName}
            onChange={function(e) { setLevelName(e.target.value); }}
          />
          <button
            style={{ width: 28, height: 22, fontSize: 12, cursor: 'pointer', background: isPlaying ? '#ccc' : '#8BC34A', color: '#fff', border: '1px solid #558B2F', borderRadius: 3 }}
            title="Play" onClick={function() { if (!isPlaying) handlePlay(); }}
          >▶</button>
          <button
            style={{ width: 28, height: 22, fontSize: 12, cursor: 'pointer', background: !isPlaying ? '#ccc' : '#EF5350', color: '#fff', border: '1px solid #C62828', borderRadius: 3 }}
            title="Stop" onClick={function() { if (isPlaying) handlePlay(); }}
          >⏹</button>
        </li>
      </ul>

      {/* MAIN AREA */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT: Workspace */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #999' }}>

          <section className="tabs" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <menu role="tablist" aria-label="Workspace Tabs" style={{ margin: 0, flexShrink: 0 }}>
              <button role="tab" aria-controls="tab-scripts" aria-selected={wsTab === 'scripts'} onClick={function() { setWsTab('scripts'); }}>Scripts</button>
              <button role="tab" aria-controls="tab-costumes" aria-selected={wsTab === 'costumes'} onClick={function() { setWsTab('costumes'); }}>Costumes</button>
              <button role="tab" aria-controls="tab-sounds" aria-selected={wsTab === 'sounds'} onClick={function() { setWsTab('sounds'); }}>Sounds</button>
            </menu>

            {/* Scripts tab */}
            <article role="tabpanel" id="tab-scripts" hidden={wsTab !== 'scripts'} style={{ flex: 1, overflow: 'hidden', padding: 0 }}>
              <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                <Suspense fallback={<BlocklyFallback />}>
                  <LazyBlocklyWorkspace
                    ref={blocklyRef}
                    key={workspaceKey}
                    selectedSpriteId={selSpriteId}
                    initialWorkspaceData={importedWorkspaceData}
                    onScriptsChange={function(blocks: PlacedBlock[]) {
                      setScripts(function(prev) {
                        var other = prev.filter(function(b) { return b.spriteId !== selSpriteId; });
                        var tagged = blocks.map(function(b) { return { ...b, spriteId: selSpriteId }; });
                        return other.concat(tagged);
                      });
                    }}
                  />
                </Suspense>
              </div>
            </article>

            {/* Costumes tab */}
            <article role="tabpanel" id="tab-costumes" hidden={wsTab !== 'costumes'} style={{ flex: 1, overflow: 'hidden', padding: 0 }}>
              <div className="has-scrollbar" style={{ height: '100%', overflow: 'auto', padding: 16, background: '#dfe1e3' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontWeight: 'bold', fontSize: 13, color: '#555' }}>Costumes — {selObj ? selObj.name : 'None'}</span>
                  <button onClick={function() { if (selObj) setShowVectorEditor(true); }}>Paint</button>
                  <button onClick={uploadSprite}>Import</button>
                  <button onClick={uploadTexture}>Texture</button>
                </div>
                {selObj ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div style={{ padding: 12, borderRadius: 6, border: '2px solid #4a90d9', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                      onClick={function() { setShowVectorEditor(true); }}>
                      <div style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee', borderRadius: 4, background: '#f8f8f8', marginBottom: 4 }}>
                        {selObj.customImage ? <img src={selObj.customImage} style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <span style={{ fontSize: 32 }}>{getSpriteIcon(selObj)}</span>}
                      </div>
                      <span style={{ fontSize: 10, color: '#666' }}>costume1</span>
                    </div>
                    {(selObj.costumes || []).map(function(c) {
                      return (
                        <div key={c.id} style={{ padding: 12, borderRadius: 6, border: '1px solid #ccc', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee', borderRadius: 4, background: '#f8f8f8', marginBottom: 4 }}>
                            {c.image ? <img src={c.image} style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <span style={{ color: '#ccc' }}>Empty</span>}
                          </div>
                          <span style={{ fontSize: 10, color: '#666' }}>{c.name}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: '#999', textAlign: 'center', padding: 48 }}>Select a sprite</div>
                )}
              </div>
            </article>

            {/* Sounds tab */}
            <article role="tabpanel" id="tab-sounds" hidden={wsTab !== 'sounds'} style={{ flex: 1, overflow: 'hidden', padding: 0 }}>
              <div className="has-scrollbar" style={{ height: '100%', overflow: 'auto', padding: 16, background: '#dfe1e3' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontWeight: 'bold', fontSize: 13, color: '#555' }}>Sounds — {selObj ? selObj.name : 'None'}</span>
                  <button onClick={uploadSound}>Import Sound</button>
                </div>
                {selObj && selObj.sounds && selObj.sounds.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selObj.sounds.map(function(snd) {
                      return (
                        <div key={snd.id} className="window active" style={{ maxWidth: 'none' }}>
                          <div className="title-bar">
                            <div className="title-bar-text">🔊 {snd.name}{snd.duration ? ' (' + Math.round(snd.duration) + 's)' : ''}</div>
                            <div className="title-bar-controls">
                              <button aria-label="Close" onClick={function() {
                                if (!selObj) return;
                                var sid = selObj.id;
                                var soundId = snd.id;
                                setObjects(function(p) {
                                  return p.map(function(o) {
                                    if (o.id !== sid) return o;
                                    return { ...o, sounds: (o.sounds || []).filter(function(s) { return s.id !== soundId; }) };
                                  });
                                });
                              }}></button>
                            </div>
                          </div>
                          <div className="window-body has-space" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={function() { playSound(snd.url); }}>▶ Play</button>
                            <div style={{ flex: 1, height: 20, background: '#e8e8e8', borderRadius: 3, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#888' }}>
                              ♪ ♫ ♪ ♫ ♪ ♫ ♪ ♫
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: '#999', textAlign: 'center', padding: 48 }}>
                    {selObj ? (
                      <div>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>🔊</div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No sounds yet</div>
                        <div style={{ fontSize: 11 }}>Click "Import Sound" to add MP3, WAV, or OGG files</div>
                      </div>
                    ) : 'Select a sprite first'}
                  </div>
                )}
              </div>
            </article>
          </section>

          <div style={{ padding: '2px 8px', background: '#d0d2d4', borderTop: '1px solid #aaa', fontSize: 9, color: '#888', flexShrink: 0 }}>
            {selObj ? selObj.name + ' · ' + spriteScripts.length + ' blocks · x:' + Math.round(selObj.x) + ' y:' + Math.round(selObj.y) : 'No sprite selected'}
          </div>
        </div>

        {/* RIGHT: Stage + Sprites + Properties */}
        <div style={{ display: 'flex', flexDirection: 'column', width: 430 }}>
          {/* Stage */}
          <div style={{ display: 'flex', flexDirection: 'column', height: 320, borderBottom: '1px solid #999' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1px 6px', background: '#d0d2d4', borderBottom: '1px solid #aaa', flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: '#777' }}>Stage</span>
              {isPlaying && <span style={{ fontSize: 9, color: '#4caf50', fontWeight: 'bold' }}>● RUNNING</span>}
              <div style={{ display: 'flex', gap: 4 }}>
                <button style={{ fontSize: 9, padding: '1px 4px' }} onClick={function() { setShowBgPaint(true); }}>🎨 BG</button>
                <button style={{ fontSize: 9, padding: '1px 4px' }} onClick={uploadBackground}>📷 BG</button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Viewport2D5
                objects={objects}
                setObjects={setObjects}
                selectedObject={selSpriteId}
                setSelectedObject={setSelSpriteId}
                isPlaying={isPlaying}
                engineState={engineState}
                frameCount={frameRef.current}
                sceneScroll={sceneScroll}
                setSceneScroll={setSceneScroll}
                sceneBg={sceneBg}
                onSpriteClick={handleSpriteClick}
              />
            </div>
          </div>

          {/* Sprite Panel + Properties */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Sprite list */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 6px', borderBottom: '1px solid #aaa', flexShrink: 0 }}>
                <span style={{ fontSize: 9, color: '#777', fontWeight: 600 }}>Sprites:</span>
                <button style={{ fontSize: 9, padding: '1px 4px' }} title="Sprite Library" onClick={function() { setShowSpriteLibrary(true); }}>📚</button>
                <button style={{ fontSize: 9, padding: '1px 4px' }} title="Upload sprite" onClick={uploadSprite}>📷</button>
                <button style={{ fontSize: 9, padding: '1px 4px' }} title="Paint new" onClick={function() {
                  var id = uuid();
                  var newSpr: ViewportObject = {
                    id: id, type: 'cube', x: 250, y: 200, width: 40, height: 40,
                    color: '#4a90d9', name: 'NewSprite', zIndex: 3, isStatic: false,
                    vx: 0, vy: 0, mass: 1, bounce: 0.3, friction: 0.85, hasGravity: true,
                    visible: true, opacity: 1, vectorShapes: [], sounds: [], costumes: [],
                  };
                  setObjects(function(p) { return p.concat([newSpr]); });
                  setSelSpriteId(id);
                  setShowVectorEditor(true);
                }}>🖌️</button>
                <div style={{ flex: 1 }} />
                <select style={{ fontSize: 9, border: '1px solid #aaa', borderRadius: 2 }} value="" onChange={function(e) { if (e.target.value) addObj(e.target.value as ViewportObject['type']); e.target.value = ''; }}>
                  <option value="">+ Add...</option>
                  <option value="player">🏃 Player</option>
                  <option value="cube">▢ Cube</option>
                  <option value="sphere">● Sphere</option>
                  <option value="plane">▬ Ground</option>
                  <option value="ramp">◺ Ramp</option>
                  <option value="physics_ball">⚽ Physics Ball</option>
                </select>
              </div>
              <div className="has-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {objects.map(function(o) {
                    return (
                      <div key={o.id} className={'sprite14-thumb ' + (selSpriteId === o.id ? 'selected' : '')}
                        onClick={function() { setSelSpriteId(o.id); }}
                        title={o.name}>
                        {o.customImage ? <img src={o.customImage} style={{ width: 32, height: 32, objectFit: 'contain' }} /> : <span style={{ fontSize: 22 }}>{getSpriteIcon(o)}</span>}
                        <span className="sprite14-thumb-name">{o.name}</span>
                        {scripts.some(function(s) { return s.spriteId === o.id; }) && <span style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: 3, background: '#4a90d9' }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Properties */}
            <div className="has-scrollbar" style={{ width: 175, overflowY: 'auto', background: '#e0e2e4', borderLeft: '1px solid #aaa' }}>
              <div style={{ padding: '3px 6px', borderBottom: '1px solid #aaa', background: '#d0d2d4' }}>
                <span style={{ fontSize: 10, color: '#666', fontWeight: 'bold' }}>Properties</span>
              </div>
              {selObj ? (
                <div style={{ padding: 6 }}>
                  <fieldset style={{ marginBottom: 6 }}>
                    <legend>{getSpriteIcon(selObj)} Info</legend>
                    <div style={{ marginBottom: 4 }}>
                      <label style={{ fontSize: 9, color: '#888' }}>Name</label>
                      <input style={{ width: '100%', fontSize: 10 }} value={selObj.name} onChange={function(e) { updateObj({ ...selObj!, name: e.target.value }); }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {(['x','y','width','height'] as const).map(function(k) {
                        return (
                          <div key={k}>
                            <label style={{ fontSize: 8, color: '#aaa' }}>{k.toUpperCase()}</label>
                            <input type="number" style={{ width: '100%', fontSize: 10 }} value={Math.round(selObj![k])} onChange={function(e) { updateObj({ ...selObj!, [k]: +e.target.value } as ViewportObject); }} />
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>
                  <fieldset style={{ marginBottom: 6 }}>
                    <legend>Color</legend>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#ecf0f1','#2c3e50','#4FC3F7','#FFEE58','#EF5350'].map(function(c) {
                        return <button key={c} style={{ width: 14, height: 14, background: c, border: selObj!.color === c ? '2px solid #333' : '1px solid #aaa', borderRadius: 2, cursor: 'pointer', padding: 0 }} onClick={function() { updateObj({ ...selObj!, color: c }); }} />;
                      })}
                    </div>
                  </fieldset>

                  <fieldset style={{ marginBottom: 6 }}>
                    <legend>Physics</legend>
                    <div className="group">
                      <div>
                        <input type="checkbox" id="chk-gravity" checked={selObj.hasGravity !== false} onChange={function(e) { updateObj({ ...selObj!, hasGravity: e.target.checked }); }} />
                        <label htmlFor="chk-gravity">Gravity</label>
                      </div>
                      <div>
                        <input type="checkbox" id="chk-static" checked={selObj.isStatic === true} onChange={function(e) { updateObj({ ...selObj!, isStatic: e.target.checked }); }} />
                        <label htmlFor="chk-static">Static</label>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 4 }}>
                      <div><label style={{ fontSize: 8, color: '#aaa' }}>Mass</label><input type="number" style={{ width: '100%', fontSize: 10 }} step="0.1" value={selObj.mass != null ? selObj.mass : 1} onChange={function(e) { updateObj({ ...selObj!, mass: +e.target.value }); }} /></div>
                      <div><label style={{ fontSize: 8, color: '#aaa' }}>Bounce</label><input type="number" style={{ width: '100%', fontSize: 10 }} step="0.1" min="0" max="1" value={selObj.bounce != null ? selObj.bounce : 0.2} onChange={function(e) { updateObj({ ...selObj!, bounce: +e.target.value }); }} /></div>
                    </div>
                  </fieldset>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button onClick={function() { setShowVectorEditor(true); }}>🎨 Vector Editor</button>
                    <button onClick={uploadTexture}>📷 Texture</button>
                    <button onClick={function() { if (confirm('Delete "' + selObj!.name + '"?')) delObj(selObj!.id); }}>🗑️ Delete</button>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#aaa', fontSize: 10, textAlign: 'center', padding: 32 }}>Select a sprite</div>
              )}
            </div>
          </div>

          {/* Console */}
          <div style={{ height: 85, borderTop: '1px solid #999', flexShrink: 0 }}>
            <div className="window active" style={{ height: '100%', borderRadius: 0, display: 'flex', flexDirection: 'column' }}>
              <div className="title-bar">
                <div className="title-bar-text">Console</div>
                <div className="title-bar-controls">
                  <button aria-label="Close" onClick={function() { setLogs([]); }} title="Clear"></button>
                </div>
              </div>
              <div className="window-body has-space" style={{ flex: 1, overflow: 'hidden', padding: 0, margin: 0 }}>
                <ConsolePanel logs={logs} onClear={function() { setLogs([]); }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 8px', background: '#e0e2e4', borderTop: '1px solid #aaa', fontSize: 9, color: '#888', flexShrink: 0 }}>
        <span>🎮 FunnyNetworkEngine</span>
        <span>|</span>
        <span>{objects.length} sprites</span>
        <span>|</span>
        <span>{scripts.length} blocks</span>
        <span>|</span>
        <span>WASD=scroll</span>
        <div style={{ flex: 1 }} />
        {isPlaying && (
          <div role="progressbar" className="animate" style={{ width: 80 }}>
            <div style={{ width: '100%' }}></div>
          </div>
        )}
        <span>{isPlaying ? '● Running' : '○ Stopped'}</span>
      </div>

      {/* Modals */}
      {showVectorEditor && selObj && <VectorEditor object={selObj} onSave={vectorSave} onClose={function() { setShowVectorEditor(false); }} />}
      {showSpriteLibrary && <SpriteLibrary onSelect={addFromLib} onClose={function() { setShowSpriteLibrary(false); }} />}
      {showBgPaint && <BgPaintDialog
        sceneBg={sceneBg}
        onSave={function(dataUrl) { setSceneBg(dataUrl); }}
        onClear={function() { setSceneBg(null); }}
        onUpload={uploadBackground}
        onClose={function() { setShowBgPaint(false); }}
      />}
    </div>
  );
};

export default App;
