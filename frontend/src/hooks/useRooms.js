import { useState, useEffect, useCallback } from 'react';
import * as roomsApi from '../api/rooms';

export const useRooms = (params = {}) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await roomsApi.getRooms(params);
      // Public rooms API returns a plain array (no pagination)
      setRooms(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const refetch = useCallback(() => {
    fetchRooms();
  }, [fetchRooms]);

  return { rooms, loading, error, refetch };
};
