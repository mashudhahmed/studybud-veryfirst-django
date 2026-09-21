import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { bulkUploadRooms, downloadRoomsTemplate } from '../../api/admin';
import * as s from './adminStyles';

const AdminBulkUploadRoomsModal = ({ open, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  if (!open) return null;

  const handleReset = () => {
    setFile(null);
    setError(null);
    setResult(null);
    setCopied(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (uploading) return;
    const currentResult = result;
    const didCreate = currentResult && currentResult.created_count > 0;
    handleReset();
    onClose();
    if (didCreate && onSuccess) {
      onSuccess({
        isClean: false,
        created_count: currentResult.created_count,
        total_rows: currentResult.total_rows,
        duplicates_count: currentResult.skipped_duplicates_count || 0,
        errors_count: currentResult.errors?.length || 0,
      });
    }
  };

  const handleFileSelect = (selectedFile) => {
    setError(null);
    setResult(null);
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.xlsx')) {
      setError('Please select a valid Excel (.xlsx) file.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    setError(null);
    try {
      await downloadRoomsTemplate();
    } catch (err) {
      setError(err.message || 'Failed to download template.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please choose an Excel (.xlsx) file first.');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const res = await bulkUploadRooms(file);
      setResult(res);

      const hasDuplicates = res.duplicates && res.duplicates.length > 0;
      const hasErrors = res.errors && res.errors.length > 0;

      // Clean success (all rows valid, 0 duplicates, 0 errors)
      // Automatically close modal and fire success toast + table refresh
      if (res.created_count > 0 && !hasDuplicates && !hasErrors) {
        handleReset();
        onClose();
        if (onSuccess) {
          onSuccess({
            isClean: true,
            created_count: res.created_count,
            total_rows: res.total_rows,
            duplicates_count: 0,
            errors_count: 0,
          });
        }
        return;
      }

      // If any duplicates or errors exist, 0 rows were created (All-or-Nothing).
      // Keep modal open with detailed report summary for admin to inspect and fix.
    } catch (err) {
      setError(err.message || 'Failed to upload and process Excel file.');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyIssues = async () => {
    if (!result) return;
    const dups = result.duplicates || [];
    const errs = result.errors || [];
    if (dups.length === 0 && errs.length === 0) return;

    const lines = [
      `StudyBud Bulk Upload Issues (${dups.length} duplicate${dups.length === 1 ? '' : 's'}, ${errs.length} error${errs.length === 1 ? '' : 's'}):`,
      '',
    ];

    if (dups.length > 0) {
      lines.push('DUPLICATE ROOMS:');
      dups.forEach((d) => {
        lines.push(`• Row #${d.row}: "${d.room_name}" — ${d.reason}`);
      });
      lines.push('');
    }

    if (errs.length > 0) {
      lines.push('VALIDATION ERRORS:');
      errs.forEach((e) => {
        lines.push(`• Row #${e.row}: "${e.room_name || 'N/A'}" — ${e.error}`);
      });
      lines.push('');
    }

    const text = lines.join('\n').trim();

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy issues:', e);
    }
  };

  const duplicatesList = result?.duplicates || [];
  const errorsList = result?.errors || [];
  const hasReport = !!result;
  const hasIssues = duplicatesList.length > 0 || errorsList.length > 0;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: s.colors.darkMedium,
          border: `1px solid ${s.colors.darkLight}`,
          borderRadius: 14,
          width: '100%',
          maxWidth: 660,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: `1px solid ${s.colors.darkLight}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: s.colors.light,
                fontSize: 18,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.colors.main} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Bulk Upload Rooms (.xlsx)
            </h2>
            <p style={{ margin: '4px 0 0 0', color: s.colors.gray, fontSize: 13 }}>
              {hasReport
                ? result?.created_count > 0
                  ? 'Spreadsheet processed successfully. All rooms have been created.'
                  : 'No rooms were imported. Review the issues below and correct your spreadsheet.'
                : 'Upload an Excel spreadsheet to create multiple study rooms in bulk.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            style={{
              background: 'transparent',
              border: 'none',
              color: s.colors.lightGray,
              cursor: uploading ? 'not-allowed' : 'pointer',
              fontSize: 20,
              lineHeight: 1,
              padding: 6,
              borderRadius: 6,
            }}
          >
            &#x2715;
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {!hasReport ? (
            <>
              {/* Template Download Card */}
              <div
                style={{
                  background: 'rgba(94, 200, 224, 0.08)',
                  border: '1px solid rgba(94, 200, 224, 0.25)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      background: 'rgba(94, 200, 224, 0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: s.colors.main,
                      flexShrink: 0,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div>
                    <div style={{ color: s.colors.light, fontWeight: 600, fontSize: 14 }}>
                      Need the Excel template?
                    </div>
                    <div style={{ color: s.colors.lightGray, fontSize: 12 }}>
                      Download the sample spreadsheet with sample rows and column structure.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  style={{
                    ...s.btn('default'),
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {downloadingTemplate ? 'Downloading...' : 'Download Template'}
                </button>
              </div>

              {/* Drag & Drop File Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{
                  border: `2px dashed ${dragActive ? s.colors.main : file ? '#2ecc71' : s.colors.darkLight}`,
                  background: dragActive
                    ? 'rgba(94, 200, 224, 0.08)'
                    : file
                    ? 'rgba(46, 204, 113, 0.06)'
                    : s.colors.dark,
                  borderRadius: 12,
                  padding: '28px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 150ms ease, background 150ms ease',
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  style={{ display: 'none' }}
                />

                {file ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: 'rgba(46, 204, 113, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2ecc71',
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div style={{ color: s.colors.light, fontWeight: 600, fontSize: 15 }}>
                      {file.name}
                    </div>
                    <div style={{ color: s.colors.gray, fontSize: 12 }}>
                      {(file.size / 1024).toFixed(1)} KB &middot; Click or drop another file to replace
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        background: 'rgba(94, 200, 224, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: s.colors.main,
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div>
                      <div style={{ color: s.colors.light, fontWeight: 600, fontSize: 14 }}>
                        Choose an Excel file or drag &amp; drop here
                      </div>
                      <div style={{ color: s.colors.gray, fontSize: 12, marginTop: 3 }}>
                        Supports Microsoft Excel (.xlsx) files with 1, 5, 50, or 100+ rooms
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Duplicate & Column Rules info */}
              <div
                style={{
                  fontSize: 12,
                  color: s.colors.lightGray,
                  lineHeight: 1.5,
                  background: s.colors.dark,
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: `1px solid ${s.colors.darkLight}`,
                }}
              >
                <div style={{ color: s.colors.light, fontWeight: 600, marginBottom: 4 }}>
                  Supported Columns &amp; Validation Rules:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li><strong>Import Policy</strong>: All rows must be valid. If any duplicates or errors are found, no rooms will be created until they are resolved.</li>
                  <li><strong>Room / Name</strong> (Required, min 3 chars): Must be unique. Existing rooms or intra-file duplicates will abort the upload.</li>
                  <li><strong>Topic</strong> (Optional): Topic is matched or auto-created on the fly.</li>
                  <li><strong>Host</strong> (Optional): Username, email, or user ID. Defaults to your admin account.</li>
                  <li><strong>Participants</strong> (Optional): Comma-separated usernames or emails.</li>
                </ul>
              </div>

              {error && (
                <div style={{ ...s.errorBox, margin: 0 }}>
                  {error}
                </div>
              )}
            </>
          ) : (
            /* Results & Report View (Industry Standard Review Screen) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Metric Cards Banner */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    background: result.created_count > 0 ? 'rgba(46, 204, 113, 0.12)' : 'rgba(231, 76, 60, 0.08)',
                    border: `1px solid ${result.created_count > 0 ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.25)'}`,
                    borderRadius: 10,
                    padding: '12px 16px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, color: result.created_count > 0 ? '#2ecc71' : '#e74c3c' }}>
                    {result.created_count}
                  </div>
                  <div style={{ fontSize: 12, color: s.colors.lightGray, fontWeight: 600, marginTop: 2 }}>
                    {result.created_count > 0 ? 'Created' : 'Imported'}
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(241, 196, 15, 0.12)',
                    border: '1px solid rgba(241, 196, 15, 0.3)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#f1c40f' }}>
                    {result.skipped_duplicates_count || 0}
                  </div>
                  <div style={{ fontSize: 12, color: s.colors.lightGray, fontWeight: 600, marginTop: 2 }}>
                    Duplicates Detected
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(231, 76, 60, 0.12)',
                    border: '1px solid rgba(231, 76, 60, 0.3)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#e74c3c' }}>
                    {errorsList.length}
                  </div>
                  <div style={{ fontSize: 12, color: s.colors.lightGray, fontWeight: 600, marginTop: 2 }}>
                    Errors
                  </div>
                </div>

                <div
                  style={{
                    background: s.colors.dark,
                    border: `1px solid ${s.colors.darkLight}`,
                    borderRadius: 10,
                    padding: '12px 16px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.colors.light }}>
                    {result.total_rows}
                  </div>
                  <div style={{ fontSize: 12, color: s.colors.gray, fontWeight: 600, marginTop: 2 }}>
                    Total Processed
                  </div>
                </div>
              </div>

              {/* Informational Guidance Banner with Copy Button */}
              <div
                style={{
                  fontSize: 12,
                  background: result.created_count > 0 ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                  border: `1px solid ${result.created_count > 0 ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)'}`,
                  padding: '12px 16px',
                  borderRadius: 8,
                  lineHeight: 1.5,
                  color: result.created_count > 0 ? '#2ecc71' : '#ff7979',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  {result.created_count > 0 ? (
                    `\u2713 All ${result.created_count} rooms have been cleanly saved to the database. Click "Done" to see your updated rooms list.`
                  ) : (
                    <>
                      <strong>No rooms were imported.</strong> Your spreadsheet contains issues that need to be resolved. Please correct the highlighted rows below and upload the file again.
                    </>
                  )}
                </div>
                {result.created_count === 0 && hasIssues && (
                  <button
                    type="button"
                    onClick={handleCopyIssues}
                    style={{
                      background: copied ? 'rgba(46, 204, 113, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                      border: `1px solid ${copied ? '#2ecc71' : 'rgba(255, 255, 255, 0.2)'}`,
                      color: copied ? '#2ecc71' : '#fff',
                      borderRadius: 6,
                      padding: '5px 10px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 150ms ease',
                    }}
                    title="Copy all duplicates and validation errors to clipboard"
                  >
                    {copied ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy Issues
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Duplicates Section */}
              {duplicatesList.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ color: '#f1c40f', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>&#x26a0;&#xfe0f;</span> {duplicatesList.length} Duplicate{duplicatesList.length > 1 ? 's' : ''} Found (Import Blocked):
                  </div>
                  <div
                    style={{
                      maxHeight: 140,
                      overflowY: 'auto',
                      border: '1px solid rgba(241, 196, 15, 0.3)',
                      borderRadius: 8,
                      background: s.colors.dark,
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: 'rgba(241, 196, 15, 0.15)', textAlign: 'left' }}>
                          <th style={{ padding: '6px 10px', color: '#fff', width: 60 }}>Row</th>
                          <th style={{ padding: '6px 10px', color: '#fff', width: 160 }}>Room Name</th>
                          <th style={{ padding: '6px 10px', color: '#fff' }}>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {duplicatesList.map((dup, idx) => (
                          <tr key={idx} style={{ borderTop: `1px solid ${s.colors.darkLight}` }}>
                            <td style={{ padding: '6px 10px', color: s.colors.lightGray }}>#{dup.row}</td>
                            <td style={{ padding: '6px 10px', color: s.colors.light, fontWeight: 500 }}>
                              {dup.room_name}
                            </td>
                            <td style={{ padding: '6px 10px', color: '#f1c40f' }}>{dup.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Errors Section */}
              {errorsList.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ color: '#e74c3c', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>&#x2715;</span> {errorsList.length} Row{errorsList.length > 1 ? 's' : ''} Failed Validation (Import Blocked):
                  </div>
                  <div
                    style={{
                      maxHeight: 140,
                      overflowY: 'auto',
                      border: '1px solid rgba(231, 76, 60, 0.3)',
                      borderRadius: 8,
                      background: s.colors.dark,
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: 'rgba(231, 76, 60, 0.15)', textAlign: 'left' }}>
                          <th style={{ padding: '6px 10px', color: '#fff', width: 60 }}>Row</th>
                          <th style={{ padding: '6px 10px', color: '#fff', width: 160 }}>Room Name</th>
                          <th style={{ padding: '6px 10px', color: '#fff' }}>Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {errorsList.map((err, idx) => (
                          <tr key={idx} style={{ borderTop: `1px solid ${s.colors.darkLight}` }}>
                            <td style={{ padding: '6px 10px', color: s.colors.lightGray }}>#{err.row}</td>
                            <td style={{ padding: '6px 10px', color: s.colors.light, fontWeight: 500 }}>
                              {err.room_name}
                            </td>
                            <td style={{ padding: '6px 10px', color: '#e74c3c' }}>{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${s.colors.darkLight}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            background: s.colors.dark,
          }}
        >
          {hasReport ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {result.created_count === 0 && hasIssues && (
                <button
                  type="button"
                  onClick={handleCopyIssues}
                  style={{
                    ...s.btn('default'),
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    borderColor: copied ? '#2ecc71' : undefined,
                    color: copied ? '#2ecc71' : undefined,
                    transition: 'all 150ms ease',
                  }}
                  title="Copy issues to clipboard"
                >
                  {copied ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy Issues
                    </>
                  )}
                </button>
              )}
              {result.created_count === 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    ...s.btn('default'),
                    padding: '8px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  Upload Corrected File
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                style={{
                  ...s.btn(result.created_count > 0 ? 'primary' : 'default'),
                  padding: '8px 24px',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {result.created_count > 0 ? 'Done' : 'Close'}
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                disabled={uploading}
                style={s.btn('default')}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading}
                style={{
                  ...s.btn('primary'),
                  padding: '8px 20px',
                  fontSize: 13,
                  fontWeight: 600,
                  opacity: !file || uploading ? 0.6 : 1,
                  cursor: !file || uploading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {uploading ? (
                  <>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 12,
                        height: 12,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    Processing Spreadsheet...
                  </>
                ) : (
                  'Upload & Import Rooms'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AdminBulkUploadRoomsModal;
