'use client';

import React, { useState } from 'react';
import { register } from '../lib/api';
import { setToken } from '../lib/auth';
import { useRouter } from 'next/router';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const result = await register(email, password, name);
    if (!result.success) {
      setError(result.error || 'Registration failed');
      return;
    }
    const loginResult = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then((res) => res.json());
    if (!loginResult.success) {
      setError(loginResult.error || 'Unable to log in after registration');
      return;
    }
    setToken(loginResult.accessToken);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create an account</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
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
            Register
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600">
          Already have an account? <a className="text-blue-600" href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}
