const PROD_API_URL = "https://betproexchange-server.vercel.app";

const isLocalHost = (hostname) =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname.startsWith('192.168.') ||
  hostname.startsWith('10.') ||
  hostname.startsWith('172.') ||
  hostname.endsWith('.local') ||
  (typeof window !== 'undefined' && window.location.port === '3000');

export const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && isLocalHost(window.location.hostname)) {
    return `http://${window.location.hostname || 'localhost'}:5000`;
  }
  return PROD_API_URL;
};

export const getAuthToken = () => {
  if (typeof window === 'undefined') return '';
  try {
    const raw = localStorage.getItem('user_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.token) return parsed.token;
    }
  } catch {}
  return localStorage.getItem('token') || '';
};

const API_URL = getApiUrl();

export default API_URL;
