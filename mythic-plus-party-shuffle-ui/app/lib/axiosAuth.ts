'use client';

import axios from 'axios';

/** Ensure session cookie is sent on same-site and cross-origin API calls (BFF + Nest). */
if (typeof window !== 'undefined') {
  axios.defaults.withCredentials = true;
}
