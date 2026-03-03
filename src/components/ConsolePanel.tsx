import React, { useRef, useEffect } from 'react';
import { ConsoleLog } from '../types';

interface ConsolePanelProps {
  logs: ConsoleLog[];
  onClear: () => void;
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const typeIcons: Record<string, string> = {
    info: 'ℹ️', warn: '⚠️', error: '❌', log: '📝',
  };

  return (
    <div ref={scrollRef} style={{ height: '100%', overflowY: 'auto', background: '#fff', fontSize: 10 }}>
      {logs.length === 0 && (
        <div style={{ color: '#ccc', textAlign: 'center', padding: 12, fontSize: 10 }}>Console output will appear here</div>
      )}
      {logs.map(log => (
        <div key={log.id} className={'console-line ' + log.type}>
          <span style={{ marginRight: 4 }}>{typeIcons[log.type]}</span>
          <span style={{ color: '#aaa', marginRight: 6 }}>[{log.timestamp}]</span>
          <span>{log.message}</span>
        </div>
      ))}
    </div>
  );
};

export default ConsolePanel;
