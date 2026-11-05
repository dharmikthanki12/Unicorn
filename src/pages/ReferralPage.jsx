import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';
import { investAPI, referralAPI } from '../services/api';

export function ReferralPage() {
  const { user, setUser, team, referralTiers, rankBonuses, achieverBonuses, showToast, navigateTo, currency, currencySymbol, formatCurrency, transactions } = useApp();
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [showQrModal, setShowQrModal] = useState(false);

  const referralCode = user?.referralCode || 'UNC-88294';
  const referralUrl = `unicorn.vip/?ref=${referralCode}`;

  // Direct business progress calculation for Andaman Achiever Trip
  const directBizAmount = Number(user?.directBusiness || 0);
  const andamanTarget = 1500000;
  const andamanPct = Math.min(100, Math.round((directBizAmount / andamanTarget) * 100));
  const andamanProgressLabel = currency === 'USD'
    ? `$${((directBizAmount / 100) / 1000).toFixed(1)}k / $15k`
    : `₹${(directBizAmount / 100000).toFixed(1)}L / ₹15L`;

  // Check if activated through activeInvestedAmount, isReferralActivated flag, activePackage, or completed investment transaction
  const hasInvestmentTx = (transactions || []).some(t => {
    const isInv = t.type === 'invest' || t.type === 'INVEST' || t.method === 'Package Activation' || (t.title && t.title.toLowerCase().includes('activated'));
    const isCompleted = (t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'confirmed' || (t.status || '').toLowerCase() === 'active';
    return isInv && isCompleted;
  });

  const isActivated = Boolean(
    user && (
      Number(user.activeInvestedAmount || 0) > 0 ||
      user.isReferralActivated ||
      Boolean(user.activePackage) ||
      hasInvestmentTx
    )
  );

  // Sync active investments if not currently marked activated
  useEffect(() => {
    if (!isActivated && user) {
      investAPI.getUserInvestments()
        .then(res => {
          if (res?.investments?.length > 0) {
            const activeInvs = res.investments.filter(i => {
              const st = (i.status || '').toLowerCase();
              return st === 'confirmed' || st === 'active';
            });
            if (activeInvs.length > 0) {
              const total = activeInvs.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
              setUser(prev => prev ? {
                ...prev,
                activeInvestedAmount: Math.max(Number(prev.activeInvestedAmount || 0), total),
                isReferralActivated: true,
                activePackage: activeInvs[0] || prev.activePackage
              } : prev);
            }
          }
        })
        .catch(() => {});
    }
  }, [isActivated, user]);

  const handleActivateReferralsClick = async () => {
    try {
      await referralAPI.activate().catch(() => null);
    } catch (e) {}
    setUser(prev => prev ? { ...prev, isReferralActivated: true } : prev);
    showToast('Referral account successfully activated!');
  };

  const formatMoney = (val) => {
    if (typeof val === 'number') return formatCurrency(val);
    if (!val) return '';
    if (typeof val === 'string' && val.includes('₹')) {
      const num = Number(val.replace(/[₹,]/g, '').split('/')[0]);
      if (!isNaN(num)) {
        const converted = formatCurrency(num);
        return val.includes('/day') ? `${converted}/day` : converted;
      }
    }
    return val;
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(referralUrl);
    showToast('Referral link copied to clipboard!');
  };

  const handleShare = (platform) => {
    const text = `Join Unicorn Fintech Platform with my referral code ${referralCode}: https://${referralUrl}`;
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
        navigator.share({ title: 'Unicorn Fintech Platform', text, url: `https://${referralUrl}` });
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

      <div className="website-grid-2col" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
        {/* Left Column */}
        <div className="website-col-left" style={{ flex: '1 1 440px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

          {/* Card 2: Andaman Achiever Trip Progress (shown when activated) or Activate Referrals button (when not activated) */}
          {isActivated ? (
            <section className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>Andaman achiever trip</span>
                <span className="num" style={{ fontSize: '14px', color: 'var(--muted)' }}>
                  {andamanProgressLabel}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={andamanPct}
                aria-label="Direct volume progress"
                style={{ height: '10px', borderRadius: '5px', background: 'var(--border)', overflow: 'hidden' }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.max(12, andamanPct))}%`,
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
          ) : (
            <button
              type="button"
              onClick={handleActivateReferralsClick}
              style={{
                width: '100%',
                height: '52px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #B55CA9 0%, #8A70D6 50%, #4C8CF5 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 6px 20px rgba(181, 92, 169, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon d={ICONS.invest} size={20} />
              <span>Activate Referrals</span>
            </button>
          )}
        </div>

        {/* Right Column: My Team */}
        <section className="card website-col-right" style={{ flex: '1 1 440px', minWidth: 0, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  Invest in any package (starting from {formatCurrency(10000)}) to activate your downline team hierarchy, unlock multi-tier generation overrides (up to 5% daily ROI-on-ROI), and qualify for Achiever travel passes.
                </p>
              </div>
              <button
                onClick={handleActivateReferralsClick}
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
                          Joined {m.joined} {m.myCommission ? `· ${formatMoney(m.myCommission)}` : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                        <span className="num" style={{ fontSize: '14px', fontWeight: 600 }}>
                          {formatMoney(m.active)}
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
