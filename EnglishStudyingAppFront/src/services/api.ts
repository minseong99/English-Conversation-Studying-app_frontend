// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // NestJS 서버 주소 (개발시)
  timeout: 5000,
});

export default api;
