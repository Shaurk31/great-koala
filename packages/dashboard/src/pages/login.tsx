'use client';

import React, { useState } from 'react';
import { login } from '../lib/api';
import { setToken } from '../lib/auth';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Invalid login');
      return;
    }
    setToken(result.accessToken);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-semibold text-gray-900">Login</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" type="submit">
            Sign in
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600">
          Need an account? <a className="text-blue-600" href="/register">Register</a>
        </p>
      </div>
    </div>
  );
}
