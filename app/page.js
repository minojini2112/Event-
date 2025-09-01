'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page
    router.replace('/home');
  }, [router]);

  // Show a loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-full flex items-center justify-center animate-pulse">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#3B82F6] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
        </div>
        <h2 className="mt-6 text-2xl font-bold bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] bg-clip-text text-transparent">
          Redirecting to EventIA...
        </h2>
        <p className="mt-2 text-[#64748B]">Please wait while we take you to the home page</p>
      </div>
    </div>
  );
}
