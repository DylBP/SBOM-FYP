import { useState } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar";
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
    <>
      <div className="flex min-h-screen flex-col justify-center px-6 py-12 bg-gray-100 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            alt="Delve"
            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
            className="mx-auto h-10 w-auto"
          />
          <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
            Confirm your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          {message && <div className="mb-4 text-green-600 text-center">{message}</div>}
          {error && <div className="mb-4 text-red-500 text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-900">
                Username
              </label>
              <div className="mt-2">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                />
              </div>
            </div>

            {/* Confirmation Code */}
            <div>
              <label htmlFor="confirmationCode" className="block text-sm font-medium text-gray-900">
                Confirmation Code
              </label>
              <div className="mt-2">
                <input
                  id="confirmationCode"
                  name="confirmationCode"
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  required
                  className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                />
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                Confirm Sign Up
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-gray-500">
            Already confirmed?{' '}
            <a href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default ConfirmSignup;
