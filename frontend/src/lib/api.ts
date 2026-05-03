import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  // You can add auth headers here later if needed
});
