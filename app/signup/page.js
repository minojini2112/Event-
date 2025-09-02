'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { insertUserToCustomTable } from '../../lib/userUtils';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'participant'
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
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Sign up the user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            role: formData.role
          }
        }
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        try {
          // Insert user data into custom users table
          await insertUserToCustomTable(data.user.id, formData.username, formData.role);
          
          // Store user data in localStorage for immediate use
          localStorage.setItem('userId', data.user.id);
          localStorage.setItem('username', formData.username);
          localStorage.setItem('role', formData.role);
          
          // Redirect based on role:
          // - Participants go to profile page to complete their profile
          // - Admins go directly to main page
          if (formData.role === 'admin') {
            router.push('/main/1');
          } else {
            // For participants, redirect to profile page to complete their profile
            router.push('/participant/profile');
          }
        } catch (err) {
          setError('Account created but failed to save additional details. Please contact support.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  const handleBackToHome = () => {
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] relative overflow-hidden flex items-center justify-center px-4 sm:px-6">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Floating Orbs */}
        <div className="absolute top-16 sm:top-20 left-16 sm:left-20 w-56 h-56 sm:w-72 sm:h-72 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-16 sm:bottom-20 right-16 sm:right-20 w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-r from-[#06B6D4]/10 to-[#3B82F6]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/4 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-r from-[#3B82F6]/5 to-[#1E40AF]/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        
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
        className="absolute top-6 sm:top-8 left-6 sm:left-8 z-20 flex items-center text-[#3B82F6] hover:text-[#1E40AF] transition-all duration-300 font-semibold group"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/80 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-2xl flex items-center justify-center mr-2 sm:mr-3 group-hover:border-[#3B82F6] group-hover:shadow-lg transition-all duration-300 shadow-md">
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
        <span className="text-sm sm:text-base">Back to Home</span>
      </button>

      <div className={`max-w-4xl w-full space-y-6 sm:space-y-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border border-[#E2E8F0]/50 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/5 to-[#06B6D4]/5 rounded-3xl blur-2xl"></div>
          
          <div className="relative">
            <div className="text-center mb-8 sm:mb-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#1E40AF] mb-2 sm:mb-3">EventIA</h1>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#334155] mb-2">Join us today!</h2>
              <p className="text-sm sm:text-base text-[#64748B]">Create your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl backdrop-blur-sm text-sm sm:text-base">
                  {error}
                </div>
              )}
              
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* Left Column */}
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-[#334155] mb-2 sm:mb-3">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-white/60 backdrop-blur-sm border-2 border-[#E2E8F0] rounded-2xl focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all duration-300 text-[#334155] placeholder-[#64748B] hover:border-[#3B82F6]/50 text-sm sm:text-base"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-semibold text-[#334155] mb-2 sm:mb-3">
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-white/60 backdrop-blur-sm border-2 border-[#E2E8F0] rounded-2xl focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all duration-300 text-[#334155] placeholder-[#64748B] hover:border-[#3B82F6]/50 text-sm sm:text-base"
                      placeholder="Choose a username"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-[#334155] mb-2 sm:mb-3">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-white/60 backdrop-blur-sm border-2 border-[#E2E8F0] rounded-2xl focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all duration-300 text-[#334155] placeholder-[#64748B] hover:border-[#3B82F6]/50 text-sm sm:text-base"
                      placeholder="Enter your password"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#334155] mb-2 sm:mb-3">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-white/60 backdrop-blur-sm border-2 border-[#E2E8F0] rounded-2xl focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all duration-300 text-[#334155] placeholder-[#64748B] hover:border-[#3B82F6]/50 text-sm sm:text-base"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>
              </div>

              {/* Full Width Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-[#334155] mb-3 sm:mb-4">
                  Account Role
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <label className="flex items-center p-4 sm:p-6 border-2 border-[#E2E8F0] rounded-2xl hover:border-[#3B82F6] transition-all duration-300 cursor-pointer bg-white/60 backdrop-blur-sm hover:bg-white/80 group">
                    <input
                      type="radio"
                      name="role"
                      value="participant"
                      checked={formData.role === 'participant'}
                      onChange={handleInputChange}
                      className="h-4 w-4 sm:h-5 sm:w-5 text-[#3B82F6] focus:ring-[#3B82F6] border-[#E2E8F0]"
                    />
                    <span className="ml-3 sm:ml-4 text-[#334155] font-semibold group-hover:text-[#3B82F6] transition-colors duration-300 text-sm sm:text-base">Participant</span>
                  </label>
                  <label className="flex items-center p-4 sm:p-6 border-2 border-[#E2E8F0] rounded-2xl hover:border-[#3B82F6] transition-all duration-300 cursor-pointer bg-white/60 backdrop-blur-sm hover:bg-white/80 group">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={formData.role === 'admin'}
                      onChange={handleInputChange}
                      className="h-4 w-4 sm:h-5 sm:w-5 text-[#3B82F6] focus:ring-[#3B82F6] border-[#E2E8F0]"
                    />
                    <span className="ml-3 sm:ml-4 text-[#334155] font-semibold group-hover:text-[#3B82F6] transition-colors duration-300 text-sm sm:text-base">Admin</span>
                  </label>
                </div>
              </div>

              {/* Full Width Submit Button */}
              <div className="pt-4 sm:pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white py-3 sm:py-4 px-6 sm:px-8 rounded-2xl hover:from-[#1E40AF] hover:to-[#3B82F6] transition-all duration-500 font-bold text-base sm:text-xl shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group relative"
                >
                  <span className="relative z-10">
                    {loading ? 'Creating Account...' : 'Sign Up'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
              </div>
            </form>

            <div className="text-center mt-6 sm:mt-8">
              <p className="text-[#64748B] text-sm sm:text-base">
                Already have an account?{' '}
                <button
                  onClick={handleLoginRedirect}
                  className="text-[#3B82F6] hover:text-[#1E40AF] font-bold underline decoration-2 underline-offset-4 hover:decoration-[#3B82F6] transition-all duration-300"
                >
                  Login here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
