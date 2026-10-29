import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon, ICONS } from '../components/Icons';

export function DepositPage() {
  const { submitInrDeposit, submitUsdtDeposit, showToast } = useApp();

  const [step, setStep] = useState('amount'); // 'amount' | 'method' | 'inr' | 'usdt'
  const [currency, setCurrency] = useState('INR'); // 'INR' | 'USD'
  const [amountInput, setAmountInput] = useState('100000');
  const [utrNumber, setUtrNumber] = useState('');
  const [txHash, setTxHash] = useState('');

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const upiId = 'unicornpay@hdfcbank';
  const bep20Address = '0x9B15e98f06a2340E7D2361B86F2aA9b3B08C91a7';

  const numAmount = Number(amountInput) || 0;
  const displayAmount = currency === 'INR'
    ? `₹${numAmount.toLocaleString('en-IN')}`
    : `$${numAmount.toLocaleString('en-US')}`;

  const usdtEquivalent = currency === 'INR' ? Math.round(numAmount / 100) : numAmount;

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(upiId);
    setCopiedUpi(true);
    showToast('UPI ID copied to clipboard!');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyAddress = () => {
    navigator.clipboard?.writeText(bep20Address);
    setCopiedAddress(true);
    showToast('BEP-20 address copied!');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleInrSubmit = (e) => {
    e.preventDefault();
    if (!utrNumber || utrNumber.trim().length < 8) {
      showToast('Please enter a valid 12-digit UTR reference', 'error');
      return;
    }
    const finalInr = currency === 'INR' ? numAmount : numAmount * 100;
    submitInrDeposit(utrNumber.trim(), finalInr || 100000);
    setUtrNumber('');
    setStep('amount');
  };

  const handleUsdtSubmit = (e) => {
    e.preventDefault();
    if (!txHash || txHash.trim().length < 8) {
      showToast('Please enter your BEP-20 TxID Hash', 'error');
      return;
    }
    const finalInr = (currency === 'USD' ? numAmount : Math.round(numAmount / 100)) * 100;
    submitUsdtDeposit(txHash.trim(), finalInr || 100000);
    setTxHash('');
    setStep('amount');
  };

  return (
    <div style={{ width: '100%', maxWidth: '520px', margin: '20px auto 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Back Button matching Unicorn_Mobile_App.html Screen 14 */}
      {step !== 'amount' && (
        <button
          onClick={() => {
            if (step === 'inr' || step === 'usdt') setStep('method');
            else setStep('amount');
          }}
          style={{
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: '44px',
            padding: '0 12px 0 4px',
            background: 'transparent',
            border: 0,
            fontSize: '15px',
            fontWeight: 500,
            color: 'var(--text2)',
            cursor: 'pointer'
          }}
        >
          <Icon d={ICONS.back} size={20} />
          <span>Back</span>
        </button>
      )}

      {/* Main Card */}
      <section className="card" style={{ padding: 'clamp(20px, 4vw, 32px)', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* STEP 1: Enter Amount */}
        {step === 'amount' && (
          <>
            <h1 className="num" style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Deposit</h1>

            {/* Currency Selector (.seg matching file) */}
            <div role="group" aria-label="Currency" style={{ display: 'flex', gap: '4px', padding: '4px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '14px' }}>
              <button
                onClick={() => setCurrency('INR')}
                className={`seg ${currency === 'INR' ? 'on' : ''}`}
                style={{ flex: 1, padding: '10px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 600 }}
              >
                INR (₹)
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`seg ${currency === 'USD' ? 'on' : ''}`}
                style={{ flex: 1, padding: '10px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 600 }}
              >
                USD / USDT ($)
              </button>
            </div>

            {/* Amount input matching file */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
              <label htmlFor="amt" style={{ fontSize: '14px', color: 'var(--muted)' }}>Enter amount</label>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px', maxWidth: '100%' }}>
                <span className="num" style={{ fontSize: 'clamp(38px, 8vw, 56px)', fontWeight: 600, color: 'var(--muted)' }}>
                  {currency === 'INR' ? '₹' : '$'}
                </span>
                <input
                  id="amt"
                  type="text"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0"
                  style={{
                    width: 'clamp(140px, 45vw, 240px)',
                    background: 'transparent',
                    border: 0,
                    borderBottom: '2px solid var(--border2)',
                    color: 'var(--text)',
                    fontSize: 'clamp(38px, 8vw, 56px)',
                    fontWeight: 600,
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    padding: '0 0 6px',
                    borderRadius: 0,
                    outline: 'none',
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!amountInput || Number(amountInput) <= 0) {
                  showToast('Please enter a valid deposit amount', 'error');
                  return;
                }
                setStep('method');
              }}
              className="btnp btnw"
              style={{ width: '100%', height: '52px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}
            >
              <span className="gt">Continue</span>
            </button>
          </>
        )}

        {/* STEP 2: Choose Method (.opt buttons matching file) */}
        {step === 'method' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--muted)' }}>You are depositing</span>
              <span className="num" style={{ fontSize: '44px', fontWeight: 600 }}>{displayAmount}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Option INR */}
              <button
                onClick={() => setStep('inr')}
                className="opt"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
              >
                <div
                  className="num"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--icon-bg)',
                    color: 'var(--accent-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '20px',
                    flex: 'none'
                  }}
                >
                  ₹
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 600 }}>Deposit with INR</span>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>UPI · confirmed with your UTR</span>
                </div>
                <Icon d={ICONS.chevronRight} size={20} style={{ color: 'var(--muted)' }} />
              </button>

              {/* Option USDT */}
              <button
                onClick={() => setStep('usdt')}
                className="opt"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease'
                }}
              >
                <div
                  className="num"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--icon-bg)',
                    color: 'var(--accent-text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '20px',
                    flex: 'none'
                  }}
                >
                  ₮
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 600 }}>Deposit with USDT</span>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>BEP-20 · credited automatically</span>
                </div>
                <Icon d={ICONS.chevronRight} size={20} style={{ color: 'var(--muted)' }} />
              </button>
            </div>
          </>
        )}

        {/* STEP 3A: Deposit with INR (matching screen 4/14) */}
        {step === 'inr' && (
          <form onSubmit={handleInrSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h1 className="num" style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Deposit with INR</h1>

            {/* UPI Badge Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px',
              borderRadius: '16px',
              background: 'linear-gradient(var(--surface2),var(--surface2)) padding-box, var(--grad) border-box',
              border: '2px solid transparent'
            }}>
              <div
                className="num"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--icon-bg)',
                  color: 'var(--accent-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '13px',
                  flex: 'none'
                }}
              >
                UPI
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>UPI</span>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Pay from any UPI app, then submit the UTR</span>
              </div>
            </div>

            {/* QR Code & Amount */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{
                width: '168px',
                height: '168px',
                borderRadius: '14px',
                background: '#FFFFFF',
                color: '#3A3F55',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
                overflow: 'hidden',
                padding: '8px'
              }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=152x152&data=upi://pay?pa=${upiId}%26pn=UnicornWeb3%26am=${currency === 'INR' ? numAmount : numAmount * 100}%26cu=INR`}
                  alt="UPI QR Code"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>

              <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Amount to pay</span>
                  <span className="num" style={{ fontSize: '28px', fontWeight: 600 }}>
                    {currency === 'INR' ? displayAmount : `₹${(numAmount * 100).toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>UPI ID</span>
                    <span className="num" style={{ fontSize: '15px', fontWeight: 600 }}>{upiId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="copy"
                    style={{ fontSize: '13px', padding: '8px 14px' }}
                  >
                    <Icon d={copiedUpi ? ICONS.check : ICONS.copy} size={16} />
                    <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* UTR Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="utr" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--muted)' }}>
                UTR / reference number
              </label>
              <input
                id="utr"
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="Enter the 12-digit UTR from your UPI app"
                required
                style={{
                  height: '52px',
                  borderRadius: '14px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border2)',
                  color: 'var(--text)',
                  fontSize: '16px',
                  padding: '0 16px',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              className="btnp btnw"
              style={{ width: '100%', height: '52px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}
            >
              <span className="gt">I have paid — submit UTR</span>
            </button>
          </form>
        )}

        {/* STEP 3B: Deposit with USDT BEP-20 (matching screen 5/14) */}
        {step === 'usdt' && (
          <form onSubmit={handleUsdtSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h1 className="num" style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Deposit with USDT</h1>

            {/* USDT Badge Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px',
              borderRadius: '16px',
              background: 'linear-gradient(var(--surface2),var(--surface2)) padding-box, var(--grad) border-box',
              border: '2px solid transparent'
            }}>
              <div
                className="num"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'var(--icon-bg)',
                  color: 'var(--accent-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '20px',
                  flex: 'none'
                }}
              >
                ₮
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600 }}>USDT</span>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Network: BEP-20 (BNB Smart Chain)</span>
              </div>
            </div>

            {/* QR Code & Amount */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{
                width: '168px',
                height: '168px',
                borderRadius: '14px',
                background: '#FFFFFF',
                color: '#3A3F55',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
                overflow: 'hidden',
                padding: '8px'
              }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=152x152&data=${bep20Address}`}
                  alt="BEP-20 QR Code"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>

              <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Send exactly</span>
                  <span className="num" style={{ fontSize: '28px', fontWeight: 600 }}>
                    {usdtEquivalent} USDT
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Deposit address (BEP-20)</span>
                    <span className="num" style={{ fontSize: '13px', fontWeight: 600 }}>
                      {bep20Address.slice(0, 8)}...{bep20Address.slice(-6)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="copy"
                    style={{ fontSize: '13px', padding: '8px 14px' }}
                  >
                    <Icon d={copiedAddress ? ICONS.check : ICONS.copy} size={16} />
                    <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <p style={{ margin: 0, padding: '14px 16px', borderRadius: '14px', background: 'var(--surface3)', fontSize: '13px', lineHeight: 1.5, color: 'var(--text2)' }}>
              Send only USDT on the BEP-20 network. Funds are credited automatically once the transfer is confirmed.
            </p>

            {/* TxID Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="txid" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--muted)' }}>
                Transaction Hash (TxID)
              </label>
              <input
                id="txid"
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x... paste your BSC transaction hash"
                required
                style={{
                  height: '52px',
                  borderRadius: '14px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border2)',
                  color: 'var(--text)',
                  fontSize: '15px',
                  padding: '0 16px',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              className="btnp btnw"
              style={{ width: '100%', height: '52px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}
            >
              <span className="gt">I have sent the USDT</span>
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
