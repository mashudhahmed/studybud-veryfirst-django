import client from './client';
import { extractErrorMessage } from '../utils/apiError';

export const login = async (username, password) => {
  try {
    const response = await client.post('/token/', { username, password });

    const { access, refresh } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Login failed'));
  }
};

export const register = async (userData) => {
  try {
    const response = await client.post('/register/', userData);

    const { access, refresh } = response.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Registration failed'));
  }
};

export const logout = async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken) {
      await client.post('/logout/', { refresh: refreshToken });
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  } catch (error) {
    localStorage.clear();
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await client.get('/me/');
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch user'));
  }
};

export const getCurrentProfile = async () => {
  try {
    const response = await client.get('/profile/me/');
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to fetch profile'));
  }
};

export const updateProfile = async (profileData) => {
  try {
    const response = await client.patch('/profile/update/', profileData);
    return response.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'Failed to update profile'));
  }
};
