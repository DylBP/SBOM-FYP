import axios from "axios";

const instance = axios.create({
  baseURL: 'http://3.252.192.200:3000/',
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
