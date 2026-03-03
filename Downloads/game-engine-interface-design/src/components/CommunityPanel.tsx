import { useState, useEffect, useRef, useCallback } from 'react';

interface Project {
  id: number;
  title: string;
  author: string;
  description: string;
  likes: number;
  plays: number;
  created_at: string;
  thumbnail: string;
}

var ICONS = ['🏙️','⚗️','💎','🏔️','🧩','👾','🔄','🤖','🎮','🌟','🚀','🎨'];

interface Props { onClose: () => void; }

export default function CommunityPanel({ onClose }: Props) {
  var [tab, setTab] = useState<'featured'|'recent'|'top'|'mystuff'>('featured');
  var [search, setSearch] = useState('');
  var [projects, setProjects] = useState<Project[]>([]);
  var [wsStatus, setWsStatus] = useState<'connecting'|'connected'|'offline'>('connecting');
  var [publishName, setPublishName] = useState('');
  var [publishAuthor, setPublishAuthor] = useState('');
  var [showPublish, setShowPublish] = useState(false);
  var wsRef = useRef<WebSocket|null>(null);

  var getWsUrl = useCallback(function() {
    var loc = window.location;
    var protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    return protocol + '//' + loc.host + '/ws/community/';
  }, []);

  useEffect(function() {
    var ws: WebSocket|null = null;
    var timer: number|undefined;
    var dead = false;

    function connect() {
      if (dead) return;
      setWsStatus('connecting');
      try {
        ws = new WebSocket(getWsUrl());
        wsRef.current = ws;
        ws.onopen = function() {
          setWsStatus('connected');
          if (ws) ws.send(JSON.stringify({ type: 'get_projects' }));
        };
        ws.onmessage = function(e) {
          try {
            var d = JSON.parse(e.data);
            if (d.type === 'projects_list' && Array.isArray(d.projects)) {
              setProjects(d.projects);
            }
            if (d.type === 'project_added' && d.project) {
              setProjects(function(p) { return [d.project].concat(p); });
            }
          } catch(_e) {/**/}
        };
        ws.onclose = function() {
          if (dead) return;
          setWsStatus('offline');
          wsRef.current = null;
          timer = window.setTimeout(connect, 5000);
        };
        ws.onerror = function() {};
      } catch(_e) {
        setWsStatus('offline');
        timer = window.setTimeout(connect, 5000);
      }
    }
    connect();
    return function() {
      dead = true;
      if (timer) clearTimeout(timer);
      if (ws) { ws.onclose = null; ws.close(); }
    };
  }, [getWsUrl]);

  useEffect(function() {
    var ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'get_projects' }));
    }
  }, [tab]);

  var publish = useCallback(function() {
    var d = localStorage.getItem('fne_level');
    if (!d) { alert('Save your level first! (File > Save Level)'); return; }
    var ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      var parsed = JSON.parse(d);
      ws.send(JSON.stringify({
        type: 'publish',
        title: publishName || parsed.levelName || 'Untitled',
        author: publishAuthor || 'Anonymous',
        description: '',
        level_data: parsed,
      }));
      setShowPublish(false);
      setPublishName('');
      setPublishAuthor('');
      alert('Published!');
    } else {
      alert('Not connected to server.');
    }
  }, [publishName, publishAuthor]);

  var filtered = projects.filter(function(p) {
    if (!search) return true;
    var q = search.toLowerCase();
    return p.title.toLowerCase().indexOf(q) >= 0 || p.author.toLowerCase().indexOf(q) >= 0;
  });

  var tabList: {key: typeof tab; label: string}[] = [
    {key:'featured',label:'Featured'},
    {key:'recent',label:'Recent'},
    {key:'top',label:'Top Loved'},
    {key:'mystuff',label:'My Stuff'},
  ];

  return (
    <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',background:'#e8e8e0'}}>
      {/* BLUE TOPBAR */}
      <div style={{background:'linear-gradient(180deg,#4c97ff,#3373cc)',borderBottom:'1px solid #2a5faa',padding:'8px 16px',display:'flex',alignItems:'center',gap:16,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:32,height:32,borderRadius:6,background:'linear-gradient(135deg,#fff,#d0e8ff)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:'bold',color:'#3373cc',border:'1px solid rgba(255,255,255,0.5)'}}>F</div>
          <span style={{fontSize:16,fontWeight:'bold',color:'#fff',textShadow:'0 1px 2px rgba(0,0,0,0.3)'}}>FunnyNetworkEngine</span>
        </div>
        <div style={{flex:1}}/>
        <input style={{padding:'5px 12px',borderRadius:14,border:'1px solid rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.9)',fontSize:12,width:200,outline:'none'}} placeholder="Search projects..." value={search} onChange={function(e){setSearch(e.target.value);}}/>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:8,height:8,borderRadius:4,background:wsStatus==='connected'?'#4caf50':wsStatus==='connecting'?'#ffc107':'#f44336'}}/>
          <span style={{fontSize:10,color:'rgba(255,255,255,0.9)'}}>{wsStatus==='connected'?'Connected':wsStatus==='connecting'?'Connecting...':'Offline'}</span>
          <button onClick={onClose} style={{padding:'4px 12px',borderRadius:4,border:'1px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.2)',fontSize:12,cursor:'pointer',color:'#fff',fontWeight:'bold'}}>← Back</button>
        </div>
      </div>

      {/* ORANGE HEADER */}
      <div style={{background:'linear-gradient(180deg,#f5a623,#d4820f)',borderBottom:'2px solid #b36a00',padding:'12px 20px',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:22,fontWeight:'bold',color:'#fff',textShadow:'0 2px 3px rgba(0,0,0,0.3)'}}>Community Projects</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.85)'}}>Explore and play projects made by the community</div>
          </div>
          <button onClick={function(){setShowPublish(true);}} style={{padding:'8px 20px',borderRadius:5,background:'linear-gradient(180deg,#8BC34A,#689F38)',color:'#fff',border:'1px solid #558B2F',fontSize:13,fontWeight:'bold',cursor:'pointer',boxShadow:'0 2px 4px rgba(0,0,0,0.2)'}}>📤 Publish My Level</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{display:'flex',alignItems:'flex-end',background:'#c8c8c0',borderBottom:'1px solid #999',padding:'0 16px',flexShrink:0}}>
        {tabList.map(function(t){
          return (
            <div key={t.key} onClick={function(){setTab(t.key);}} style={{
              padding:'7px 18px',
              background:tab===t.key?'#e8e8e0':'#c8c8c0',
              border:tab===t.key?'1px solid #999':'1px solid transparent',
              borderBottom:tab===t.key?'1px solid #e8e8e0':'1px solid #999',
              borderRadius:'5px 5px 0 0',fontSize:13,
              fontWeight:tab===t.key?'bold':'normal',
              color:tab===t.key?'#333':'#666',cursor:'pointer',marginBottom:-1,
            }}>{t.label}</div>
          );
        })}
      </div>

      {/* PUBLISH MODAL */}
      {showPublish && (
        <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="window active" style={{width:350}}>
            <div className="title-bar">
              <div className="title-bar-text">📤 Publish Level</div>
              <div className="title-bar-controls"><button aria-label="Close" onClick={function(){setShowPublish(false);}}></button></div>
            </div>
            <div className="window-body has-space">
              <fieldset>
                <legend>Project Details</legend>
                <div className="field-row" style={{marginBottom:8}}><label>Name:</label><input type="text" value={publishName} onChange={function(e){setPublishName(e.target.value);}} placeholder="My Level" style={{width:'100%'}}/></div>
                <div className="field-row" style={{marginBottom:8}}><label>Author:</label><input type="text" value={publishAuthor} onChange={function(e){setPublishAuthor(e.target.value);}} placeholder="Your name" style={{width:'100%'}}/></div>
              </fieldset>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:12}}>
                <button onClick={publish}>📤 Publish</button>
                <button onClick={function(){setShowPublish(false);}}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROJECTS GRID */}
      <div className="has-scrollbar" style={{flex:1,overflow:'auto',padding:'16px 24px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:16}}>
          {filtered.map(function(p, i){
            return (
              <div key={p.id} style={{background:'#fff',border:'1px solid #ccc',borderRadius:6,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.1)',cursor:'pointer'}}>
                <div style={{width:'100%',height:130,background:'linear-gradient(135deg,#d0d8e0,#b8c4d0)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:44,borderBottom:'1px solid #ddd',position:'relative'}}>
                  {p.thumbnail ? <img src={p.thumbnail} alt={p.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : ICONS[i % ICONS.length]}
                  <div style={{position:'absolute',top:6,right:6,background:'rgba(0,0,0,0.65)',color:'#fff',padding:'2px 8px',borderRadius:10,fontSize:10}}>❤ {p.likes}</div>
                </div>
                <div style={{padding:'10px 12px'}}>
                  <div style={{fontSize:14,fontWeight:'bold',color:'#333',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.title}</div>
                  <div style={{fontSize:12,color:'#7a7a7a',marginBottom:5}}>by <span style={{color:'#4a7ab5',fontWeight:500}}>{p.author}</span></div>
                  <div style={{display:'flex',gap:10,fontSize:10,color:'#aaa',marginBottom:8}}><span>▶ {p.plays}</span><span>❤ {p.likes}</span></div>
                  <div style={{display:'flex',gap:5}}>
                    <button style={{flex:1,padding:'5px 0',fontSize:11,background:'linear-gradient(180deg,#7ec846,#5ca62e)',color:'#fff',border:'1px solid #4a8a22',borderRadius:4,cursor:'pointer',fontWeight:'bold'}}>▶ Play</button>
                    <button style={{flex:1,padding:'5px 0',fontSize:11,background:'linear-gradient(180deg,#f0f0f0,#ddd)',color:'#555',border:'1px solid #bbb',borderRadius:4,cursor:'pointer'}}>See Inside</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div style={{textAlign:'center',padding:60,color:'#999'}}>
            <div style={{fontSize:48,marginBottom:8}}>🔍</div>
            <div style={{fontSize:18,fontWeight:600}}>No projects found</div>
            <div style={{fontSize:13,marginTop:4}}>{wsStatus==='offline'?'Server offline — deploy to Render':'Be the first to publish!'}</div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{padding:'8px 16px',background:'#c8c8c0',borderTop:'1px solid #999',display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:11,color:'#666',flexShrink:0}}>
        <span>{filtered.length} projects</span>
        <span>WebSocket: {wsStatus==='connected'?'🟢 Connected':wsStatus==='connecting'?'🟡 Connecting...':'🔴 Offline'}</span>
      </div>
    </div>
  );
}
