// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  // 백엔드가 로컬 PC에서 실행 중이면 -> http://192.168.124.100:3000
  // NestJS 서버 주소 (개발 시) -> http://localhost:3000
  baseURL: 'http://192.168.124.100:3000', // NestJS 서버 주소 (개발시)
  timeout: 5000,
});

export default api;
