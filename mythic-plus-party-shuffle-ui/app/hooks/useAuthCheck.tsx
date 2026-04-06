import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';

const useAuthCheck = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuthCheck must be used within AuthProvider');
  }
  return ctx;
};

export default useAuthCheck;
