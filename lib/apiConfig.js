const API_URL = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.hostname.startsWith('192.168.'))
  ? `http://${window.location.hostname}:5000`
  : "https://betproexchange-server.onrender.com";

export const getApiUrl = () => {
  return API_URL;
};

export default API_URL;
