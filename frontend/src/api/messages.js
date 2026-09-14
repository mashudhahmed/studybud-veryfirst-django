import client from './client';
import { extractErrorMessage } from '../utils/apiError';

export const getMessages = async ({ roomId, page = 1, page_size } = {}) => {
  try {
    const params = new URLSearchParams();

    if (roomId) params.append('room', roomId);
    if (page) params.append('page', page);
    if (page_size) params.append('page_size', page_size);

    const response = await client.get(`/messages/?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch messages'));
  }
};

export const getMessage = async (id) => {
  try {
    const response = await client.get(`/messages/${id}/`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch message'));
  }
};

export const createMessage = async (messageData) => {
  try {
    const response = await client.post('/messages/create/', messageData);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to create message'));
  }
};

export const updateMessage = async (id, messageData) => {
  try {
    const response = await client.put(`/messages/${id}/update/`, messageData);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update message'));
  }
};

export const deleteMessage = async (id) => {
  try {
    const response = await client.delete(`/messages/${id}/delete/`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to delete message'));
  }
};
