import { useState, useEffect, useCallback } from 'react';

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
  var [serverOnline, setServerOnline] = useState(false);
  var [loading, setLoading] = useState(true);

  function fetchProjects() {
    setLoading(true);
    fetch('/api/projects/')
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.projects) {
          setProjects(d.projects);
          setServerOnline(true);
        }
        setLoading(false);
      })
      .catch(function() {
        setServerOnline(false);
        setLoading(false);
      });
  }

  useEffect(function() {
    fetchProjects();
    var interval = setInterval(fetchProjects, 30000);
    return function() { clearInterval(interval); };
  }, []);

  var publish = useCallback(function() {
    var d = localStorage.getItem('fne_level');
    if (!d) { alert('Save your level first! (File > Save Level)'); return; }
    var parsed: any;
    try { parsed = JSON.parse(d); } catch (e) { alert('Invalid save data'); return; }

    fetch('/api/projects/create/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: publishName || parsed.levelName || 'Untitled',
        author: publishAuthor || 'Anonymous',
        description: '',
        level_data: parsed,
      }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.id || data.status === 'ok') {
          setShowPublish(false);
          setPublishName('');
          setPublishAuthor('');
          alert('Published successfully!');
          fetchProjects();
        } else {
          alert('Failed to publish');
        }
      })
      .catch(function() {
        alert('Server is waking up. Wait 30 seconds and try again.');
      });
  }, [publishName, publishAuthor]);

  function loadProject(id: number) {
    fetch('/api/projects/' + id + '/')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.level_data && onLoadProject) {
          onLoadProject(data.level_data);
          alert('Level loaded! Switch to Editor tab.');
        }
      })
      .catch(function() { alert('Failed to load project'); });
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
              background: serverOnline ? '#4caf50' : '#f44336',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: '11px', color: '#fff' }}>{serverOnline ? 'Online' : 'Offline'}</span>
            <button onClick={fetchProjects} style={{ fontSize: '11px', padding: '2px 8px' }}>🔄 Refresh</button>
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
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div role="progressbar" className="animate" style={{ width: '200px', margin: '0 auto' }}>
              <div style={{ width: '60%' }}></div>
            </div>
            <p style={{ color: '#888', marginTop: '12px' }}>Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            <p style={{ fontSize: '18px' }}>No projects yet!</p>
            <p style={{ fontSize: '13px' }}>Be the first to publish a level.</p>
            {!serverOnline && (
              <p style={{ fontSize: '12px', color: '#c33', marginTop: '8px' }}>
                Server may be waking up. Click 🔄 Refresh in 30 seconds.
              </p>
            )}
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
