import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await axios.post('/auth/signup', { username, email, password });
      setMessage("✅ Registration successful! Please check your email for the confirmation code.");
      setTimeout(() => navigate('/confirm-signup'), 2500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-6 py-12 text-white">
      <div className="w-full max-w-md space-y-8 bg-gray-800 bg-opacity-90 p-8 rounded-xl shadow-xl backdrop-blur-sm">
        <div className="text-center">
          <img
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
            alt="Delve"
            className="mx-auto h-10 w-10"
          />
          <h2 className="mt-6 text-2xl font-bold tracking-tight">Create your account</h2>
        </div>

        {message && <div className="text-sm text-green-400 text-center">{message}</div>}
        {error && <div className="text-sm text-red-400 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
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

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-700 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          {/* Password */}
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

          {/* Submit */}
          <div>
            <button
              type="submit"
              className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Register
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <a href="/login" className="font-semibold text-indigo-500 hover:text-indigo-400">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
