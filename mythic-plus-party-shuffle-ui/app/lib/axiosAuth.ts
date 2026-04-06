'use client';

import axios from 'axios';

let installed = false;

/** Attach JWT from localStorage so auth works when session cookies are not stored (e.g. API behind same-origin proxy). */
export function installAxiosAuthInterceptor(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  axios.interceptors.request.use((config) => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      /* ignore */
    }
    return config;
  });
}

installAxiosAuthInterceptor();
