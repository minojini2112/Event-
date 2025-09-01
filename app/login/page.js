'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { getUserFromCustomTable } from '../../lib/userUtils';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        try {
          // Get user role from custom table
          const userData = await getUserFromCustomTable(data.user.id);
          
          // Store user data in localStorage
          localStorage.setItem('userId', data.user.id);
          localStorage.setItem('username', userData.username);
          localStorage.setItem('role', userData.role);
          if (data.user.email) {
            localStorage.setItem('email', data.user.email);
          }
          
          // Redirect to role-specific main page
          const isGlobal = userData.role === 'global' || userData.role === 'global admin';
          const isAdmin = userData.role === 'admin';
          const redirectRoute = isGlobal ? '/main/0' : isAdmin ? '/main/1' : '/main/2';
          router.push(redirectRoute);
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to participant route if there's an error
          router.push('/main/2');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupRedirect = () => {
    router.push('/signup');
  };

  const handleBackToHome = () => {
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-[#06B6D4]/10 to-[#3B82F6]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-gradient-to-r from-[#3B82F6]/5 to-[#1E40AF]/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23E2E8F0' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
      </div>

      {/* Back Button */}
      <button
        onClick={handleBackToHome}
        className="absolute top-8 left-8 z-20 flex items-center text-[#3B82F6] hover:text-[#1E40AF] transition-all duration-300 font-semibold group"
      >
        <div className="w-12 h-12 bg-white/80 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-2xl flex items-center justify-center mr-3 group-hover:border-[#3B82F6] group-hover:shadow-lg transition-all duration-300 shadow-md">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
        Back to Home
      </button>

      <div className={`relative z-10 max-w-md w-full mx-6 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-[#E2E8F0]/50 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/5 to-[#06B6D4]/5 rounded-3xl blur-2xl"></div>
          
          <div className="relative">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="w-24 h-24 bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-[#1E40AF] mb-3">EventIA</h1>
              <h2 className="text-2xl font-bold text-[#334155] mb-2">Welcome Back!</h2>
              <p className="text-[#64748B]">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl backdrop-blur-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#334155] mb-3">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 bg-white/60 backdrop-blur-sm border-2 border-[#E2E8F0] rounded-2xl focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all duration-300 text-[#334155] placeholder-[#64748B] hover:border-[#3B82F6]/50"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#334155] mb-3">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 bg-white/60 backdrop-blur-sm border-2 border-[#E2E8F0] rounded-2xl focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all duration-300 text-[#334155] placeholder-[#64748B] hover:border-[#3B82F6]/50"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white py-4 px-6 rounded-2xl hover:from-[#1E40AF] hover:to-[#3B82F6] transition-all duration-500 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden group relative"
              >
                <span className="relative z-10">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Login'
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </form>

            <div className="text-center mt-8">
              <p className="text-[#64748B]">
                Don&apos;t have an account?{' '}
                <button
                  onClick={handleSignupRedirect}
                  className="text-[#3B82F6] hover:text-[#1E40AF] font-bold underline decoration-2 underline-offset-4 hover:decoration-[#3B82F6] transition-all duration-300"
                >
                  Create account
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}