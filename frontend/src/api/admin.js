import client from './client';
import { extractErrorMessage } from '../utils/apiError';

// -------------------- Stats --------------------

export const getStats = async () => {
  try {
    const response = await client.get('/admin/stats/');
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch dashboard stats'));
  }
};

// -------------------- Users --------------------

export const getUsers = async ({
  search, role, status, joined_after, joined_before, page = 1, page_size = 25,
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('q', search);
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    if (joined_after) params.append('joined_after', joined_after);
    if (joined_before) params.append('joined_before', joined_before);
    if (page) params.append('page', page);
    if (page_size) params.append('page_size', page_size);

    const response = await client.get(`/admin/users/?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch users'));
  }
};

export const updateUser = async (id, data) => {
  try {
    const response = await client.patch(`/admin/users/${id}/`, data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update user'));
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await client.delete(`/admin/users/${id}/delete/`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete user'));
  }
};

export const getUserMessages = async (userId, { page = 1, page_size = 50 } = {}) => {
  try {
    const params = new URLSearchParams();
    params.append('user', userId);
    params.append('page', page);
    params.append('page_size', page_size);
    const response = await client.get(`/messages/?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch user messages'));
  }
};

// -------------------- Rooms --------------------

export const getRooms = async ({ search, topic, host, page = 1, page_size = 25 } = {}) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('q', search);
    if (topic) params.append('topic', topic);
    if (host) params.append('host', host);
    if (page) params.append('page', page);
    if (page_size) params.append('page_size', page_size);

    const response = await client.get(`/admin/rooms/?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch rooms'));
  }
};

export const createRoom = async (data) => {
  try {
    const response = await client.post('/admin/rooms/create/', data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create room'));
  }
};

export const downloadRoomsTemplate = async () => {
  try {
    const response = await client.get('/admin/rooms/upload-template/', {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', 'studybud_rooms_template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to download rooms template'));
  }
};

export const bulkUploadRooms = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await client.post('/admin/rooms/bulk-upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to upload rooms spreadsheet'));
  }
};

export const updateRoom = async (id, data) => {
  try {
    const response = await client.patch(`/admin/rooms/${id}/update/`, data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update room'));
  }
};

export const deleteRoom = async (id) => {
  try {
    const response = await client.delete(`/admin/rooms/${id}/delete/`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete room'));
  }
};

// -------------------- Topics --------------------

export const getTopics = async ({ search, has_rooms, page = 1, page_size = 25 } = {}) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('q', search);
    if (has_rooms) params.append('has_rooms', has_rooms);
    if (page) params.append('page', page);
    if (page_size) params.append('page_size', page_size);

    const response = await client.get(`/admin/topics/?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch topics'));
  }
};

export const createTopic = async (data) => {
  try {
    const response = await client.post('/admin/topics/create/', data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create topic'));
  }
};

export const updateTopic = async (id, data) => {
  try {
    const response = await client.patch(`/admin/topics/${id}/update/`, data);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update topic'));
  }
};

export const deleteTopic = async (id) => {
  try {
    const response = await client.delete(`/admin/topics/${id}/delete/`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete topic'));
  }
};

// -------------------- Reports --------------------

export const getReportFilterOptions = async () => {
  try {
    const response = await client.get('/admin/reports/options/');
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch report filter options'));
  }
};

export const getUserReport = async ({ role, user_id, search } = {}) => {
  try {
    const params = new URLSearchParams();
    if (role && role !== 'all') params.append('role', role);
    if (user_id && user_id !== 'all') params.append('user_id', user_id);
    if (search) params.append('search', search);

    const response = await client.get(`/admin/reports/users/?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch user report'));
  }
};

export const getRoomReport = async ({ topic_id, creator_id, participant_id, start_date, end_date, search } = {}) => {
  try {
    const params = new URLSearchParams();
    if (topic_id && topic_id !== 'all') params.append('topic_id', topic_id);
    if (creator_id && creator_id !== 'all') params.append('creator_id', creator_id);
    if (participant_id && participant_id !== 'all') params.append('participant_id', participant_id);
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    if (search) params.append('search', search);

    const response = await client.get(`/admin/reports/rooms/?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch room report'));
  }
};

export const downloadReport = async ({ type, format = 'csv', filters = {}, orientation = null }) => {
  try {
    const params = new URLSearchParams();
    params.append('export', format);
    if (orientation) {
      params.append('orientation', orientation);
    }

    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'all') {
        params.append(key, val);
      }
    });

    const endpoint = type === 'user' ? '/admin/reports/users/' : '/admin/reports/rooms/';
    const response = await client.get(`${endpoint}?${params.toString()}`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;

    const disposition = response.headers['content-disposition'];
    let filename = `${type}_report.${format}`;
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    return {
      filename,
      orientation: response.headers['x-report-orientation'],
      tier: response.headers['x-report-tier'],
      measuredWidth: response.headers['x-report-measured-width'],
    };
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        if (json.detail) {
          throw new Error(json.detail);
        }
      } catch (parseErr) {
        if (parseErr.message && !parseErr.message.includes('JSON')) {
          throw parseErr;
        }
      }
    }
    throw new Error(extractErrorMessage(error, 'No data found matching the selected filters.'));
  }
};

export const checkReportPdfFit = async ({ type, filters = {} }) => {
  try {
    const params = new URLSearchParams();
    params.append('check_fit', '1');

    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'all') {
        params.append(key, val);
      }
    });

    const endpoint = type === 'user' ? '/admin/reports/users/' : '/admin/reports/rooms/';
    const response = await client.get(`${endpoint}?${params.toString()}`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error(extractErrorMessage(error, 'Failed to inspect report layout.'));
  }
};

export const openReportHtmlView = async ({ type, filters = {}, autoPrint = false }) => {
  try {
    const params = new URLSearchParams();
    params.append('export', 'html');
    if (autoPrint) {
      params.append('auto_print', '1');
    }

    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'all') {
        params.append(key, val);
      }
    });

    const endpoint = type === 'user' ? '/admin/reports/users/' : '/admin/reports/rooms/';
    const response = await client.get(`${endpoint}?${params.toString()}`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/html;charset=utf-8' });
    const viewUrl = window.URL.createObjectURL(blob);
    window.open(viewUrl, '_blank');
  } catch (error) {
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        if (json.detail) {
          throw new Error(json.detail);
        }
      } catch (parseErr) {
        if (parseErr.message && !parseErr.message.includes('JSON')) {
          throw parseErr;
        }
      }
    }
    throw new Error(extractErrorMessage(error, 'Failed to generate HTML report view.'));
  }
};
