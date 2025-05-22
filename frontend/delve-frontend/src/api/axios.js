import axios from "axios";

const instance = axios.create({
  baseURL: 'http://sbom-api-alb-289974534.eu-west-1.elb.amazonaws.com',
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      alert("Session expired. Please log in again.");
    }

    return Promise.reject(error);
  }
);

export default instance;
