import axios from "axios";

const instance = axios.create({
  baseURL: 'http://ec2-54-194-138-194.eu-west-1.compute.amazonaws.com:3000/',
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default instance;
