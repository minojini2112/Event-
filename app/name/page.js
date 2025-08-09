'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NamePage() {
  const router = useRouter();
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      // Handle username submission logic here
      console.log('Username selected:', username);
      // Navigate to next page (you can change this destination)
      router.push('/home');
    }
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-6">
      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-gray-100">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Welcome to EventIA! 🎉
          </h1>
          
          <p className="text-lg text-gray-600 mb-2">
            How would you like people to call you?
          </p>
          
          <p className="text-sm text-gray-500">
            Choose a username that represents you best
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-3">
              Enter your username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg"
                placeholder="Your awesome username..."
                required
                minLength={3}
                maxLength={20}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Username should be 3-20 characters long
            </p>
          </div>

          <button
            type="submit"
            disabled={username.length < 3}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Continue to EventIA
          </button>
        </form>

        {/* Fun Elements */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-2 text-2xl mb-3">
            <span>🎪</span>
            <span>🎯</span>
            <span>🌟</span>
          </div>
          <p className="text-xs text-gray-400">
            Get ready to discover amazing events!
          </p>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-1/2 left-5 w-12 h-12 bg-pink-200 rounded-full opacity-20 animate-pulse"></div>
    </div>
  );
}
