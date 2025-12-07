// API configuration
// In production, frontend and backend are on same origin, so use empty string
// In development, point to backend server
const API_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

export default API_URL;
