import client from './client';
import { extractErrorMessage } from '../utils/apiError';

export const getTopics = async ({ search, page = 1 } = {}) => {
  try {
    const params = new URLSearchParams();

    if (search) params.append('q', search);
    if (page) params.append('page', page);

    const response = await client.get(`/topics/?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch topics'));
  }
};

export const getTopic = async (id) => {
  try {
    const response = await client.get(`/topics/${id}/`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch topic'));
  }
};
