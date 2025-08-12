'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ParticularEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  const [eventData, setEventData] = useState(null);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
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

  // CTA states
  const [isRegistered, setIsRegistered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [toast, setToast] = useState('');

  // Initialize CTA states from localStorage
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const id = String(eventData?.id || searchParams.get('id') || '0');
      const regRaw = window.localStorage.getItem('registered_event_ids');
      const wishRaw = window.localStorage.getItem('wishlist_event_ids');
      const reg = regRaw ? JSON.parse(regRaw) : [];
      const wish = wishRaw ? JSON.parse(wishRaw) : [];
      setIsRegistered(Array.isArray(reg) && reg.includes(id));
      setIsWishlisted(Array.isArray(wish) && wish.includes(id));
    } catch {}
  }, [eventData, searchParams]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1500);
  };

  const handleRegister = () => {
    try {
      if (typeof window === 'undefined') return;
      const id = String(eventData?.id || searchParams.get('id') || '0');
      const regRaw = window.localStorage.getItem('registered_event_ids');
      const list = regRaw ? JSON.parse(regRaw) : [];
      if (!Array.isArray(list)) return;
      if (!list.includes(id)) list.push(id);
      window.localStorage.setItem('registered_event_ids', JSON.stringify(list));
      setIsRegistered(true);
      showToast("You're in! Registration saved");
    } catch {}
  };

  const handleWishlist = () => {
    try {
      if (typeof window === 'undefined') return;
      const id = String(eventData?.id || searchParams.get('id') || '0');
      const wishRaw = window.localStorage.getItem('wishlist_event_ids');
      let list = wishRaw ? JSON.parse(wishRaw) : [];
      if (!Array.isArray(list)) list = [];
      if (list.includes(id)) {
        list = list.filter((x) => x !== id);
        setIsWishlisted(false);
        showToast('Removed from wishlist');
      } else {
        list.push(id);
        setIsWishlisted(true);
        showToast('Added to wishlist');
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
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Motivational Hero */}
        <section className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Level up your skills. Meet mentors. Win prizes.</h2>
              <p className="mt-2 text-white/90 text-sm md:text-base">Join a vibrant community of builders and creators. Hands-on workshops, exclusive swag, and certificates to boost your portfolio.</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button onClick={handleRegister} disabled={isRegistered} className={`px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md ${isRegistered ? 'bg-white/20 cursor-not-allowed' : 'bg-white text-blue-700 hover:bg-blue-50'} `}>
                  {isRegistered ? 'Registered' : 'Register Now'}
                </button>
                <button onClick={handleWishlist} className={`px-5 py-2.5 rounded-lg text-sm font-semibold border shadow-md ${isWishlisted ? 'bg-pink-100/30 border-white/40' : 'bg-transparent border-white/40 hover:bg-white/10'}`}>
                  {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                </button>
              </div>
            </div>
            <ul className="md:col-span-1 space-y-3">
              <li className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-white/20 inline-flex items-center justify-center">🏆</span><span className="text-sm">Certificates & badges</span></li>
              <li className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-white/20 inline-flex items-center justify-center">🤝</span><span className="text-sm">Network with experts</span></li>
              <li className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-white/20 inline-flex items-center justify-center">🛠️</span><span className="text-sm">Hands‑on workshops</span></li>
            </ul>
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
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


