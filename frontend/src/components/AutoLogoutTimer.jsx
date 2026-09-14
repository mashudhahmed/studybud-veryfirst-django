import React, { useState, useEffect } from 'react';

const AutoLogoutTimer = ({ onLogout, timeoutSeconds, children, size = 44 }) => {
  const STORAGE_KEY = 'studybud_session_expire_at';
  const parsedSeconds = Number(timeoutSeconds);
  const totalSeconds = Number.isFinite(parsedSeconds) && parsedSeconds > 0 ? parsedSeconds : 300;

  const [timeLeft, setTimeLeft] = useState(() => {
    try {
      const savedExpireAt = localStorage.getItem(STORAGE_KEY);
      const now = Date.now();
      if (savedExpireAt) {
        const parsed = parseInt(savedExpireAt, 10);
        if (Number.isFinite(parsed)) {
          const remaining = Math.round((parsed - now) / 1000);
          if (remaining > 0) return remaining;
        }
      }
      const newExpireAt = now + totalSeconds * 1000;
      localStorage.setItem(STORAGE_KEY, newExpireAt.toString());
      return totalSeconds;
    } catch {
      return totalSeconds;
    }
  });

  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    try {
      const savedExpireAt = localStorage.getItem(STORAGE_KEY);
      if (!savedExpireAt) {
        localStorage.setItem(STORAGE_KEY, (Date.now() + totalSeconds * 1000).toString());
        setTimeLeft(totalSeconds);
      }
    } catch (e) {
      console.warn('Storage unavailable:', e);
    }
  }, [totalSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const savedExpireAt = localStorage.getItem(STORAGE_KEY);
        if (!savedExpireAt) {
          clearInterval(interval);
          return;
        }
        const parsed = parseInt(savedExpireAt, 10);
        const remaining = Number.isFinite(parsed)
          ? Math.max(0, Math.round((parsed - Date.now()) / 1000))
          : 0;

        setTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          localStorage.removeItem(STORAGE_KEY);
          if (typeof onLogout === 'function') onLogout();
        }
      } catch (err) {
        console.error('Timer error:', err);
      }
    }, 1000);

    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        if (!e.newValue) {
          if (typeof onLogout === 'function') onLogout();
        } else {
          const parsed = parseInt(e.newValue, 10);
          setTimeLeft(
            Number.isFinite(parsed)
              ? Math.max(0, Math.round((parsed - Date.now()) / 1000))
              : totalSeconds
          );
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [onLogout, totalSeconds]);

  // Geometry: avatar takes up the full inner area, stroke wraps exactly around it
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeTime = Number.isFinite(timeLeft) ? timeLeft : totalSeconds;
  const progressRatio = totalSeconds > 0 ? Math.max(0, Math.min(1, safeTime / totalSeconds)) : 1;
  const rawOffset = circumference - progressRatio * circumference;
  const strokeDashoffset = Number.isFinite(rawOffset) ? rawOffset : 0;

  const isLow = safeTime <= Math.min(15, Math.floor(totalSeconds * 0.2));
  const activeColor = isLow ? '#ef4444' : '#5ec8e0';
  const glowColor = isLow ? 'rgba(239, 68, 68, 0.45)' : 'rgba(94, 200, 224, 0.35)';

  const mins = Math.floor(safeTime / 60);
  const secs = String(safeTime % 60).padStart(2, '0');
  const formattedTime = mins > 0 ? `${mins}:${secs}` : `${safeTime}s`;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {/* Dynamic Single Countdown Ring */}
      <svg
        width={size}
        height={size}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: 'rotate(-90deg)',
          pointerEvents: 'none',
          filter: `drop-shadow(0 0 3px ${glowColor})`,
          zIndex: 2,
        }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease',
          }}
        />
      </svg>

      {/* DP Container - completely fills the ring with zero extra margin or inner border */}
      <div
        style={{
          width: `${size - strokeWidth * 2}px`,
          height: `${size - strokeWidth * 2}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        {children}
      </div>

      {/* Floating Hover Tooltip */}
      <div
        style={{
          position: 'absolute',
          top: '115%',
          left: '50%',
          transform: `translateX(-50%) scale(${isHovered ? 1 : 0.8})`,
          opacity: isHovered ? 1 : 0,
          pointerEvents: 'none',
          transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'rgba(15, 23, 42, 0.95)',
          border: `1px solid ${isLow ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'}`,
          backdropFilter: 'blur(8px)',
          color: isLow ? '#f87171' : '#e2e8f0',
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          zIndex: 250,
        }}
      >
        Session: {formattedTime}
      </div>
    </div>
  );
};

export default AutoLogoutTimer;