const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? "http://localhost:5000"
  : "https://betproexchange-server.onrender.com";

export const getApiUrl = () => {
  return API_URL;
};

export default API_URL;
