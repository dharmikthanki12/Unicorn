import React from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from './Icons';

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div style={{
      position: 'absolute',
      top: '56px',
      left: '16px',
      right: '16px',
      background: isError ? '#3B1822' : 'var(--surface3)',
      border: `1px solid ${isError ? '#ff5c77' : 'var(--accent-text)'}`,
      borderRadius: '12px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      zIndex: 9999,
      animation: 'slideDown 0.25s ease'
    }}>
      <div style={{
        width: '26px',
        height: '26px',
        borderRadius: '50%',
        background: isError ? '#ff5c77' : 'var(--grad)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon d={isError ? ICONS.info : ICONS.check} size={15} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', flex: 1 }}>
        {toast.message}
      </span>
    </div>
  );
}

