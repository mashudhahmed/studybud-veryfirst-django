import client from './client';
import { extractErrorMessage } from '../utils/apiError';

export const getProfile = async (id) => {
  try {
    const response = await client.get(`/profile/${id}/`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch profile'));
  }
};

export const getUserProfile = async (id) => {
  try {
    const response = await client.get(`/users/${id}/`);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch user profile'));
  }
};
