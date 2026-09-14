import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as s from '../pages/admin/adminStyles';

/**
 * Compute fixed position for a dropdown menu relative to an anchor element.
 * Flips above the trigger if there isn't enough space below.
 */
function useMenuPosition(open, anchorRef) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, maxHeight: 280 });

  const update = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const preferBelow = spaceBelow >= 160 || spaceBelow >= spaceAbove;
    const maxHeight = Math.min(280, preferBelow ? spaceBelow : spaceAbove);
    setPos({
      top: preferBelow ? rect.bottom + 4 : rect.top - 4,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(120, maxHeight),
      placeAbove: !preferBelow,
    });
  }, [anchorRef]);

  useEffect(() => {
    if (!open) return;
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, update]);

  return pos;
}

/**
 * Searchable single-select dropdown.
 * Menu is portaled to document.body so it is never clipped by overflow:hidden parents.
 */
const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  emptyLabel = 'None',
  disabled = false,
  allowClear = true,
  style = {},
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const pos = useMenuPosition(open, containerRef);

  const selected = options.find((o) => String(o.value) === String(value));
  const isDefaultOrAll = !value || value === 'all';
  const displayLabel = selected ? selected.label : (isDefaultOrAll && emptyLabel ? emptyLabel : placeholder);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        String(o.label).toLowerCase().includes(q) ||
        String(o.value).toLowerCase().includes(q)
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const inTrigger = containerRef.current?.contains(e.target);
      const inMenu = menuRef.current?.contains(e.target);
      if (!inTrigger && !inMenu) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setQuery('');
  };

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: pos.placeAbove ? undefined : pos.top,
            bottom: pos.placeAbove ? window.innerHeight - pos.top : undefined,
            left: pos.left,
            width: pos.width,
            zIndex: 9999,
            background: s.colors.dark,
            border: `1px solid ${s.colors.darkLight}`,
            borderRadius: 10,
            boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
            maxHeight: pos.maxHeight,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: 8, borderBottom: `1px solid ${s.colors.darkLight}`, flexShrink: 0 }}>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              style={{
                width: '100%',
                background: s.colors.darkMedium,
                border: `1px solid ${s.colors.darkLight}`,
                borderRadius: 7,
                padding: '8px 10px',
                color: s.colors.light,
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {allowClear && (
              <button
                type="button"
                onClick={() => handleSelect(null)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  border: 'none',
                  background: value == null ? 'rgba(94,200,224,0.12)' : 'transparent',
                  color: s.colors.lightGray,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {emptyLabel}
              </button>
            )}
            {filtered.length === 0 ? (
              <div style={{ padding: 12, color: s.colors.gray, fontSize: 13 }}>No matches</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    border: 'none',
                    background:
                      String(opt.value) === String(value)
                        ? 'rgba(94,200,224,0.15)'
                        : 'transparent',
                    color: s.colors.light,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (String(opt.value) !== String(value))
                      e.currentTarget.style.background = s.colors.darkMedium;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      String(opt.value) === String(value)
                        ? 'rgba(94,200,224,0.15)'
                        : 'transparent';
                  }}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth: 200, ...style }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          background: s.colors.dark,
          border: `1px solid ${open ? s.colors.main : s.colors.darkLight}`,
          borderRadius: 9,
          padding: '10px 12px',
          color: (selected || (isDefaultOrAll && emptyLabel)) ? s.colors.light : s.colors.gray,
          fontSize: 14,
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayLabel}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill={s.colors.gray}>
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
      </button>
      {menu}
    </div>
  );
};

/**
 * Searchable multi-select. Menu is also portaled to document.body.
 */
export const SearchableMultiSelect = ({
  options = [],
  value = [],
  onChange,
  placeholder = 'Add users...',
  disabled = false,
  style = {},
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const pos = useMenuPosition(open, containerRef);

  const selectedSet = useMemo(() => new Set(value.map(String)), [value]);
  const selectedOpts = options.filter((o) => selectedSet.has(String(o.value)));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = options.filter((o) => !selectedSet.has(String(o.value)));
    if (q) {
      list = list.filter(
        (o) =>
          String(o.label).toLowerCase().includes(q) ||
          String(o.value).toLowerCase().includes(q)
      );
    }
    return list;
  }, [options, query, selectedSet]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const inTrigger = containerRef.current?.contains(e.target);
      const inMenu = menuRef.current?.contains(e.target);
      if (!inTrigger && !inMenu) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const add = (val) => {
    if (selectedSet.has(String(val))) return;
    onChange([...value, val]);
    setQuery('');
    // keep open for multi-add
  };

  const remove = (val) => {
    onChange(value.filter((v) => String(v) !== String(val)));
  };

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: pos.placeAbove ? undefined : pos.top,
            bottom: pos.placeAbove ? window.innerHeight - pos.top : undefined,
            left: pos.left,
            width: pos.width,
            zIndex: 9999,
            background: s.colors.dark,
            border: `1px solid ${s.colors.darkLight}`,
            borderRadius: 10,
            boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
            maxHeight: pos.maxHeight,
            overflowY: 'auto',
          }}
        >
          {!query && filtered.length > 0 && (
            <div
              style={{
                padding: '8px 12px',
                color: s.colors.gray,
                fontSize: 11,
                borderBottom: `1px solid ${s.colors.darkLight}`,
              }}
            >
              Type to search users…
            </div>
          )}
          {filtered.length === 0 ? (
            <div style={{ padding: 12, color: s.colors.gray, fontSize: 13 }}>
              {query ? 'No matches' : 'No more users'}
            </div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => add(opt.value)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: s.colors.light,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = s.colors.darkMedium;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={containerRef} style={{ position: 'relative', ...style }}>
      <div
        onClick={() => !disabled && setOpen(true)}
        style={{
          minHeight: 42,
          background: s.colors.dark,
          border: `1px solid ${open ? s.colors.main : s.colors.darkLight}`,
          borderRadius: 9,
          padding: '6px 10px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'text',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {selectedOpts.map((opt) => (
          <span
            key={opt.value}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(94,200,224,0.18)',
              color: s.colors.main,
              borderRadius: 6,
              padding: '3px 8px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {opt.label}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(opt.value);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: s.colors.main,
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1,
                  fontSize: 14,
                }}
                aria-label="Remove"
              >
                ×
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={selectedOpts.length === 0 ? placeholder : ''}
          disabled={disabled}
          style={{
            flex: 1,
            minWidth: 80,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: s.colors.light,
            fontSize: 13,
            padding: '4px 0',
          }}
        />
      </div>
      {menu}
    </div>
  );
};

export default SearchableSelect;
