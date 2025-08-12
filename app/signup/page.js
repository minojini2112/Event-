'use client';
import { useState } from 'react';
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
          
          // Store username and role in localStorage for later use
          localStorage.setItem('username', formData.username);
          localStorage.setItem('role', formData.role);
          
          // Redirect to main page after successful signup
          router.push('/main');
        } catch (insertError) {
          setError('Account created but failed to save additional details. Please contact support.');
        }
      }
    } catch (error) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-6">
      {/* Back Button */}
      <button
        onClick={handleBackToHome}
        className="absolute top-6 left-6 flex items-center text-gray-700 hover:text-blue-600 transition-colors font-medium"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </button>

      <div className="max-w-4xl w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">EventIA</h1>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Join us today!</h2>
            <p className="text-gray-600">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
                         {/* Two Column Layout */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Left Column */}
               <div className="space-y-6">
                 <div>
                   <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                     Email Address
                   </label>
                   <input
                     id="email"
                     name="email"
                     type="email"
                     required
                     value={formData.email}
                     onChange={handleInputChange}
                     className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-black placeholder-gray-500"
                     placeholder="Enter your email"
                   />
                 </div>

                 <div>
                   <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                     Username
                   </label>
                   <input
                     id="username"
                     name="username"
                     type="text"
                     required
                     value={formData.username}
                     onChange={handleInputChange}
                     className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-black placeholder-gray-500"
                     placeholder="Choose a username"
                   />
                 </div>
               </div>

               {/* Right Column */}
               <div className="space-y-6">
                 <div>
                   <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                     Password
                   </label>
                   <input
                     id="password"
                     name="password"
                     type="password"
                     required
                     value={formData.password}
                     onChange={handleInputChange}
                     className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-black placeholder-gray-500"
                     placeholder="Enter your password"
                   />
                 </div>

                 <div>
                   <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                     Confirm Password
                   </label>
                   <input
                     id="confirmPassword"
                     name="confirmPassword"
                     type="password"
                     required
                     value={formData.confirmPassword}
                     onChange={handleInputChange}
                     className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-black placeholder-gray-500"
                     placeholder="Confirm your password"
                   />
                 </div>
               </div>
             </div>

             {/* Full Width Role Selection */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-3">
                 Account Role
               </label>
               <div className="grid grid-cols-2 gap-4">
                 <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
                   <input
                     type="radio"
                     name="role"
                     value="participant"
                     checked={formData.role === 'participant'}
                     onChange={handleInputChange}
                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                   />
                   <span className="ml-3 text-gray-700 font-medium">Participant</span>
                 </label>
                 <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
                   <input
                     type="radio"
                     name="role"
                     value="admin"
                     checked={formData.role === 'admin'}
                     onChange={handleInputChange}
                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                   />
                   <span className="ml-3 text-gray-700 font-medium">Admin</span>
                 </label>
               </div>
             </div>

            {/* Full Width Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={handleLoginRedirect}
                className="text-blue-600 hover:text-blue-700 font-medium underline"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
      
      {/* Background Decorations */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-1/2 right-5 w-12 h-12 bg-pink-200 rounded-full opacity-20 animate-pulse"></div>
    </div>
  );
}
