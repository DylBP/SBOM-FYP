import axios from "axios";

const instance = axios.create({
  baseURL: 'http://3.254.109.75:3000/',
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
