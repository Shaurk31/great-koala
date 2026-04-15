'use client';

import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { clearToken, getToken } from '../lib/auth';

const publicRoutes = ['/login', '/register'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token && !publicRoutes.includes(router.pathname)) {
      router.push('/login');
    }
  }, [router.pathname]);

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  const showAppNav = !publicRoutes.includes(router.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <a href="/" className="text-xl font-semibold text-gray-900">
              great-koala
            </a>
          </div>
          {showAppNav ? (
            <nav className="space-x-4 text-sm text-gray-600">
              <a href="/" className="hover:text-gray-900">
                Dashboard
              </a>
              <a href="/connections" className="hover:text-gray-900">
                Connections
              </a>
              <a href="/actions" className="hover:text-gray-900">
                Actions
              </a>
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Logout
              </button>
            </nav>
          ) : (
            <nav className="space-x-4 text-sm text-gray-600">
              <a href="/login" className="hover:text-gray-900">
                Login
              </a>
              <a href="/register" className="hover:text-gray-900">
                Register
              </a>
            </nav>
          )}
        </div>
      </header>
      <main>
        <Component {...pageProps} />
      </main>
    </div>
  );
}
