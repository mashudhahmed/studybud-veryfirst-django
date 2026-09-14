import client from './client';
import { extractErrorMessage } from '../utils/apiError';

export const getRooms = async ({ topic, search } = {}) => {
  try {
    const params = new URLSearchParams();

    if (topic) params.append('topic', topic);
    if (search) params.append('q', search);

    const response = await client.get(`/rooms/?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch rooms'));
  }
};

export const getRoom = async (id) => {
  try {
    const response = await client.get(`/rooms/${id}/`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch room'));
  }
};

export const createRoom = async (roomData) => {
  try {
    const response = await client.post('/rooms/create/', roomData);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create room'));
  }
};

export const updateRoom = async (id, roomData) => {
  try {
    const response = await client.put(`/rooms/${id}/update/`, roomData);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update room'));
  }
};

export const deleteRoom = async (id) => {
  try {
    const response = await client.delete(`/rooms/${id}/delete/`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete room'));
  }
};
