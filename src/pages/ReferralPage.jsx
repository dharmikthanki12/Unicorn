import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';

export function ReferralPage() {
  const { user, team, referralTiers, rankBonuses, achieverBonuses, showToast, navigateTo } = useApp();
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [showQrModal, setShowQrModal] = useState(false);

  const referralCode = user?.referralCode || 'UNC-88294';
  const referralUrl = `unicorn.vip/?ref=${referralCode}`;
  const isActivated = Boolean(user && (Number(user.activeInvestedAmount || 0) > 0 || user.isReferralActivated || user.role === 'admin'));

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(referralUrl);
    showToast('Referral link copied to clipboard!');
  };

  const handleShare = (platform) => {
    const text = `Join Unicorn Web3 Investment Platform with my referral code ${referralCode}: https://${referralUrl}`;
    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(`https://${referralUrl}`)}&text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'x') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
    } else if (platform === 'qr') {
      setShowQrModal(true);
    } else {
      if (navigator.share) {
        navigator.share({ title: 'Unicorn Web3 Platform', text, url: `https://${referralUrl}` });
      } else {
        handleCopyLink();
      }
    }
  };

  const levelList = [1, 2, 3, 4, 5, 6, 7];
  const members = team[selectedLevel] || [];
  const currentTier = referralTiers.find(t => t.level === selectedLevel) || {
    level: selectedLevel,
    rate: selectedLevel === 1 ? '5%' : selectedLevel <= 5 ? '2%' : selectedLevel <= 10 ? '1%' : selectedLevel <= 25 ? '0.25%' : '0.125%',
    minDirects: selectedLevel === 1 ? 2 : selectedLevel <= 5 ? 4 : selectedLevel <= 10 ? 7 : selectedLevel <= 25 ? 12 : 15
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 className="num" style={{ margin: 0, fontSize: '32px', fontWeight: 600 }}>
        Referral
      </h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left Column */}
        <div style={{ flex: '1 1 440px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card 1: Your referral link */}
          <section className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--muted)' }}>Your referral link</span>
              <span className="num" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-text)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: '6px' }}>
                CODE: {referralCode}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                className="num"
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {referralUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="btnp"
                style={{ height: '46px', padding: '0 20px', flexShrink: 0 }}
              >
                <Icon d={ICONS.copy} size={18} />
                Copy
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => handleShare('whatsapp')} className="share">
                WhatsApp
              </button>
              <button onClick={() => handleShare('telegram')} className="share">
                Telegram
              </button>
              <button onClick={() => handleShare('x')} className="share">
                X
              </button>
              <button onClick={() => handleShare('qr')} className="share">
                QR Code
              </button>
              <button onClick={() => handleShare('more')} className="share">
                More
              </button>
            </div>
          </section>

          {/* Card 2: Andaman Achiever Trip Progress */}
          <section className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>Andaman achiever trip</span>
              <span className="num" style={{ fontSize: '14px', color: 'var(--muted)' }}>
                ₹{((user?.directBusiness || 0) / 100000).toFixed(1)}L / ₹15L
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={Math.min(100, Math.round(((user?.directBusiness || 0) / 1500000) * 100))}
              aria-label="Direct volume progress"
              style={{ height: '10px', borderRadius: '5px', background: 'var(--border)', overflow: 'hidden' }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(12, Math.round(((user?.directBusiness || 0) / 1500000) * 100)))}%`,
                  height: '100%',
                  background: 'var(--grad)',
                  borderRadius: '5px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>
              Direct volume needed to unlock the Andaman pass
            </span>
          </section>
        </div>

        {/* Right Column: My Team */}
        <section className="card" style={{ flex: '1 1 440px', minWidth: 0, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>My team</h2>

          {!isActivated ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '36px 16px',
              gap: '16px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(181, 92, 169, 0.12)',
                color: 'var(--accent-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}>
                🔒
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>Activate Your Referral Account</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  Invest in any package (starting from ₹10,000) to activate your downline team hierarchy, unlock multi-tier generation overrides (up to 5% daily ROI-on-ROI), and qualify for Achiever travel passes.
                </p>
              </div>
              <button
                onClick={() => navigateTo('invest')}
                className="btnp"
                style={{ height: '44px', padding: '0 24px', fontSize: '14px', fontWeight: 600 }}
              >
                Activate by Investing
              </button>
            </div>
          ) : (
            <>
              {/* Level Filter Chips */}
              <div role="group" aria-label="Team level" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {levelList.map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`chip ${selectedLevel === lvl ? 'on' : ''}`}
                    aria-pressed={selectedLevel === lvl}
                  >
                    Level {lvl}
                  </button>
                ))}
              </div>

              {/* Level Commission Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', color: 'var(--muted)' }}>
                <span>Level {selectedLevel} Downline</span>
                <span className="num" style={{ color: 'var(--text)', fontWeight: 600 }}>
                  {currentTier.rate} ROI-on-ROI
                </span>
              </div>

              {/* Downline Member Cards */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {members.length > 0 ? (
                  members.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '12px 0',
                        borderTop: '1px solid var(--divider)',
                        minHeight: '64px'
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'var(--icon-bg)',
                          color: 'var(--accent-text)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '14px',
                          flex: 'none'
                        }}
                      >
                        {getInitials(m.name)}
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.name}
                          </span>
                          {m.package && (
                            <span style={{ fontSize: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: '4px', color: 'var(--muted)' }}>
                              {m.package}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                          Joined {m.joined} {m.myCommission ? `· ${m.myCommission}` : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                        <span className="num" style={{ fontSize: '14px', fontWeight: 600 }}>
                          {m.active}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          Active capital
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px', borderTop: '1px solid var(--divider)' }}>
                    <p style={{ margin: 0 }}>No direct members enrolled at Level {selectedLevel} yet.</p>
                    <span style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      Share your referral link with your community to activate Level {selectedLevel} rewards!
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div
          onClick={() => setShowQrModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              textAlign: 'center'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '20px' }}>Your Referral QR</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>
              Scan to join under referral code: <strong>{user.referralCode}</strong>
            </p>

            <div style={{ padding: '16px', background: '#fff', borderRadius: '16px' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://${referralUrl}`)}`}
                alt="Referral QR Code"
                style={{ width: '180px', height: '180px', display: 'block' }}
              />
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="btnp btnw"
              style={{ width: '100%', height: '44px', fontSize: '14px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
