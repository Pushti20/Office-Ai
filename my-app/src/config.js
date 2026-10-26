// Central API base URL configuration
// In Docker, set REACT_APP_API_URL=http://localhost:5000 (or your host)
// Falls back to localhost:5000 for local development
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default API_URL;
