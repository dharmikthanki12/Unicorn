import React from 'react';
import { useApp } from '../context/AppContext';

export function WalletModal() {
  const { isWalletModalOpen, closeWalletModal, connectWeb3MetaMask, connectWeb3Demo } = useApp();

  if (!isWalletModalOpen) return null;

  const hasMetaMask = typeof window !== 'undefined' && Boolean(window.ethereum);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: 'var(--shadow)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={closeWalletModal}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            fontSize: '20px',
            color: 'var(--muted)',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: '4px'
          }}
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'rgba(246, 133, 27, 0.15)',
            color: '#F6851B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px'
          }}>
            🦊
          </div>
          <h2 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 700 }}>
            Connect Web3 Wallet
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
            Connect to BNB Smart Chain (BEP-20) to manage smart contract transactions and native tokens.
          </span>
        </div>

        {/* Wallet Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Option 1: MetaMask Extension */}
          <button
            onClick={connectWeb3MetaMask}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px',
              borderRadius: '16px',
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '28px' }}>🦊</span>
              <div>
                <strong style={{ fontSize: '15px', display: 'block', color: 'var(--text)' }}>
                  {hasMetaMask ? 'Connect MetaMask' : 'Open / Install MetaMask'}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  {hasMetaMask ? 'MetaMask detected · Click to authorize' : 'Redirect to MetaMask App / Extension download'}
                </span>
              </div>
            </div>
            <span style={{ fontSize: '18px', color: 'var(--muted)' }}>→</span>
          </button>

          {/* Option 2: Instant Demo / Simulation Wallet */}
          <button
            onClick={connectWeb3Demo}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px',
              borderRadius: '16px',
              background: 'rgba(181, 92, 169, 0.08)',
              border: '1px solid rgba(181, 92, 169, 0.3)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '28px' }}>⚡</span>
              <div>
                <strong style={{ fontSize: '15px', display: 'block', color: 'var(--accent-text)' }}>
                  Instant Test Wallet (Demo)
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  Connect a simulated BEP-20 address in 1 click (No extension required)
                </span>
              </div>
            </div>
            <span style={{ fontSize: '18px', color: 'var(--accent-text)' }}>→</span>
          </button>
        </div>

        {/* Security Notice */}
        <div style={{
          fontSize: '12px',
          color: 'var(--muted)',
          textAlign: 'center',
          lineHeight: 1.5,
          borderTop: '1px solid var(--divider)',
          paddingTop: '12px'
        }}>
          🔒 UNICORN will never ask for your private key or seed phrase. Connection only shares your public BNB address.
        </div>
      </div>
    </div>
  );
}

