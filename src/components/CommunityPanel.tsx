import { useState, useEffect, useRef, useCallback } from 'react';
import { LevelData } from '../types';

const SAMPLE: LevelData[] = [
  { id: '1', name: 'Neon Platforms', author: 'xXGamerXx', description: 'Jump through neon-lit platforms!', objects: [], scripts: [], likes: 342, downloads: 1205, createdAt: '2024-01-15', plays: 3200, tags: ['platformer','neon'] },
  { id: '2', name: 'Physics Playground', author: 'ScienceKid99', description: 'Experiment with gravity and ramps.', objects: [], scripts: [], likes: 189, downloads: 876, createdAt: '2024-02-20', plays: 1800, tags: ['physics','sandbox'] },
  { id: '3', name: 'Crystal Caves', author: 'LevelMaster', description: 'Explore underground caves.', objects: [], scripts: [], likes: 567, downloads: 2341, createdAt: '2024-01-28', plays: 5100, tags: ['adventure'] },
  { id: '4', name: 'Sky Race', author: 'SpeedRunner42', description: 'Race across floating islands!', objects: [], scripts: [], likes: 423, downloads: 1890, createdAt: '2024-03-05', plays: 4300, tags: ['racing'] },
  { id: '5', name: 'Puzzle Box', author: 'BrainTeaser', description: 'Physics-based puzzles.', objects: [], scripts: [], likes: 298, downloads: 1102, createdAt: '2024-02-14', plays: 2100, tags: ['puzzle'] },
  { id: '6', name: 'Retro Runner', author: 'PixelArtFan', description: 'Classic retro action.', objects: [], scripts: [], likes: 156, downloads: 743, createdAt: '2024-03-10', plays: 1200, tags: ['retro'] },
  { id: '7', name: 'Gravity Flip', author: 'PhysX_Pro', description: 'Flip gravity to solve!', objects: [], scripts: [], likes: 890, downloads: 4500, createdAt: '2024-03-12', plays: 8700, tags: ['physics'] },
  { id: '8', name: 'Robot Factory', author: 'TechBuilder', description: 'Build robots!', objects: [], scripts: [], likes: 445, downloads: 2100, createdAt: '2024-03-14', plays: 3800, tags: ['building'] },
];

const ICONS = ['🏙️','⚗️','💎','🏔️','🧩','👾','🔄','🤖'];

interface Props { onClose: () => void; }

export default function CommunityPanel({ onClose }: Props) {
  const [tab, setTab] = useState<'featured'|'recent'|'top'|'mystuff'>('featured');
  const [search, setSearch] = useState('');
  const [levels, setLevels] = useState<LevelData[]>(SAMPLE);
  const [wsStatus, setWsStatus] = useState<'connecting'|'connected'|'offline'>('connecting');
  const [onlineCount, setOnlineCount] = useState(0);
  const wsRef = useRef<WebSocket|null>(null);

  useEffect(() => {
    let ws: WebSocket|null = null;
    let timer: number|undefined;
    const connect = () => {
      setWsStatus('connecting');
      try {
        ws = new WebSocket('ws://localhost:8000/ws/community/');
        wsRef.current = ws;
        ws.onopen = () => {
          setWsStatus('connected');
          ws?.send(JSON.stringify({ type: 'get_projects', tab }));
        };
        ws.onmessage = (e) => {
          try {
            const d = JSON.parse(e.data);
            if (d.type === 'projects_list' && Array.isArray(d.projects)) setLevels(d.projects);
            if (d.type === 'project_added' && d.project) setLevels(p => [d.project, ...p]);
            if (d.type === 'online_count') setOnlineCount(d.count);
          } catch(_e) {/**/}
        };
        ws.onclose = () => {
          setWsStatus('offline');
          wsRef.current = null;
          setLevels(SAMPLE);
          timer = window.setTimeout(connect, 5000);
        };
        ws.onerror = () => {};
      } catch(_e) {
        setWsStatus('offline');
        setLevels(SAMPLE);
      }
    };
    connect();
    return () => { if (timer) clearTimeout(timer); if (ws) { ws.onclose = null; ws.close(); } };
  }, []);

  useEffect(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'get_projects', tab }));
    }
  }, [tab]);

  const publish = useCallback(() => {
    const d = localStorage.getItem('fne_level');
    if (!d) { alert('Save your level first!'); return; }
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'publish_project', project: JSON.parse(d) }));
      alert('Published!');
    } else {
      alert('Not connected to server.');
    }
  }, []);

  const filtered = levels.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.author.toLowerCase().includes(q);
  });

  const tabs: {key: typeof tab; label: string}[] = [
    {key:'featured',label:'Featured'},
    {key:'recent',label:'Recent Projects'},
    {key:'top',label:'Top Loved'},
    {key:'mystuff',label:'My Stuff'},
  ];

  /* ========== SCRATCH 1.4 LAYOUT WITH BLUE TOPBAR ========== */
  return (
    <div style={{width:'100vw',height:'100vh',display:'flex',flexDirection:'column',background:'#e8e8e0',fontFamily:'Helvetica, Arial, sans-serif'}}>

      {/* ===== BLUE GRADIENT TOPBAR ===== */}
      <div style={{
        background:'linear-gradient(180deg, #4c97ff 0%, #3373cc 100%)',
        borderBottom:'1px solid #2a5faa',
        padding:'6px 16px',
        display:'flex', alignItems:'center', gap:16,
        flexShrink:0,
      }}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{
            width:30,height:30,borderRadius:6,
            background:'linear-gradient(135deg,#fff,#d0e8ff)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:16,fontWeight:'bold',color:'#3373cc',
            border:'1px solid rgba(255,255,255,0.5)',
          }}>F</div>
          <span style={{fontSize:15,fontWeight:'bold',color:'#fff',textShadow:'0 1px 2px rgba(0,0,0,0.3)'}}>FunnyNetworkEngine</span>
        </div>
        <div style={{display:'flex',gap:4,marginLeft:12}}>
          {['Create','Explore','Community','About'].map(n => (
            <div key={n} style={{
              padding:'4px 14px',borderRadius:3,
              background: n==='Community' ? 'rgba(255,255,255,0.25)' : 'transparent',
              color:'#fff',fontSize:12,fontWeight:n==='Community'?'bold':'normal',
              cursor:'pointer',
            }}>{n}</div>
          ))}
        </div>
        <div style={{flex:1}}/>
        <input
          style={{padding:'4px 10px',borderRadius:12,border:'1px solid rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.9)',fontSize:11,width:180,outline:'none'}}
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <div style={{width:8,height:8,borderRadius:4,background:wsStatus==='connected'?'#4caf50':wsStatus==='connecting'?'#ffc107':'#f44336'}}/>
          <span style={{fontSize:9,color:'rgba(255,255,255,0.8)'}}>{wsStatus==='connected'?onlineCount+' online':'Offline'}</span>
          <button onClick={onClose} style={{padding:'3px 10px',borderRadius:3,border:'1px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.2)',fontSize:11,cursor:'pointer',color:'#fff',fontWeight:'bold'}}>← Back</button>
        </div>
      </div>

      {/* ===== ORANGE SCRATCH 1.4 HEADER ===== */}
      <div style={{
        background:'linear-gradient(180deg, #f5a623 0%, #d4820f 100%)',
        borderBottom:'2px solid #b36a00',
        padding:'10px 16px',
        flexShrink:0,
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:20,fontWeight:'bold',color:'#fff',textShadow:'0 2px 3px rgba(0,0,0,0.3)'}}>Community</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.85)'}}>Explore and share projects with the FunnyNetworkEngine community</div>
          </div>
          <button onClick={publish} style={{
            padding:'6px 16px',borderRadius:4,
            background:'linear-gradient(180deg,#8BC34A,#689F38)',
            color:'#fff',border:'1px solid #558B2F',
            fontSize:12,fontWeight:'bold',cursor:'pointer',
            boxShadow:'0 2px 4px rgba(0,0,0,0.2)',
          }}>📤 Publish My Level</button>
        </div>
      </div>

      {/* TABS BAR — Scratch 1.4 grey tab bar */}
      <div style={{
        display:'flex',alignItems:'flex-end',
        background:'#c8c8c0',
        borderBottom:'1px solid #999',
        padding:'0 12px',
        flexShrink:0,
      }}>
        {tabs.map(t => (
          <div key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding:'6px 16px',
              background: tab===t.key ? '#e8e8e0' : '#c8c8c0',
              border: tab===t.key ? '1px solid #999' : '1px solid transparent',
              borderBottom: tab===t.key ? '1px solid #e8e8e0' : '1px solid #999',
              borderRadius:'4px 4px 0 0',
              fontSize:12,
              fontWeight: tab===t.key ? 'bold' : 'normal',
              color: tab===t.key ? '#333' : '#666',
              cursor:'pointer',
              marginBottom:-1,
            }}
          >{t.label}</div>
        ))}
        <div style={{flex:1}}/>
        <button onClick={publish} style={{
          padding:'3px 12px',borderRadius:3,
          background:'linear-gradient(180deg,#8BC34A,#689F38)',
          color:'#fff',border:'1px solid #558B2F',
          fontSize:11,fontWeight:'bold',cursor:'pointer',
          marginBottom:4,
        }}>📤 Publish Level</button>
      </div>

      {/* CONTENT AREA — Scratch 1.4 beige background with project cards */}
      <div style={{flex:1,overflow:'auto',padding:'16px 24px',background:'#e8e8e0'}}>
        {/* Section header */}
        <div style={{marginBottom:16}}>
          <h2 style={{fontSize:16,fontWeight:'bold',color:'#555',margin:0,marginBottom:4}}>
            {tab==='featured'?'Featured Projects':tab==='recent'?'Newest Projects':tab==='top'?'Top Loved Projects':'My Stuff'}
          </h2>
          <div style={{height:2,background:'linear-gradient(90deg,#f5a623,transparent)',width:200,borderRadius:1}}/>
          {wsStatus==='offline' && (
            <div style={{fontSize:10,color:'#996600',marginTop:6,background:'#fff3cd',padding:'4px 8px',borderRadius:3,border:'1px solid #ffe082',display:'inline-block'}}>
              ⚠ Server offline — showing sample projects. Start Django server for real data.
            </div>
          )}
        </div>

        {/* Project grid — Scratch 1.4 style cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:14}}>
          {filtered.map((level,i) => (
            <div key={level.id} style={{
              background:'#fff',
              border:'1px solid #ccc',
              borderRadius:5,
              overflow:'hidden',
              boxShadow:'0 1px 3px rgba(0,0,0,0.1)',
              cursor:'pointer',
              transition:'box-shadow 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)')}
            >
              {/* Thumbnail */}
              <div style={{
                width:'100%',height:120,
                background:'linear-gradient(135deg,#d0d8e0,#b8c4d0)',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:40,borderBottom:'1px solid #ddd',
                position:'relative',
              }}>
                {level.thumbnail ? (
                  <img src={level.thumbnail} alt={level.name} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                ) : (
                  ICONS[i % ICONS.length]
                )}
                {/* Love count badge */}
                <div style={{
                  position:'absolute',top:4,right:4,
                  background:'rgba(0,0,0,0.6)',color:'#fff',
                  padding:'1px 6px',borderRadius:8,fontSize:9,
                }}>❤ {level.likes}</div>
              </div>

              {/* Info */}
              <div style={{padding:'8px 10px'}}>
                <div style={{fontSize:13,fontWeight:'bold',color:'#333',marginBottom:2,
                  overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'
                }}>{level.name}</div>
                <div style={{fontSize:11,color:'#7a7a7a',marginBottom:4}}>
                  by <span style={{color:'#4a7ab5',cursor:'pointer'}}>{level.author}</span>
                </div>

                {/* Stats row */}
                <div style={{display:'flex',gap:8,fontSize:9,color:'#aaa',marginBottom:6}}>
                  <span>👁 {level.plays}</span>
                  <span>❤ {level.likes}</span>
                  <span>⬇ {level.downloads}</span>
                </div>

                {/* Tags */}
                {level.tags && level.tags.length > 0 && (
                  <div style={{display:'flex',gap:3,flexWrap:'wrap',marginBottom:6}}>
                    {level.tags.map(t => (
                      <span key={t} style={{
                        fontSize:8,padding:'1px 5px',borderRadius:6,
                        background:'#eef2f7',color:'#556',border:'1px solid #dde1e6',
                      }}>{t}</span>
                    ))}
                  </div>
                )}

                {/* Buttons — Scratch 1.4 style */}
                <div style={{display:'flex',gap:4}}>
                  <button style={{
                    flex:1,padding:'4px 0',fontSize:10,fontWeight:'bold',
                    background:'linear-gradient(180deg,#7ec846,#5ca62e)',
                    color:'#fff',border:'1px solid #4a8a22',borderRadius:3,
                    cursor:'pointer',
                  }}>▶ Play</button>
                  <button style={{
                    flex:1,padding:'4px 0',fontSize:10,
                    background:'linear-gradient(180deg,#f0f0f0,#ddd)',
                    color:'#555',border:'1px solid #bbb',borderRadius:3,
                    cursor:'pointer',
                  }}>See Inside</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{textAlign:'center',padding:60,color:'#999'}}>
            <div style={{fontSize:48,marginBottom:8}}>🔍</div>
            <div style={{fontSize:16,fontWeight:600}}>No projects found</div>
            <div style={{fontSize:12}}>Try a different search</div>
          </div>
        )}
      </div>

      {/* FOOTER — Scratch 1.4 style */}
      <div style={{
        padding:'6px 16px',
        background:'#c8c8c0',
        borderTop:'1px solid #999',
        display:'flex',alignItems:'center',justifyContent:'space-between',
        fontSize:10,color:'#777',flexShrink:0,
      }}>
        <span>FunnyNetworkEngine Community · {filtered.length} projects</span>
        <div style={{display:'flex',gap:3}}>
          {[1,2,3,4,5].map(p => (
            <button key={p} style={{
              width:20,height:18,borderRadius:2,fontSize:9,cursor:'pointer',
              background:p===1?'#f5a623':'#e0e0d8',
              color:p===1?'#fff':'#555',
              border:p===1?'1px solid #b36a00':'1px solid #bbb',
            }}>{p}</button>
          ))}
        </div>
        <span>WebSocket: {wsStatus==='connected'?'🟢 Connected':wsStatus==='connecting'?'🟡 Connecting':'🔴 Offline'} · Django</span>
      </div>
    </div>
  );
}
