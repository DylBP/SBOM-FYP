import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

const ConfirmSignup = () => {
  const [username, setUsername] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await axios.post('/auth/confirm', { username, confirmationCode });
      setMessage("✅ Account confirmed! You can now log in.");
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Confirmation failed.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-6 py-12 text-white">
      <div className="w-full max-w-md space-y-8 bg-gray-800 bg-opacity-90 p-8 rounded-xl shadow-xl backdrop-blur-sm">
        <div className="text-center">
          <img
            alt="Delve"
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
            className="mx-auto h-10 w-10"
          />
          <h2 className="mt-6 text-2xl font-bold tracking-tight">Confirm your account</h2>
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

          {/* Confirmation Code */}
          <div>
            <label htmlFor="confirmationCode" className="block text-sm font-medium">
              Confirmation Code
            </label>
            <input
              id="confirmationCode"
              name="confirmationCode"
              type="text"
              required
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-700 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Confirm Sign Up
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already confirmed?{' '}
          <a href="/login" className="font-semibold text-indigo-500 hover:text-indigo-400">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default ConfirmSignup;
