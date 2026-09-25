const PROD_API_URL = "https://betproexchange-server.vercel.app";

const isLocalHost = (hostname) =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname.startsWith('192.168.');

export const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && isLocalHost(window.location.hostname)) {
    return `http://${window.location.hostname}:5000`;
  }
  return PROD_API_URL;
};

const API_URL = getApiUrl();

export default API_URL;
