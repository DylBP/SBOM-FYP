import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import axios from "../api/axios";
import cache from "../lib/cache"; // ✅ Cache import

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Authenticate the user
      const res = await axios.post('/auth/login', { username, password });
      login(res.data.tokens.AccessToken);

      // ✅ Fetch and cache all projects
      const projectRes = await axios.get("/api/projects");
      const projects = projectRes.data;
      cache.setProjects(projects);

      // ✅ Fetch and cache latest SBOMs for each project
      await Promise.all(
        projects.map(async (project) => {
          const id = project.projectId || project.id;
          try {
            const sbomRes = await axios.get(`/api/projects/${id}/sboms`);
            cache.setSboms(id, sbomRes.data);
          } catch (err) {
            console.warn(`Failed to preload SBOMs for project ${id}`, err);
          }
        })
      );

      // ✅ Navigate after data is ready
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-6 py-12 text-white">
      <div className="w-full max-w-md space-y-8 bg-gray-800 bg-opacity-90 p-8 rounded-xl shadow-xl backdrop-blur-sm">
        <div className="text-center">
          <img
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
            alt="Your Company"
            className="mx-auto h-10 w-10"
          />
          <h2 className="mt-6 text-2xl font-bold tracking-tight">Sign in to your account</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username input */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-700 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          {/* Password input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-700 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Sign in
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Don’t have an account?{' '}
          <a href="/register" className="font-semibold text-indigo-500 hover:text-indigo-400">
            Register
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
