import axios from "axios";

const instance = axios.create({
  baseURL: 'http://52.210.127.106:3000/',
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
