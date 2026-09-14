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
