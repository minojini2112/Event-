'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export const AuthGuard = ({ children, requiredRole = null }) => {
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const userId = localStorage.getItem('userId');
      const role = localStorage.getItem('role');

      if (!userId || !role) {
        // Not authenticated, redirect to login
        router.push('/login');
        return;
      }

      if (requiredRole && role !== requiredRole) {
        // Wrong role, redirect to appropriate page
        if (role === 'admin') {
          router.push('/main/1');
        } else {
          router.push('/main/2');
        }
        return;
      }

      setAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [router, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return children;
};
