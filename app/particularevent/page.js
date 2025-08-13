'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ParticularEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  const [eventData, setEventData] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      
      // Get user role from localStorage
      const role = localStorage.getItem('role');
      setUserRole(role);
      
      const idStr = idParam ? String(idParam) : null;
      // Try from posted events
      const postedRaw = window.localStorage.getItem('posted_events');
      if (postedRaw) {
        const posted = JSON.parse(postedRaw);
        if (Array.isArray(posted) && idStr) {
          const found = posted.find((e) => String(e.id) === idStr);
          if (found) {
            setEventData(found);
            return;
          }
        }
      }
      // Fallback from selected_event set by main pages
      const selectedRaw = window.localStorage.getItem('selected_event');
      if (selectedRaw) {
        const selected = JSON.parse(selectedRaw);
        if (selected && (!idStr || String(selected.id) === idStr)) {
          setEventData(selected);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load event details:', e);
    }
  }, [idParam]);

  const title = useMemo(() => eventData?.title || 'Event Details', [eventData]);

  // Sensible dummy defaults (used when fields are missing)
  const dummy = {
    title: 'Tech Conference 2024',
    start_date: '2024-03-15',
    end_date: '2024-03-16',
    total_participants_allowed: '200',
    description: 'Join us for the biggest tech conference of the year with inspiring talks, workshops, and networking.',
    image: '/api/placeholder/800/500',
    student_coordinators: [
      { name: 'Lily', phone: '98765 43210' },
      { name: 'Arun', phone: '91234 56780' }
    ],
    staff_incharge: [
      { name: 'Dr. Meera', department: 'Computer Science' }
    ]
  };

  // Merge defaults with loaded data
  const resolved = {
    ...dummy,
    ...(eventData || {}),
    student_coordinators:
      eventData?.student_coordinators?.length ? eventData.student_coordinators : dummy.student_coordinators,
    staff_incharge:
      eventData?.staff_incharge?.length ? eventData.staff_incharge : dummy.staff_incharge
  };

  const imageUrl = resolved.image || '/api/placeholder/800/500';
  const formatYmd = (ymd) => {
    if (!ymd) return '-';
    const [y, m, d] = ymd.split('-').map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1);
    if (Number.isNaN(date.getTime())) return ymd;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };
  const dateRangeLabel = `${formatYmd(resolved.start_date || resolved.date)}${resolved.end_date ? ` — ${formatYmd(resolved.end_date)}` : ''}`;

  // CTA state and handlers
  const [isRegistered, setIsRegistered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const id = String(eventData?.id || searchParams.get('id') || '');
      const regRaw = window.localStorage.getItem('registered_event_ids');
      const wishRaw = window.localStorage.getItem('wishlist_event_ids');
      const reg = regRaw ? JSON.parse(regRaw) : [];
      const wish = wishRaw ? JSON.parse(wishRaw) : [];
      setIsRegistered(Array.isArray(reg) && reg.includes(id));
      setIsWishlisted(Array.isArray(wish) && wish.includes(id));
    } catch {}
  }, [eventData, searchParams]);

  const handleRegister = () => {
    try {
      if (typeof window === 'undefined') return;
      const id = String(eventData?.id || searchParams.get('id') || Date.now());
      // 1) mark event id for this user
      const regRaw = window.localStorage.getItem('registered_event_ids');
      const regIds = regRaw ? JSON.parse(regRaw) : [];
      if (!regIds.includes(id)) regIds.push(id);
      window.localStorage.setItem('registered_event_ids', JSON.stringify(regIds));
      // 2) store event object for listing later
      const mapRaw = window.localStorage.getItem('registered_event_objects');
      const objMap = mapRaw ? JSON.parse(mapRaw) : {};
      objMap[id] = resolved;
      window.localStorage.setItem('registered_event_objects', JSON.stringify(objMap));
      // 3) append to admin-facing registrations_by_event
      const regByEventRaw = window.localStorage.getItem('registrations_by_event');
      const regByEvent = regByEventRaw ? JSON.parse(regByEventRaw) : {};
      const dummyUser = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        department: 'Computer Science',
        registerNumber: 'REG123456',
        registeredAt: new Date().toISOString()
      };
      regByEvent[id] = Array.isArray(regByEvent[id]) ? regByEvent[id] : [];
      if (!regByEvent[id].some((u) => u.registerNumber === dummyUser.registerNumber)) {
        regByEvent[id].push(dummyUser);
      }
      window.localStorage.setItem('registrations_by_event', JSON.stringify(regByEvent));
      setIsRegistered(true);
    } catch {}
  };

  const handleWishlist = () => {
    try {
      if (typeof window === 'undefined') return;
      const id = String(eventData?.id || searchParams.get('id') || '');
      const wishRaw = window.localStorage.getItem('wishlist_event_ids');
      let list = wishRaw ? JSON.parse(wishRaw) : [];
      if (list.includes(id)) {
        list = list.filter((x) => x !== id);
        setIsWishlisted(false);
      } else {
        list.push(id);
        setIsWishlisted(true);
      }
      window.localStorage.setItem('wishlist_event_ids', JSON.stringify(list));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="w-full px-6 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{title}</h1>
            <p className="text-gray-600 mt-2">Full event information</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">Back</button>
            <button onClick={() => router.push('/main/1')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700">Go to Dashboard</button>
            {/* Admin-only Edit Post button */}
            {userRole === 'admin' && (
              <button 
                onClick={() => router.push(`/admin/addnewevent?id=${idParam}`)} 
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700"
              >
                Edit Post
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Highlight header without heavy imagery */}
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 opacity-80" />
            <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">Featured Event</span>
                <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{resolved.title}</h2>
                <p className="mt-2 text-gray-700 max-w-2xl">{resolved.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    {dateRangeLabel}
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"/></svg>
                    Capacity: {resolved.total_participants_allowed || '200'}
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-full text-gray-900">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Certificates • Mentorship • Workshops
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                {/* Only show registration buttons for participants */}
                {userRole === 'participant' && (
                  <>
                    <button onClick={handleRegister} disabled={isRegistered} className={`px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md ${isRegistered ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'}`}>{isRegistered ? 'Registered' : 'Register Now'}</button>
                    <button onClick={handleWishlist} className={`px-5 py-2.5 rounded-lg text-sm font-semibold border ${isWishlisted ? 'border-pink-400 text-pink-700 bg-pink-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Event Image */}
            <div className="lg:col-span-1">
              <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                <div className="aspect-[4/3] w-full h-auto">
                  <img src={imageUrl} alt="event" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Detail label="Event Name" value={resolved.title} />
              <Detail label="Start Date" value={resolved.start_date || resolved.date || '-'} />
              <Detail label="End Date" value={resolved.end_date || '-'} />
              <Detail label="Total Allowed" value={resolved.total_participants_allowed || '-'} />
              <Detail label="Description" value={resolved.description || '-'} wide />

              <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-600">Student Coordinators</div>
                <ul className="mt-1 text-sm text-gray-900 list-disc list-inside">
                  {(resolved.student_coordinators || []).filter(c => c.name || c.phone).map((c, i) => (
                    <li key={i}>{c.name} {c.phone && `• ${c.phone}`}</li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-600">Staff Incharge</div>
                <ul className="mt-1 text-sm text-gray-900 list-disc list-inside">
                  {(resolved.staff_incharge || []).filter(s => s.name || s.department).map((s, i) => (
                    <li key={i}>{s.name} {s.department && `• ${s.department}`}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Detail({ label, value, wide = false, isCode = false }) {
  return (
    <div className={`${wide ? 'md:col-span-2' : ''} bg-gray-50 rounded-lg p-4 border border-gray-200`}>
      <div className="text-xs text-gray-600">{label}</div>
      {isCode ? (
        <pre className="text-xs text-gray-900 whitespace-pre-wrap break-words mt-1">{value}</pre>
      ) : (
        <div className="text-sm font-medium text-gray-900 mt-1">{value}</div>
      )}
    </div>
  );
}


