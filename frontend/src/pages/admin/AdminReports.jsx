import React, { useState, useEffect } from 'react';
import * as s from './adminStyles';
import {
  getReportFilterOptions,
  downloadReport,
  checkReportPdfFit,
  openReportHtmlView,
} from '../../api/admin';
import ConfirmModal from '../../components/ConfirmModal';
import SearchableSelect from '../../components/SearchableSelect';

const reportTypes = [
  { value: 'user', label: 'User Report' },
  { value: 'room', label: 'Room Report' },
];

const LandscapeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5ec8e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const WarningShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ModalCloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Standard SVG Icons (replacing emojis)
const HtmlIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const PrintIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const DocumentIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const SpreadsheetIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

const PdfIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 15v-4h2a1.5 1.5 0 0 1 0 3H9" />
  </svg>
);

const ResetIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const RoomIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const AdminReports = () => {
  // Modal state for user-facing alerts and completion dialogs
  const [alertModal, setAlertModal] = useState(null);

  const showAlert = (title, message, variant = 'info') => {
    setAlertModal({ title, message, variant });
  };

  // Active Report Tab: 'user' | 'room'
  const [reportType, setReportType] = useState('user');

  // Metadata for filter dropdowns
  const [filterOptions, setFilterOptions] = useState({
    users: [],
    topics: [],
    roles: [],
  });
  const [optionsLoading, setOptionsLoading] = useState(true);

  // User Report Form State
  const [userFilters, setUserFilters] = useState({
    role: 'all',
    user_id: 'all',
  });

  // Room Report Form State
  const [roomFilters, setRoomFilters] = useState({
    topic_id: 'all',
    creator_id: 'all',
    participant_id: 'all',
    start_date: '',
    end_date: '',
  });

  // Loading state during file download
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  // Multi-tier PDF adaptive orientation and advisory modals
  const [orientationModal, setOrientationModal] = useState(null); // { measuredWidth: number }
  const [tier3Modal, setTier3Modal] = useState(null); // { measuredWidth: number }

  // Load dropdown options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const opts = await getReportFilterOptions();
        setFilterOptions(opts);
      } catch (err) {
        showAlert('Error Loading Options', err.message || 'Failed to load filter options.', 'danger');
      } finally {
        setOptionsLoading(false);
      }
    };
    fetchOptions();
  }, []);

  // Reset current report filters
  const handleReset = () => {
    if (reportType === 'user') {
      setUserFilters({
        role: 'all',
        user_id: 'all',
      });
    } else {
      setRoomFilters({
        topic_id: 'all',
        creator_id: 'all',
        participant_id: 'all',
        start_date: '',
        end_date: '',
      });
    }
  };

  // Switch report type
  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
  };

  // Direct file download handler with mandatory validation, 404 detection, and adaptive multi-tier PDF routing
  const handleDownload = async (format, orientationOverride = null) => {
    // Validate mandatory date range on Room Report
    if (reportType === 'room') {
      if (!roomFilters.start_date || !roomFilters.end_date) {
        showAlert('Date Range Required', 'Please select both From Date and To Date to generate the room report.', 'warning');
        return;
      }
      if (roomFilters.start_date > roomFilters.end_date) {
        showAlert('Invalid Date Range', 'From Date cannot be later than To Date. Please select a valid date range.', 'warning');
        return;
      }
    }

    const activeFilters = reportType === 'user' ? userFilters : roomFilters;

    // Multi-tier adaptive layout checking for PDF downloads without explicit orientation override
    if (format === 'pdf' && !orientationOverride) {
      setDownloadingFormat('pdf');
      try {
        const fitInfo = await checkReportPdfFit({
          type: reportType,
          filters: activeFilters,
        });

        // Tier 2: Wide table (exceeds portrait, fits landscape) -> Ask user orientation preference
        if (fitInfo.tier === 'tier2') {
          setDownloadingFormat(null);
          setOrientationModal({
            measuredWidth: fitInfo.measured_width,
          });
          return;
        }

        // Tier 3: Ultra-wide table (exceeds landscape) -> Show spreadsheet recommendation modal
        if (fitInfo.tier === 'tier3') {
          setDownloadingFormat(null);
          setTier3Modal({
            measuredWidth: fitInfo.measured_width,
          });
          return;
        }

        // Tier 1: Fits comfortably within Portrait -> Direct zero-friction download
        await downloadReport({
          type: reportType,
          format: 'pdf',
          filters: activeFilters,
          orientation: 'portrait',
        });
      } catch (err) {
        const isNotFound = err.message?.toLowerCase().includes('no data') || err.status === 404;
        showAlert(
          isNotFound ? 'No Data Found' : 'Download Failed',
          err.message || (isNotFound
            ? 'No records match the selected filters. Please adjust your filter criteria and try again.'
            : 'An unexpected error occurred while generating the PDF. Please try again.'),
          isNotFound ? 'info' : 'danger'
        );
      } finally {
        setDownloadingFormat(null);
      }
      return;
    }

    // Direct download for CSV, XLS, XLSX, or PDF with explicit orientation override
    setDownloadingFormat(format);
    try {
      await downloadReport({
        type: reportType,
        format,
        filters: activeFilters,
        orientation: orientationOverride,
      });
    } catch (err) {
      const isNotFound = err.message?.toLowerCase().includes('no data') || err.status === 404;
      showAlert(
        isNotFound ? 'No Data Found' : 'Download Failed',
        err.message || (isNotFound
          ? 'No records match the selected filters. Please adjust your filter criteria and try again.'
          : 'An unexpected error occurred while downloading the report. Please try again.'),
        isNotFound ? 'info' : 'danger'
      );
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Handle standard HTML view and direct print options
  const handleHtmlAction = async (autoPrint = false) => {
    // Validate mandatory date range on Room Report
    if (reportType === 'room') {
      if (!roomFilters.start_date || !roomFilters.end_date) {
        showAlert('Date Range Required', 'Please select both From Date and To Date to generate the room report.', 'warning');
        return;
      }
      if (roomFilters.start_date > roomFilters.end_date) {
        showAlert('Invalid Date Range', 'From Date cannot be later than To Date. Please select a valid date range.', 'warning');
        return;
      }
    }

    const actionKey = autoPrint ? 'print' : 'html';
    setDownloadingFormat(actionKey);
    try {
      const activeFilters = reportType === 'user' ? userFilters : roomFilters;
      await openReportHtmlView({
        type: reportType,
        filters: activeFilters,
        autoPrint,
      });
    } catch (err) {
      const isNotFound = err.message?.toLowerCase().includes('no data') || err.status === 404;
      showAlert(
        isNotFound ? 'No Data Found' : 'Operation Failed',
        err.message || (isNotFound
          ? 'No records match the selected filters. Please adjust your filter criteria and try again.'
          : 'An unexpected error occurred while generating the report. Please try again.'),
        isNotFound ? 'info' : 'danger'
      );
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Styling
  const inputStyle = {
    ...s.searchInput,
    width: '100%',
    boxSizing: 'border-box',
  };

  const selectStyle = {
    ...s.selectInput,
    width: '100%',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: s.colors.lightGray,
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const formGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '18px',
    alignItems: 'flex-end',
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Page Header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.title}>Reports</h1>
          <p style={{ color: s.colors.gray, fontSize: '13px', margin: '4px 0 0 0' }}>
            Configure filters and export custom User and Room activity reports
          </p>
        </div>

        {/* Report Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: s.colors.lightGray }}>
            Select Report:
          </span>
          <select
            value={reportType}
            onChange={handleReportTypeChange}
            style={{
              ...s.selectInput,
              minWidth: '180px',
              background: s.colors.darkMedium,
              borderColor: s.colors.main,
              fontWeight: '600',
              color: '#fff',
            }}
          >
            {reportTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter & Export Card */}
      <div style={{ ...s.card, padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: s.colors.main, display: 'flex' }}>
              {reportType === 'user' ? <UserIcon /> : <RoomIcon />}
            </span>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: '600' }}>
              {reportType === 'user' ? 'User Report Filters' : 'Room Report Filters'}
            </h3>
          </div>
          {optionsLoading && (
            <span style={{ fontSize: '12px', color: s.colors.gray }}>Loading filter options...</span>
          )}
        </div>

        {reportType === 'user' ? (
          /* USER REPORT FILTERS */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={labelStyle}>User Role</label>
              <select
                value={userFilters.role}
                onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
                style={selectStyle}
              >
                {filterOptions.roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Specific User</label>
              <SearchableSelect
                options={filterOptions.users.map((u) => ({
                  value: String(u.id),
                  label: `${u.username}${u.email ? ` (${u.email})` : ''}`,
                }))}
                value={userFilters.user_id === 'all' ? null : userFilters.user_id}
                onChange={(val) => setUserFilters({ ...userFilters, user_id: val || 'all' })}
                placeholder="Search or select user..."
                emptyLabel="All Users"
                allowClear={true}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        ) : (
          /* ROOM REPORT FILTERS */
          <div>
            <div style={formGrid}>
              <div>
                <label style={labelStyle}>Topic</label>
                <SearchableSelect
                  options={filterOptions.topics.map((t) => ({
                    value: String(t.id),
                    label: t.name,
                  }))}
                  value={roomFilters.topic_id === 'all' ? null : roomFilters.topic_id}
                  onChange={(val) => setRoomFilters({ ...roomFilters, topic_id: val || 'all' })}
                  placeholder="Search topic..."
                  emptyLabel="All Topics"
                  allowClear={true}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Room Creator (Host)</label>
                <SearchableSelect
                  options={filterOptions.users.map((u) => ({
                    value: String(u.id),
                    label: u.username,
                  }))}
                  value={roomFilters.creator_id === 'all' ? null : roomFilters.creator_id}
                  onChange={(val) => setRoomFilters({ ...roomFilters, creator_id: val || 'all' })}
                  placeholder="Search creator..."
                  emptyLabel="All Creators"
                  allowClear={true}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Participant</label>
                <SearchableSelect
                  options={filterOptions.users.map((u) => ({
                    value: String(u.id),
                    label: u.username,
                  }))}
                  value={roomFilters.participant_id === 'all' ? null : roomFilters.participant_id}
                  onChange={(val) => setRoomFilters({ ...roomFilters, participant_id: val || 'all' })}
                  placeholder="Search participant..."
                  emptyLabel="All Participants"
                  allowClear={true}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '18px' }}>
              <div>
                <label style={labelStyle}>
                  From Date <span style={{ color: s.colors.error }}>*</span>
                </label>
                <input
                  type="date"
                  required
                  value={roomFilters.start_date}
                  onChange={(e) => setRoomFilters({ ...roomFilters, start_date: e.target.value })}
                  style={{
                    ...inputStyle,
                    borderColor: !roomFilters.start_date ? s.colors.darkLight : s.colors.main,
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  To Date <span style={{ color: s.colors.error }}>*</span>
                </label>
                <input
                  type="date"
                  required
                  value={roomFilters.end_date}
                  onChange={(e) => setRoomFilters({ ...roomFilters, end_date: e.target.value })}
                  style={{
                    ...inputStyle,
                    borderColor: !roomFilters.end_date ? s.colors.darkLight : s.colors.main,
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '8px', fontSize: '12px', color: s.colors.gray }}>
              <span style={{ color: s.colors.error }}>*</span> Date range is required for generating room reports.
            </div>
          </div>
        )}

        {/* Download Actions Section */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: `1px solid ${s.colors.darkLight}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
              Report Actions
            </div>
            <div style={{ fontSize: '12px', color: s.colors.lightGray, marginTop: '2px' }}>
              View on screen, print, or download in your preferred format.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* View HTML Button */}
            <button
              type="button"
              onClick={() => handleHtmlAction(false)}
              disabled={downloadingFormat !== null}
              style={{
                ...s.btn('default'),
                background: '#1d2a3d',
                color: '#5ec8e0',
                border: '1px solid #2d4566',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                fontWeight: 600,
                opacity: downloadingFormat ? 0.7 : 1,
              }}
              title="Open interactive report view in browser"
            >
              <HtmlIcon />
              {downloadingFormat === 'html' ? 'Generating...' : 'View HTML'}
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => handleHtmlAction(true)}
              disabled={downloadingFormat !== null}
              style={{
                ...s.btn('default'),
                background: '#282b3d',
                color: '#e2e8f0',
                border: '1px solid #424663',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                fontWeight: 600,
                opacity: downloadingFormat ? 0.7 : 1,
              }}
              title="Print report or save as PDF"
            >
              <PrintIcon />
              {downloadingFormat === 'print' ? 'Preparing...' : 'Print'}
            </button>

            {/* CSV Button */}
            <button
              onClick={() => handleDownload('csv')}
              disabled={downloadingFormat !== null}
              style={{
                ...s.btn('default'),
                background: '#242536',
                color: '#fff',
                border: `1px solid ${s.colors.darkLight}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                opacity: downloadingFormat ? 0.7 : 1,
              }}
            >
              <DocumentIcon />
              {downloadingFormat === 'csv' ? 'Downloading...' : 'Download CSV'}
            </button>

            {/* XLS Button */}
            <button
              onClick={() => handleDownload('xls')}
              disabled={downloadingFormat !== null}
              style={{
                ...s.btn('default'),
                background: '#1e4b3c',
                color: '#85e3b3',
                border: '1px solid #28634f',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                opacity: downloadingFormat ? 0.7 : 1,
              }}
            >
              <SpreadsheetIcon />
              {downloadingFormat === 'xls' ? 'Downloading...' : 'Download XLS'}
            </button>

            {/* XLSX Button */}
            <button
              onClick={() => handleDownload('xlsx')}
              disabled={downloadingFormat !== null}
              style={{
                ...s.btn('success'),
                background: '#107c41',
                color: '#ffffff',
                border: '1px solid #16934e',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                boxShadow: '0 2px 8px rgba(16, 124, 65, 0.3)',
                opacity: downloadingFormat ? 0.7 : 1,
              }}
            >
              <SpreadsheetIcon />
              {downloadingFormat === 'xlsx' ? 'Downloading...' : 'Download XLSX'}
            </button>

            {/* PDF Button */}
            <button
              onClick={() => handleDownload('pdf')}
              disabled={downloadingFormat !== null}
              style={{
                ...s.btn('default'),
                background: '#451a1a',
                color: '#fca5a5',
                border: '1px solid #7f1d1d',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                opacity: downloadingFormat ? 0.7 : 1,
              }}
              title="Download vector PDF document"
            >
              <PdfIcon />
              {downloadingFormat === 'pdf' ? 'Generating...' : 'Download PDF'}
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              disabled={downloadingFormat !== null}
              style={{
                ...s.btn('default'),
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 14px',
              }}
              title="Reset all filters"
            >
              <ResetIcon />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Alert / Notice Modal */}
      <ConfirmModal
        open={!!alertModal}
        title={alertModal?.title || 'Notice'}
        message={alertModal?.message}
        variant={alertModal?.variant || 'info'}
        confirmLabel="OK"
        showCancel={false}
        danger={alertModal?.variant === 'danger'}
        onConfirm={() => setAlertModal(null)}
        onCancel={() => setAlertModal(null)}
      />

      {/* Tier 2: Orientation Recommendation Modal */}
      {orientationModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOrientationModal(null)}
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
              maxWidth: 480,
              background: '#2d2e42',
              borderRadius: 16,
              border: '1px solid #40425a',
              boxShadow: '0 24px 48px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              padding: '24px 24px 20px',
            }}
          >
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
                    background: 'rgba(94, 200, 224, 0.12)',
                    border: '1px solid rgba(94, 200, 224, 0.28)',
                  }}
                >
                  <LandscapeIcon />
                </div>
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#f0f0f5',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    Report Orientation Recommendation
                  </h2>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOrientationModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#7a7c90',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                }}
              >
                <ModalCloseIcon />
              </button>
            </div>

            <div
              style={{
                background: '#232435',
                border: '1px solid #38394e',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 20,
                color: '#d1d2de',
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              <p style={{ margin: '0 0 8px 0' }}>
                This report requires approximately <strong>{orientationModal.measuredWidth} pt</strong> of table width, which exceeds standard A4 Portrait boundaries (547 pt).
              </p>
              <p style={{ margin: 0, color: '#94a3b8' }}>
                We recommend downloading in <strong>Landscape</strong> orientation for optimal column spacing and legibility.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => setOrientationModal(null)}
                style={{
                  ...s.btn('default'),
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '9px 14px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrientationModal(null);
                  handleDownload('pdf', 'portrait');
                }}
                style={{
                  ...s.btn('default'),
                  background: '#242536',
                  border: '1px solid #40425a',
                  color: '#e2e8f0',
                  padding: '9px 16px',
                }}
              >
                Download Portrait
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrientationModal(null);
                  handleDownload('pdf', 'landscape');
                }}
                style={{
                  ...s.btn('primary'),
                  background: '#5ec8e0',
                  color: '#1e1f2b',
                  fontWeight: 600,
                  padding: '9px 18px',
                }}
              >
                Download Landscape (Recommended)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tier 3: Spreadsheet Advisory Modal */}
      {tier3Modal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setTier3Modal(null)}
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
              maxWidth: 480,
              background: '#2d2e42',
              borderRadius: 16,
              border: '1px solid #40425a',
              boxShadow: '0 24px 48px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              padding: '24px 24px 20px',
            }}
          >
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
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.28)',
                  }}
                >
                  <WarningShieldIcon />
                </div>
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#f0f0f5',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    Spreadsheet Export Recommended
                  </h2>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setTier3Modal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#7a7c90',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                }}
              >
                <ModalCloseIcon />
              </button>
            </div>

            <div
              style={{
                background: '#232435',
                border: '1px solid #38394e',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 20,
                color: '#d1d2de',
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              <p style={{ margin: '0 0 8px 0' }}>
                This report contains extensive tabular columns measuring <strong>{tier3Modal.measuredWidth} pt</strong>, which exceeds standard printable A4 page dimensions (774 pt).
              </p>
              <p style={{ margin: 0, color: '#94a3b8' }}>
                For complete data fidelity and horizontal analysis, exporting to spreadsheet format (Excel or CSV) is strongly recommended.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => setTier3Modal(null)}
                style={{
                  ...s.btn('default'),
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '9px 14px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setTier3Modal(null);
                  handleDownload('pdf', 'landscape');
                }}
                style={{
                  ...s.btn('default'),
                  background: '#242536',
                  border: '1px solid #7f1d1d',
                  color: '#fca5a5',
                  padding: '9px 16px',
                }}
              >
                Download PDF Anyway
              </button>
              <button
                type="button"
                onClick={() => {
                  setTier3Modal(null);
                  handleDownload('xlsx');
                }}
                style={{
                  ...s.btn('success'),
                  background: '#107c41',
                  color: '#ffffff',
                  fontWeight: 600,
                  padding: '9px 18px',
                }}
              >
                Download Excel (XLSX)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
