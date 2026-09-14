import React, { useState, useEffect, useCallback } from 'react';
import * as s from './adminStyles';
import {
  getReportFilterOptions,
  getUserReport,
  getRoomReport,
  downloadReport,
} from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import SearchableSelect from '../../components/SearchableSelect';

const reportTypes = [
  { value: 'user', label: 'User Report' },
  { value: 'room', label: 'Room Report' },
];

const AdminReports = () => {
  const { showToast } = useToast();

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
    search: '',
  });

  // Room Report Form State
  const [roomFilters, setRoomFilters] = useState({
    topic_id: 'all',
    creator_id: 'all',
    participant_id: 'all',
    start_date: '',
    end_date: '',
    search: '',
  });

  // Preview Data State
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [hasViewed, setHasViewed] = useState(false);

  // Load dropdown options once on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const opts = await getReportFilterOptions();
        setFilterOptions(opts);
      } catch (err) {
        showToast(err.message || 'Failed to load filter options', 'error');
      } finally {
        setOptionsLoading(false);
      }
    };
    fetchOptions();
  }, [showToast]);

  // Handle Fetch / "View" button click
  const handleViewReport = useCallback(async () => {
    setLoading(true);
    setReportData(null);
    setHasViewed(true);

    try {
      if (reportType === 'user') {
        const data = await getUserReport(userFilters);
        setReportData(data);
      } else {
        const data = await getRoomReport(roomFilters);
        setReportData(data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  }, [reportType, userFilters, roomFilters, showToast]);

  // Reset current report filters
  const handleReset = () => {
    if (reportType === 'user') {
      setUserFilters({
        role: 'all',
        user_id: 'all',
        search: '',
      });
    } else {
      setRoomFilters({
        topic_id: 'all',
        creator_id: 'all',
        participant_id: 'all',
        start_date: '',
        end_date: '',
        search: '',
      });
    }
    setReportData(null);
    setHasViewed(false);
  };

  // Switch report type
  const handleReportTypeChange = (e) => {
    const newType = e.target.value;
    setReportType(newType);
    setReportData(null);
    setHasViewed(false);
  };

  // Handle direct file download
  const handleDownload = async (format) => {
    setDownloadingFormat(format);
    try {
      const activeFilters = reportType === 'user' ? userFilters : roomFilters;
      await downloadReport({
        type: reportType,
        format,
        filters: activeFilters,
      });
      const typeLabel = reportType === 'user' ? 'User' : 'Room';
      showToast(typeLabel + ' report downloaded as .' + format, 'success');
    } catch (err) {
      showToast(err.message || ('Failed to download .' + format + ' report'), 'error');
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Shared form input styles
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    alignItems: 'flex-end',
  };

  const statCardStyle = {
    background: s.colors.dark,
    border: `1px solid ${s.colors.darkLight}`,
    borderRadius: '10px',
    padding: '14px 18px',
    flex: '1 1 180px',
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Page Header */}
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.title}>Reports</h1>
          <p style={{ color: s.colors.gray, fontSize: '13px', margin: '4px 0 0 0' }}>
            Filter, inspect on-screen, and export custom User and Room activity reports
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

      {/* Filter Form Card */}
      <div style={{ ...s.card, padding: '22px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: '600' }}>
            {reportType === 'user' ? '👤 User Report Filters' : '💬 Room Report Filters'}
          </h3>
          {optionsLoading && (
            <span style={{ fontSize: '12px', color: s.colors.gray }}>Loading filter options...</span>
          )}
        </div>

        {reportType === 'user' ? (
          /* USER REPORT FILTERS */
          <div style={formGrid}>
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

            <div>
              <label style={labelStyle}>Search Query</label>
              <input
                type="text"
                placeholder="Search username or email..."
                value={userFilters.search}
                onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                style={inputStyle}
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
                  emptyLabel="Any Participant"
                  allowClear={true}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ ...formGrid, marginTop: '16px' }}>
              <div>
                <label style={labelStyle}>From Date</label>
                <input
                  type="date"
                  value={roomFilters.start_date}
                  onChange={(e) => setRoomFilters({ ...roomFilters, start_date: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>To Date</label>
                <input
                  type="date"
                  value={roomFilters.end_date}
                  onChange={(e) => setRoomFilters({ ...roomFilters, end_date: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Search Room Name</label>
                <input
                  type="text"
                  placeholder="Filter by room name..."
                  value={roomFilters.search}
                  onChange={(e) => setRoomFilters({ ...roomFilters, search: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: `1px solid ${s.colors.darkLight}`,
          }}
        >
          <button
            onClick={handleViewReport}
            disabled={loading}
            style={{
              ...s.btn('primary'),
              padding: '10px 22px',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {loading ? (
              'Generating...'
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
                View Report
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={loading}
            style={{
              ...s.btn('default'),
              padding: '10px 18px',
              fontSize: '14px',
            }}
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <div style={{ ...s.card, padding: '48px', textAlign: 'center', color: s.colors.gray }}>
          <div style={{ fontSize: '15px', marginBottom: '8px' }}>Generating report data...</div>
          <div style={{ fontSize: '13px' }}>Please wait while matching records are computed.</div>
        </div>
      ) : reportData ? (
        <div>
          {/* Summary KPI Badges */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {reportType === 'user' ? (
              <>
                <div style={statCardStyle}>
                  <div style={{ fontSize: '12px', color: s.colors.gray, textTransform: 'uppercase' }}>
                    Matching Users
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: s.colors.main, marginTop: '4px' }}>
                    {reportData.summary.total_users}
                  </div>
                </div>
                <div style={statCardStyle}>
                  <div style={{ fontSize: '12px', color: s.colors.gray, textTransform: 'uppercase' }}>
                    Rooms Hosted
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginTop: '4px' }}>
                    {reportData.summary.total_rooms_hosted}
                  </div>
                </div>
                <div style={statCardStyle}>
                  <div style={{ fontSize: '12px', color: s.colors.gray, textTransform: 'uppercase' }}>
                    Messages Sent
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginTop: '4px' }}>
                    {reportData.summary.total_messages_sent}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={statCardStyle}>
                  <div style={{ fontSize: '12px', color: s.colors.gray, textTransform: 'uppercase' }}>
                    Matching Rooms
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: s.colors.main, marginTop: '4px' }}>
                    {reportData.summary.total_rooms}
                  </div>
                </div>
                <div style={statCardStyle}>
                  <div style={{ fontSize: '12px', color: s.colors.gray, textTransform: 'uppercase' }}>
                    Total Participants
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginTop: '4px' }}>
                    {reportData.summary.total_participants}
                  </div>
                </div>
                <div style={statCardStyle}>
                  <div style={{ fontSize: '12px', color: s.colors.gray, textTransform: 'uppercase' }}>
                    Total Messages
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginTop: '4px' }}>
                    {reportData.summary.total_messages}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Preview Table Card */}
          <div style={{ ...s.card, marginBottom: '22px' }}>
            <div
              style={{
                padding: '14px 18px',
                borderBottom: `1px solid ${s.colors.dark}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                On-Screen Preview ({reportData.results.length} records)
              </span>
            </div>

            <div style={s.tableWrap}>
              {reportType === 'user' ? (
                /* USER REPORT TABLE */
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>ID</th>
                      <th style={s.th}>Username</th>
                      <th style={s.th}>Email</th>
                      <th style={s.th}>Role</th>
                      <th style={s.th}>Status</th>
                      <th style={s.th}>Joined</th>
                      <th style={s.th}>Last Login</th>
                      <th style={{ ...s.th, textAlign: 'right' }}>Rooms Hosted</th>
                      <th style={{ ...s.th, textAlign: 'right' }}>Rooms Joined</th>
                      <th style={{ ...s.th, textAlign: 'right' }}>Messages Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.results.length > 0 ? (
                      reportData.results.map((u) => (
                        <tr key={u.id}>
                          <td style={{ ...s.td, color: s.colors.gray }}>#{u.id}</td>
                          <td style={{ ...s.td, fontWeight: '600' }}>{u.username}</td>
                          <td style={{ ...s.td, color: s.colors.lightGray }}>{u.email}</td>
                          <td style={s.td}>
                            <span
                              style={s.badge(
                                u.role === 'Superuser' ? 'superuser' : u.role === 'Staff' ? 'staff' : 'default'
                              )}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td style={s.td}>
                            <span
                              style={{
                                color: u.is_active ? s.colors.success : s.colors.error,
                                fontSize: '12px',
                                fontWeight: '600',
                              }}
                            >
                              {u.is_active ? '● Active' : '● Inactive'}
                            </span>
                          </td>
                          <td style={{ ...s.td, fontSize: '12px', color: s.colors.lightGray }}>
                            {u.date_joined || '—'}
                          </td>
                          <td style={{ ...s.td, fontSize: '12px', color: s.colors.lightGray }}>
                            {u.last_login || 'Never'}
                          </td>
                          <td style={{ ...s.td, textAlign: 'right', fontWeight: '600' }}>{u.rooms_hosted}</td>
                          <td style={{ ...s.td, textAlign: 'right', color: s.colors.lightGray }}>
                            {u.rooms_joined}
                          </td>
                          <td style={{ ...s.td, textAlign: 'right', fontWeight: '600', color: s.colors.main }}>
                            {u.messages_sent}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" style={s.emptyState}>
                          No users found matching the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                /* ROOM REPORT TABLE */
                <table style={s.table}>
                  <thead>
                    <tr>
                      <th style={s.th}>ID</th>
                      <th style={s.th}>Room Name</th>
                      <th style={s.th}>Topic</th>
                      <th style={s.th}>Host / Creator</th>
                      <th style={s.th}>Created Date</th>
                      <th style={s.th}>Last Updated</th>
                      <th style={{ ...s.th, textAlign: 'right' }}>Participants</th>
                      <th style={{ ...s.th, textAlign: 'right' }}>Messages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.results.length > 0 ? (
                      reportData.results.map((r) => (
                        <tr key={r.id}>
                          <td style={{ ...s.td, color: s.colors.gray }}>#{r.id}</td>
                          <td style={{ ...s.td, fontWeight: '600' }}>{r.name}</td>
                          <td style={s.td}>
                            <span style={s.badge('default')}>{r.topic}</span>
                          </td>
                          <td style={{ ...s.td, color: s.colors.main }}>@{r.host_username}</td>
                          <td style={{ ...s.td, fontSize: '12px', color: s.colors.lightGray }}>{r.created}</td>
                          <td style={{ ...s.td, fontSize: '12px', color: s.colors.lightGray }}>{r.updated}</td>
                          <td style={{ ...s.td, textAlign: 'right', fontWeight: '600' }}>
                            {r.participants_count}
                          </td>
                          <td style={{ ...s.td, textAlign: 'right', fontWeight: '600', color: s.colors.main }}>
                            {r.messages_count}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={s.emptyState}>
                          No rooms found matching the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Export Options Bar Below Table */}
          <div
            style={{
              ...s.card,
              padding: '18px 22px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
              background: 'linear-gradient(180deg, #34354a 0%, #2a2b3d 100%)',
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                📥 Download Filtered Report
              </div>
              <div style={{ fontSize: '12px', color: s.colors.lightGray, marginTop: '2px' }}>
                Exports the exact filtered records ({reportData.results.length} items) in your selected format
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                  gap: '7px',
                  padding: '9px 16px',
                }}
              >
                <span>📄</span>
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
                  gap: '7px',
                  padding: '9px 16px',
                }}
              >
                <span>📊</span>
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
                  gap: '7px',
                  padding: '9px 16px',
                  boxShadow: '0 2px 8px rgba(16, 124, 65, 0.3)',
                }}
              >
                <span>📗</span>
                {downloadingFormat === 'xlsx' ? 'Downloading...' : 'Download XLSX'}
              </button>
            </div>
          </div>
        </div>
      ) : hasViewed ? null : (
        /* Initial prompt to fill form and click view */
        <div
          style={{
            ...s.card,
            padding: '48px 24px',
            textAlign: 'center',
            color: s.colors.gray,
            borderStyle: 'dashed',
          }}
        >
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>📊</div>
          <div style={{ fontSize: '15px', color: s.colors.light, fontWeight: '600', marginBottom: '6px' }}>
            Ready to Generate Report
          </div>
          <div style={{ fontSize: '13px', maxWidth: '420px', margin: '0 auto' }}>
            Select your desired filters in the form above and click the <strong>View Report</strong> button
            to preview the results and unlock downloads.
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
