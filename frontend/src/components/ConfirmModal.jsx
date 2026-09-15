import React, { useEffect } from 'react';

/**
 * Standard Vector SVG Icons for Modal Variants
 */
const WarningIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const DangerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff5c3a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const InfoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5ec8e0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const SuccessIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const variantStyles = {
  warning: {
    icon: <WarningIcon />,
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeBorder: '1px solid rgba(245, 158, 11, 0.28)',
    buttonBg: '#f59e0b',
    buttonColor: '#1e1f2b',
  },
  danger: {
    icon: <DangerIcon />,
    badgeBg: 'rgba(255, 92, 58, 0.12)',
    badgeBorder: '1px solid rgba(255, 92, 58, 0.28)',
    buttonBg: '#ff5c3a',
    buttonColor: '#ffffff',
  },
  info: {
    icon: <InfoIcon />,
    badgeBg: 'rgba(94, 200, 224, 0.12)',
    badgeBorder: '1px solid rgba(94, 200, 224, 0.28)',
    buttonBg: '#5ec8e0',
    buttonColor: '#1e1f2b',
  },
  success: {
    icon: <SuccessIcon />,
    badgeBg: 'rgba(74, 222, 128, 0.12)',
    badgeBorder: '1px solid rgba(74, 222, 128, 0.28)',
    buttonBg: '#4ade80',
    buttonColor: '#1e1f2b',
  },
};

/**
 * App-wide confirm & alert dialog (replaces window.confirm / window.alert).
 *
 * Props:
 *  open, title, message, confirmLabel, cancelLabel, showCancel,
 *  variant ('warning' | 'danger' | 'info' | 'success'),
 *  danger, loading, onConfirm, onCancel
 */
const ConfirmModal = ({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  showCancel = true,
  variant,
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) {
        if (showCancel) {
          onCancel?.();
        } else {
          (onConfirm || onCancel)?.();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, loading, onCancel, onConfirm, showCancel]);

  if (!open) return null;

  const handleDismiss = () => {
    if (!loading) {
      if (showCancel) {
        onCancel?.();
      } else {
        (onConfirm || onCancel)?.();
      }
    }
  };

  // Determine effective variant (fallback to danger if danger=true, otherwise info)
  const effectiveVariant = variant || (danger ? 'danger' : 'info');
  const vStyle = variantStyles[effectiveVariant] || variantStyles.info;

  // Confirm button color: if danger prop is set or variant is danger, use crimson; otherwise variant buttonBg
  const primaryBg = danger ? variantStyles.danger.buttonBg : vStyle.buttonBg;
  const primaryColor = danger ? variantStyles.danger.buttonColor : vStyle.buttonColor;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(5px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#2d2e42',
          borderRadius: 16,
          border: '1px solid #40425a',
          boxShadow: '0 24px 48px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          padding: '24px 24px 20px',
        }}
      >
        {/* Header with Variant Icon Badge & Close Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 14,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: vStyle.badgeBg,
                border: vStyle.badgeBorder,
              }}
            >
              {vStyle.icon}
            </div>
            <div>
              <h2
                id="confirm-modal-title"
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#f0f0f5',
                  letterSpacing: '-0.2px',
                  lineHeight: 1.3,
                }}
              >
                {title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={loading}
            onClick={handleDismiss}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#7a7c90',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              marginTop: -2,
              marginRight: -4,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f0f0f5';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#7a7c90';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Structured Message Body Container (replaces bare plain text) */}
        {message && (
          <div
            style={{
              background: '#232435',
              border: '1px solid #38394e',
              borderRadius: 10,
              padding: '13px 15px',
              marginBottom: 20,
              color: '#d1d2de',
              fontSize: 14,
              lineHeight: 1.55,
              wordBreak: 'break-word',
            }}
          >
            {message}
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {showCancel && cancelLabel && (
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              style={{
                background: '#222334',
                color: '#a8aabc',
                border: '1px solid #40425a',
                borderRadius: 9,
                padding: '10px 18px',
                fontWeight: 600,
                fontSize: 14,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#5a5c78';
                e.currentTarget.style.color = '#f0f0f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#40425a';
                e.currentTarget.style.color = '#a8aabc';
              }}
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            style={{
              background: primaryBg,
              color: primaryColor,
              border: 'none',
              borderRadius: 9,
              padding: '10px 20px',
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              boxShadow: danger ? '0 2px 8px rgba(255, 92, 58, 0.35)' : 'none',
              transition: 'transform 0.1s ease, filter 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
