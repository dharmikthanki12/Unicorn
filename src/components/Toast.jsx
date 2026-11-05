import React from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from './Icons';

export function Toast() {
  const { toast, theme } = useApp();
  if (!toast) return null;

  const isError = toast.type === 'error';
  const isLight = theme === 'light';

  const bg = isError 
    ? (isLight ? '#FEF2F2' : '#3B1822')
    : (isLight ? '#F0FDF4' : 'var(--surface3)');
  const border = isError
    ? (isLight ? '#F87171' : '#ff5c77')
    : (isLight ? '#86EFAC' : 'var(--accent-text)');
  const textColor = isError
    ? (isLight ? '#991B1B' : '#FFF1F2')
    : (isLight ? '#166534' : 'var(--text)');

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '480px',
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: '12px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: isLight ? '0 8px 24px rgba(0,0,0,0.12)' : '0 8px 32px rgba(0,0,0,0.6)',
      zIndex: 99999,
      animation: 'slideDown 0.25s ease'
    }}>
      <div style={{
        width: '26px',
        height: '26px',
        borderRadius: '50%',
        background: isError ? '#EF4444' : 'var(--grad)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon d={isError ? ICONS.info : ICONS.check} size={15} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, color: textColor, flex: 1 }}>
        {toast.message}
      </span>
    </div>
  );
}

