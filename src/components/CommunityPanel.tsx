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

interface Props {
  onLoadProject?: (data: any) => void;
}

export default function CommunityPanel({ onLoadProject }: Props) {
  var [projects, setProjects] = useState<Project[]>([]);
  var [tab, setTab] = useState('featured');
  var [showPublish, setShowPublish] = useState(false);
  var [publishName, setPublishName] = useState('');
  var [publishAuthor, setPublishAuthor] = useState('');
  var [connected, setConnected] = useState(false);
  var wsRef = useRef<WebSocket | null>(null);

  useEffect(function() {
    var proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    var url = proto + '//' + window.location.host + '/ws/community/';
    var ws: WebSocket;

    function connect() {
      try {
        ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = function() {
          setConnected(true);
          ws.send(JSON.stringify({ type: 'get_projects' }));
        };

        ws.onmessage = function(e) {
          try {
            var data = JSON.parse(e.data);
            if (data.type === 'projects_list' && data.projects) {
              setProjects(data.projects);
            } else if (data.type === 'project_added' && data.project) {
              setProjects(function(prev) { return [data.project].concat(prev); });
            } else if (data.type === 'project_detail' && data.project && data.project.level_data) {
              if (onLoadProject) {
                onLoadProject(data.project.level_data);
              }
            }
          } catch (err) {}
        };

        ws.onclose = function() {
          setConnected(false);
          wsRef.current = null;
          setTimeout(connect, 5000);
        };

        ws.onerror = function() {
          setConnected(false);
        };
      } catch (err) {
        setConnected(false);
        setTimeout(connect, 5000);
      }
    }

    connect();

    fetch('/api/projects/')
      .then(function(r) { return r.json(); })
      .then(function(d) { if (d.projects) setProjects(d.projects); })
      .catch(function() {});

    return function() {
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
      }
    };
  }, [onLoadProject]);

  var publish = useCallback(function() {
    var d = localStorage.getItem('fne_level');
    if (!d) { alert('Save your level first! (File > Save Level)'); return; }
    var parsed: any;
    try { parsed = JSON.parse(d); } catch (e) { alert('Invalid save data'); return; }
    var payload = {
      type: 'publish',
      title: publishName || parsed.levelName || 'Untitled',
      author: publishAuthor || 'Anonymous',
      description: '',
      level_data: parsed,
    };

    var ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      setShowPublish(false);
      setPublishName('');
      setPublishAuthor('');
      alert('Published!');
    } else {
      fetch('/api/projects/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.status === 'ok' || data.id) {
            setShowPublish(false);
            setPublishName('');
            setPublishAuthor('');
            alert('Published successfully!');
            fetch('/api/projects/')
              .then(function(r) { return r.json(); })
              .then(function(d) { if (d.projects) setProjects(d.projects); })
              .catch(function() {});
          } else {
            alert('Failed to publish');
          }
        })
        .catch(function() {
          alert('Server is waking up. Please wait 30-60 seconds and try again.');
        });
    }
  }, [publishName, publishAuthor]);

  function loadProject(id: number) {
    var ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'get_project', id: id }));
    } else {
      fetch('/api/projects/' + id + '/')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.level_data && onLoadProject) {
            onLoadProject(data.level_data);
          }
        })
        .catch(function() { alert('Failed to load project'); });
    }
  }

  var filteredProjects = projects;
  if (tab === 'recent') {
    filteredProjects = projects.slice().sort(function(a, b) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  } else if (tab === 'top') {
    filteredProjects = projects.slice().sort(function(a, b) { return b.likes - a.likes; });
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#e8e8e0' }}>
      <div className="scratch14-community-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>🎮 FunnyNetworkEngine Community</h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.85 }}>Share your levels with the world</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? '#4caf50' : '#f44336',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: '11px' }}>{connected ? 'Connected' : 'Offline'}</span>
            <button onClick={function() { setShowPublish(true); }}>📤 Publish My Level</button>
          </div>
        </div>
      </div>

      <div className="scratch14-community-nav">
        {['featured', 'recent', 'top', 'my stuff'].map(function(t) {
          return (
            <div
              key={t}
              className={'scratch14-community-nav-item' + (tab === t ? ' active' : '')}
              onClick={function() { setTab(t); }}
            >
              {t === 'featured' ? '⭐ Featured' : t === 'recent' ? '🕐 Recent' : t === 'top' ? '❤️ Top Loved' : '📁 My Stuff'}
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {filteredProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            <p style={{ fontSize: '18px' }}>No projects yet!</p>
            <p style={{ fontSize: '13px' }}>Be the first to publish a level.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px'
          }}>
            {filteredProjects.map(function(p) {
              return (
                <div key={p.id} className="scratch14-project-card">
                  <div className="scratch14-project-thumb">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : '🎮'}
                  </div>
                  <div style={{ padding: '8px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title}
                    </div>
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>
                      by {p.author}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: '#888', marginBottom: '6px' }}>
                      <span>❤️ {p.likes}</span>
                      <span>▶ {p.plays}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        style={{ flex: 1, fontSize: '10px', padding: '3px 6px' }}
                        onClick={function() { loadProject(p.id); }}
                      >
                        ▶ Play
                      </button>
                      <button
                        style={{ flex: 1, fontSize: '10px', padding: '3px 6px' }}
                        onClick={function() { loadProject(p.id); }}
                      >
                        See Inside
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showPublish && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div className="window active" style={{ width: '350px' }}>
            <div className="title-bar">
              <div className="title-bar-text">📤 Publish Level</div>
              <div className="title-bar-controls">
                <button aria-label="Close" onClick={function() { setShowPublish(false); }} />
              </div>
            </div>
            <div className="window-body has-space">
              <div className="field-row-stacked" style={{ marginBottom: '8px' }}>
                <label>Project Name:</label>
                <input
                  type="text"
                  value={publishName}
                  onChange={function(e) { setPublishName(e.target.value); }}
                  placeholder="My Awesome Level"
                />
              </div>
              <div className="field-row-stacked" style={{ marginBottom: '12px' }}>
                <label>Author:</label>
                <input
                  type="text"
                  value={publishAuthor}
                  onChange={function(e) { setPublishAuthor(e.target.value); }}
                  placeholder="Your name"
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={function() { setShowPublish(false); }}>Cancel</button>
                <button onClick={publish}>📤 Publish</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
