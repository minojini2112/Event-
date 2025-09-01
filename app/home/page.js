'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignup = () => {
    router.push('/signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-[#06B6D4]/10 to-[#3B82F6]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-[#3B82F6]/5 to-[#1E40AF]/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23E2E8F0' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-50 w-full px-8 py-6 bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0]/50 shadow-lg sticky top-0">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4 group">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] rounded-2xl flex items-center justify-center shadow-2xl group-hover:shadow-[#3B82F6]/25 transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
            </div>
            <h1 className="text-5xl font-black text-[#1E40AF]">
              EventIA
            </h1>
          </div>
          
          {/* Login/Signup Buttons */}
          <div className="flex gap-4">
            <button 
              onClick={handleLogin}
              className="relative px-8 py-3 text-[#3B82F6] border-2 border-[#3B82F6] rounded-2xl hover:bg-[#EFF6FF] hover:border-[#1E40AF] transition-all duration-300 font-semibold bg-white/80 backdrop-blur-sm overflow-hidden group"
            >
              <span className="relative z-10">Login</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </button>
            <button 
              onClick={handleSignup}
              className="relative px-8 py-3 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white rounded-2xl hover:from-[#1E40AF] hover:to-[#3B82F6] transition-all duration-500 font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 overflow-hidden group"
            >
              <span className="relative z-10">Join Now</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <div className="text-center">
          {/* Hero Section */}
          <div className={`mb-24 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="relative mb-8">
              <h2 className="text-7xl md:text-8xl font-black text-[#1E40AF] mb-8 leading-tight">
                Welcome to<br />
                <span className="relative">
                  <span className="bg-gradient-to-r from-[#1E40AF] via-[#3B82F6] to-[#06B6D4] bg-clip-text text-transparent">
                    EventIA
                  </span>
                  <div className="absolute -inset-4 bg-gradient-to-r from-[#3B82F6]/20 to-[#06B6D4]/20 rounded-3xl blur-2xl"></div>
                </span>
              </h2>
              <div className="absolute -inset-8 bg-gradient-to-r from-[#3B82F6]/5 to-[#06B6D4]/5 rounded-full blur-3xl"></div>
            </div>
            
            <p className="text-2xl md:text-3xl text-[#64748B] max-w-4xl mx-auto mb-16 leading-relaxed font-light">
              Experience the future of event management with our cutting-edge platform that brings communities together.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-8 justify-center">
              <button 
                onClick={handleSignup}
                className="group relative px-16 py-5 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white rounded-2xl hover:from-[#1E40AF] hover:to-[#3B82F6] transition-all duration-500 font-bold text-2xl shadow-2xl hover:shadow-[#3B82F6]/25 transform hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10">Get Started Free</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
              </button>
              
              <button 
                onClick={handleLogin}
                className="group relative px-16 py-5 bg-white/80 backdrop-blur-sm text-[#3B82F6] border-2 border-[#3B82F6] rounded-2xl hover:bg-[#EFF6FF] hover:border-[#1E40AF] transition-all duration-300 font-bold text-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10">Explore Events</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </button>
            </div>
          </div>
          
          {/* Feature Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {[
              {
                icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                title: "Discover Events",
                description: "Explore amazing events happening around you with our intelligent discovery system and personalized recommendations."
              },
              {
                icon: "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
                title: "Manage Events",
                description: "Create and manage your events effortlessly with our powerful suite of organizational tools and analytics."
              },
              {
                icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                title: "Connect People",
                description: "Build lasting connections and bring communities together through meaningful events and shared experiences."
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group relative p-10 rounded-3xl bg-white/80 backdrop-blur-xl border border-[#E2E8F0]/50 hover:border-[#3B82F6] transition-all duration-500 transform hover:scale-105 hover:-translate-y-3 shadow-xl hover:shadow-2xl overflow-hidden"
                style={{
                  animationDelay: `${index * 200}ms`
                }}
              >
                {/* Card Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/5 to-[#06B6D4]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Icon Container */}
                <div className="relative w-24 h-24 bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:shadow-[#3B82F6]/25 transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-6">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                  </svg>
                  <div className="absolute -inset-2 bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                </div>
                
                <h3 className="relative text-3xl font-bold text-[#1E40AF] mb-6 group-hover:text-[#3B82F6] transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="relative text-[#64748B] leading-relaxed text-lg group-hover:text-[#334155] transition-colors duration-300">
                  {feature.description}
                </p>
                
                {/* Hover Border Glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"></div>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 mb-24 transition-all duration-1000 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {[
              { number: "10K+", label: "Events Created" },
              { number: "50K+", label: "Active Students" },
              { number: "500+", label: "Campuses" },
              { number: "99%", label: "Satisfaction" }
            ].map((stat, index) => (
              <div 
                key={index}
                className="group text-center p-8 rounded-2xl bg-white/60 backdrop-blur-sm border border-[#E2E8F0]/30 hover:border-[#3B82F6]/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-lg hover:shadow-xl"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="text-5xl font-black bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] bg-clip-text text-transparent group-hover:from-[#1E40AF] group-hover:to-[#3B82F6] transition-all duration-300">
                  {stat.number}
                </div>
                <div className="text-[#64748B] mt-3 font-semibold text-lg group-hover:text-[#334155] transition-colors duration-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Secondary CTA Section */}
          <div className={`relative p-16 rounded-3xl bg-gradient-to-br from-white/80 to-[#EFF6FF]/80 backdrop-blur-xl border border-[#E2E8F0]/50 shadow-2xl transition-all duration-1000 delay-600 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/5 to-[#06B6D4]/5 rounded-3xl blur-2xl"></div>
            
            <div className="relative">
              <h3 className="text-4xl font-bold text-[#1E40AF] mb-6">Ready to Transform Your Campus Events?</h3>
              <p className="text-[#64748B] text-xl mb-10 max-w-3xl mx-auto leading-relaxed">
                Join thousands of students and organizers who are already using EventIA to create amazing campus experiences.
              </p>
              <button 
                onClick={handleSignup}
                className="group relative px-16 py-5 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white rounded-2xl hover:from-[#1E40AF] hover:to-[#3B82F6] transition-all duration-500 font-bold text-2xl shadow-2xl hover:shadow-[#3B82F6]/25 transform hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10">Start Building Today</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
              </button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="relative mt-24 py-20 bg-gradient-to-br from-white/90 to-[#EFF6FF]/90 backdrop-blur-xl border-t border-[#E2E8F0]/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Column 1: Logo and Description */}
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-3xl font-bold text-[#1E40AF]">EventIA</h4>
              </div>
              <p className="text-[#64748B] leading-relaxed text-lg">
                Empowering college communities through innovative event management and seamless connections.
              </p>
            </div>

            {/* Column 2: Platform */}
            <div>
              <h5 className="font-bold text-[#334155] mb-6 text-lg">Platform</h5>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'API', 'Integrations'].map((item, index) => (
                  <li key={index}>
                    <a href="#" className="text-[#64748B] hover:text-[#3B82F6] transition-all duration-300 hover:translate-x-1 inline-block">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Support */}
            <div>
              <h5 className="font-bold text-[#334155] mb-6 text-lg">Support</h5>
              <ul className="space-y-3">
                {['Help Center', 'Contact Us', 'Community', 'Status'].map((item, index) => (
                  <li key={index}>
                    <a href="#" className="text-[#64748B] hover:text-[#3B82F6] transition-all duration-300 hover:translate-x-1 inline-block">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Company */}
            <div>
              <h5 className="font-bold text-[#334155] mb-6 text-lg">Company</h5>
              <ul className="space-y-3">
                {['About', 'Blog', 'Careers', 'Press'].map((item, index) => (
                  <li key={index}>
                    <a href="#" className="text-[#64748B] hover:text-[#3B82F6] transition-all duration-300 hover:translate-x-1 inline-block">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-[#E2E8F0]/50">
            <p className="text-[#64748B] text-sm">© 2024 EventIA. All rights reserved. Built for the future of campus events.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}