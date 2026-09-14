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

export const downloadReport = async ({ type, format = 'csv', filters = {} }) => {
  try {
    const params = new URLSearchParams();
    params.append('export', format);

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
  } catch (error) {
    throw new Error(extractErrorMessage(error, `Failed to download ${format.toUpperCase()} report`));
  }
};
