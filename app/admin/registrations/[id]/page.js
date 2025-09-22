'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AdminRegistrationsForEvent() {
  const router = useRouter();
  const params = useParams();
  const idParamRaw = params?.id;
  const eventId = Array.isArray(idParamRaw) ? idParamRaw[0] : idParamRaw;
  const [registrations, setRegistrations] = useState([]);
  const [eventTitle, setEventTitle] = useState('Event');

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const regByEventRaw = window.localStorage.getItem('registrations_by_event');
      const regByEvent = regByEventRaw ? JSON.parse(regByEventRaw) : {};
      const list = Array.isArray(regByEvent?.[eventId]) ? regByEvent[eventId] : [];
      setRegistrations(list);
      const objRaw = window.localStorage.getItem('registered_event_objects');
      const objMap = objRaw ? JSON.parse(objRaw) : {};
      if (objMap?.[eventId]?.title) setEventTitle(objMap[eventId].title);
    } catch {}
  }, [eventId]);

  const count = useMemo(() => registrations.length, [registrations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Modern Header */}
      <header className="w-full px-4 sm:px-6 py-6 sm:py-8 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-800 tracking-tight">
              Event Registrations
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-center mt-2">
              <p className="text-slate-600 text-sm sm:text-base lg:text-lg font-medium">
                {eventTitle}
              </p>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-slate-600 font-medium text-sm sm:text-base">
                  {count} {count === 1 ? 'registration' : 'registrations'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => router.back()} 
            className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm font-semibold border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {registrations.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 lg:p-16 text-center shadow-sm">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-3">No registrations yet</h3>
            <p className="text-slate-600 text-sm sm:text-base lg:text-lg">Students haven&apos;t registered for this event yet</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Table Header */}
              <div className="bg-slate-50 border-b border-slate-200">
                <div className="grid grid-cols-12 gap-4 px-6 py-4">
                  <div className="col-span-4 text-sm font-semibold text-slate-700 flex items-center space-x-2">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Student Name</span>
                  </div>
                  <div className="col-span-3 text-sm font-semibold text-slate-700 flex items-center space-x-2">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Email Address</span>
                  </div>
                  <div className="col-span-3 text-sm font-semibold text-slate-700 flex items-center space-x-2">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Department</span>
                  </div>
                  <div className="col-span-2 text-sm font-semibold text-slate-700 flex items-center space-x-2">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v2a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 3v1h6V3H9zM6 8v12h12V8H6z" />
                    </svg>
                    <span>Reg. Number</span>
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-slate-100">
                {registrations.map((user, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-25 transition-colors duration-150">
                    <div className="col-span-4 flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{user.name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="col-span-3 flex items-center">
                      <p className="text-sm text-slate-600 break-all">{user.email || 'N/A'}</p>
                    </div>
                    <div className="col-span-3 flex items-center">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {user.department || 'N/A'}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <p className="text-sm font-mono text-slate-600">{user.registerNumber || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Summary */}
              <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    Showing all {count} {count === 1 ? 'registration' : 'registrations'}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Active registrations</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {registrations.map((user, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm sm:text-base font-semibold text-blue-600">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">
                        {user.name || 'N/A'}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-slate-600 break-all">{user.email || 'N/A'}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <div className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {user.department || 'N/A'}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v2a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 3v1h6V3H9zM6 8v12h12V8H6z" />
                          </svg>
                          <p className="text-sm font-mono text-slate-600">{user.registerNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Mobile Footer Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    Showing all {count} {count === 1 ? 'registration' : 'registrations'}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Active registrations</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}