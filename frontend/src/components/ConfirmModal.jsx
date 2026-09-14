import React, { useEffect } from 'react';

/**
 * App-wide confirm dialog (replaces window.confirm).
 *
 * Props:
 *  open, title, message, confirmLabel, cancelLabel, danger, loading
 *  onConfirm, onCancel
 */
const ConfirmModal = ({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onCancel?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={() => !loading && onCancel?.()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#34354a',
          borderRadius: 16,
          border: '1px solid #40425a',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          padding: '24px 24px 20px',
        }}
      >
        <h2
          id="confirm-modal-title"
          style={{
            margin: '0 0 10px',
            fontSize: 18,
            fontWeight: 700,
            color: '#f0f0f5',
          }}
        >
          {title}
        </h2>
        {message && (
          <p
            style={{
              margin: '0 0 24px',
              fontSize: 14,
              lineHeight: 1.55,
              color: '#a8aabc',
            }}
          >
            {message}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            style={{
              background: '#2a2b3d',
              color: '#a8aabc',
              border: '1px solid #40425a',
              borderRadius: 9,
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            style={{
              background: danger ? '#ff5c3a' : '#5ec8e0',
              color: danger ? '#fff' : '#1e1f2b',
              border: 'none',
              borderRadius: 9,
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
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
