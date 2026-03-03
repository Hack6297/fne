import React, { useState } from 'react';
import { SpriteLibraryItem, SPRITE_LIBRARY } from '../types';

interface Props {
  onSelect: (item: SpriteLibraryItem) => void;
  onClose: () => void;
}

var SpriteLibrary: React.FC<Props> = function({ onSelect, onClose }) {
  var [filter, setFilter] = useState('');
  var filtered = SPRITE_LIBRARY.filter(function(s) {
    return s.name.toLowerCase().indexOf(filter.toLowerCase()) >= 0 ||
           s.category.toLowerCase().indexOf(filter.toLowerCase()) >= 0;
  });
  var categories = Array.from(new Set(SPRITE_LIBRARY.map(function(s) { return s.category; })));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* 7.css window active */}
      <div className="window active" style={{ width: 500, maxHeight: '80vh' }}>
        <div className="title-bar">
          <div className="title-bar-text">Sprite Library</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={onClose}></button>
          </div>
        </div>
        <div className="window-body has-space" style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(80vh - 40px)' }}>
          <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              placeholder="Search sprites..."
              value={filter}
              onChange={function(e) { setFilter(e.target.value); }}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 10, color: '#888' }}>{filtered.length} sprites</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            <button style={{ fontSize: 9, padding: '1px 6px' }} onClick={function() { setFilter(''); }}>All</button>
            {categories.map(function(cat) {
              return <button key={cat} style={{ fontSize: 9, padding: '1px 6px' }} onClick={function() { setFilter(cat); }}>{cat}</button>;
            })}
          </div>
          {/* 7.css has-scrollbar */}
          <div className="has-scrollbar" style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {filtered.map(function(spr) {
                return (
                  <div key={spr.id}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 8, borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer', background: '#fff' }}
                    onClick={function() { onSelect(spr); }}
                  >
                    <span style={{ fontSize: 28 }}>{spr.icon}</span>
                    <span style={{ fontSize: 9, color: '#555', textAlign: 'center', marginTop: 2 }}>{spr.name}</span>
                    <span style={{ fontSize: 8, color: '#aaa' }}>{spr.category}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpriteLibrary;
