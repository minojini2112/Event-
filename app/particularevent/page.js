'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getEventStatus, getAvailableSlots, formatEventDate } from '../../lib/eventUtils';

export default function ParticularEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch event data from API
  useEffect(() => {
    const fetchEventData = async () => {
      if (!idParam) {
        setError('No event ID provided');
        setLoading(false);
            return;
          }

      try {
        setLoading(true);
        setError('');
        
        // First try to get from localStorage (if coming from main pages)
      const selectedRaw = window.localStorage.getItem('selected_event');
      if (selectedRaw) {
        const selected = JSON.parse(selectedRaw);
          if (selected && String(selected.event_id) === idParam) {
          setEventData(selected);
            setLoading(false);
          return;
        }
      }

        // If not in localStorage, fetch from API
        const response = await fetch(`/api/events/${idParam}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch event details');
        }
        
        const data = await response.json();
        if (data.event) {
          setEventData(data.event);
        } else {
          throw new Error('Event not found');
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err.message || 'Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [idParam]);

  const title = useMemo(() => eventData?.event_name || 'Event Details', [eventData]);
  const [showImageModal, setShowImageModal] = useState(false);

  // Get event status and available slots
  const eventStatus = useMemo(() => {
    if (!eventData) return null;
    return getEventStatus(eventData.start_date, eventData.end_date);
  }, [eventData]);

  const availableSlots = useMemo(() => {
    if (!eventData) return null;
    return getAvailableSlots(eventData.registered_no, eventData.total_participants_allowed);
  }, [eventData]);

  // Debug: Log event data to see what we're working with
  useEffect(() => {
    if (eventData) {
      console.log('Event Data loaded:', eventData);
      console.log('Image URL:', eventData.image_url);
    }
  }, [eventData]);

  // CTA state and handlers
  const [isRegistered, setIsRegistered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [toast, setToast] = useState('');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isConfirmingRegistration, setIsConfirmingRegistration] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  // Toast function
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !idParam) return;
      const regRaw = window.localStorage.getItem('registered_event_ids');
      const wishRaw = window.localStorage.getItem('wishlist_event_ids');
      const reg = regRaw ? JSON.parse(regRaw) : [];
      const wish = wishRaw ? JSON.parse(wishRaw) : [];
      setIsRegistered(Array.isArray(reg) && reg.includes(idParam));
      setIsWishlisted(Array.isArray(wish) && wish.includes(idParam));
    } catch {}
  }, [idParam]);

  // Check if user is already registered for this event from database and wishlist status
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!idParam) return;
      
      try {
        const supabaseUserId = localStorage.getItem('userId');
        if (!supabaseUserId) return;

        // First, get the user's profile to get the correct user_id
        const profileResponse = await fetch(`/api/participants/profile?user_id=${supabaseUserId}`);
        if (!profileResponse.ok) {
          console.error('Failed to fetch user profile for status check');
          return;
        }

        const profileData = await profileResponse.json();
        if (!profileData.profile || !profileData.profile.user_id) {
          console.log('User profile not found, skipping status check');
          return;
        }

        const actualUserId = profileData.profile.user_id;
        console.log('Checking status with user_id:', actualUserId);

        // Check registration status
        const regResponse = await fetch(`/api/participants/check-registration?event_id=${idParam}&participant_id=${actualUserId}`);
        if (regResponse.ok) {
          const regData = await regResponse.json();
          if (regData.isRegistered) {
            setIsRegistered(true);
            // Update localStorage to keep it in sync
            try {
              if (typeof window !== 'undefined') {
                const regRaw = window.localStorage.getItem('registered_event_ids');
                const list = regRaw ? JSON.parse(regRaw) : [];
                if (!list.includes(idParam)) list.push(idParam);
                window.localStorage.setItem('registered_event_ids', JSON.stringify(list));
              }
            } catch {}
          }
        }

        // Check wishlist status
        const wishlistResponse = await fetch('/api/wishlist/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id: idParam,
            user_id: actualUserId
          })
        });

        if (wishlistResponse.ok) {
          const wishlistData = await wishlistResponse.json();
          setIsWishlisted(wishlistData.isWishlisted);
          // Update localStorage to keep it in sync
          try {
            if (typeof window !== 'undefined') {
              const wishRaw = window.localStorage.getItem('wishlist_event_ids');
              let list = wishRaw ? JSON.parse(wishRaw) : [];
              if (wishlistData.isWishlisted && !list.includes(idParam)) {
                list.push(idParam);
              } else if (!wishlistData.isWishlisted && list.includes(idParam)) {
                list = list.filter(id => id !== idParam);
              }
              window.localStorage.setItem('wishlist_event_ids', JSON.stringify(list));
            }
          } catch {}
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    checkUserStatus();
  }, [idParam]);

  const handleRegister = () => {
    // Open registration link in new tab if available
    if (eventData.registration_link) {
      window.open(eventData.registration_link, '_blank');
      // Show confirmation popup
      setShowRegistrationModal(true);
    } else {
      // Fallback to old behavior if no registration link
      try {
        if (typeof window === 'undefined' || !idParam) return;
      const regRaw = window.localStorage.getItem('registered_event_ids');
      const list = regRaw ? JSON.parse(regRaw) : [];
      if (!Array.isArray(list)) return;
        if (!list.includes(idParam)) list.push(idParam);
      window.localStorage.setItem('registered_event_ids', JSON.stringify(list));
      setIsRegistered(true);
    } catch {}
    }
  };

  const handleRegistrationConfirm = async () => {
    try {
      setIsConfirmingRegistration(true);
      
      // First, get the user's profile to get the correct user_id
      const supabaseUserId = localStorage.getItem('userId');
      if (!supabaseUserId) {
        showToast('Please log in to register for events');
        return;
      }

      // Fetch user profile to get the correct user_id
      const profileResponse = await fetch(`/api/participants/profile?user_id=${supabaseUserId}`);
      if (!profileResponse.ok) {
        showToast('Failed to fetch user profile. Please try again.');
        return;
      }

      const profileData = await profileResponse.json();
      if (!profileData.profile || !profileData.profile.user_id) {
        showToast('User profile not found. Please complete your profile first.');
        return;
      }

      const actualUserId = profileData.profile.user_id;
      console.log('Using user_id for registration:', actualUserId);

      // Call API to register the participant
      const response = await fetch('/api/participants/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: idParam,
          participant_id: actualUserId, // Use the correct user_id from profile
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsRegistered(true);
        showToast('Registration confirmed successfully!');
        setShowRegistrationModal(false);
        
        // Update localStorage
        try {
          if (typeof window !== 'undefined') {
            const regRaw = window.localStorage.getItem('registered_event_ids');
            const list = regRaw ? JSON.parse(regRaw) : [];
            if (!list.includes(idParam)) list.push(idParam);
            window.localStorage.setItem('registered_event_ids', JSON.stringify(list));
          }
        } catch {}
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to confirm registration');
      }
    } catch (error) {
      console.error('Error confirming registration:', error);
      showToast('Failed to confirm registration. Please try again.');
    } finally {
      setIsConfirmingRegistration(false);
    }
  };

  const handleRegistrationCancel = () => {
    setShowRegistrationModal(false);
    showToast('Registration not confirmed. Please complete the registration process.');
  };

  const handleWishlist = async () => {
    try {
      if (typeof window === 'undefined' || !idParam) return;
      
      setIsWishlistLoading(true);
      
      const supabaseUserId = localStorage.getItem('userId');
      console.log('Debug - supabaseUserId from localStorage:', supabaseUserId);
      console.log('Debug - idParam:', idParam);
      
      if (!supabaseUserId) {
        showToast('Please log in to manage your wishlist');
        return;
      }

      // Get user profile to get the correct user_id
      const profileResponse = await fetch(`/api/participants/profile?user_id=${supabaseUserId}`);
      if (!profileResponse.ok) {
        showToast('Failed to fetch user profile. Please try again.');
        return;
      }

      const profileData = await profileResponse.json();
      console.log('Debug - Profile response:', profileData);
      console.log('Debug - Profile data structure:', {
        hasProfile: !!profileData.profile,
        profileKeys: profileData.profile ? Object.keys(profileData.profile) : [],
        userId: profileData.profile?.user_id
      });
      
      if (!profileData.profile || !profileData.profile.user_id) {
        showToast('User profile not found. Please complete your profile first.');
        return;
      }

      const actualUserId = profileData.profile.user_id;
      console.log('Debug - actualUserId:', actualUserId, 'idParam:', idParam);

      if (isWishlisted) {
        // Remove from wishlist
        const response = await fetch('/api/wishlist/remove', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_id: idParam,
            user_id: actualUserId
          })
        });

        if (response.ok) {
          setIsWishlisted(false);
          // Update localStorage
          const wishRaw = window.localStorage.getItem('wishlist_event_ids');
          let list = wishRaw ? JSON.parse(wishRaw) : [];
          list = list.filter((x) => x !== idParam);
          window.localStorage.setItem('wishlist_event_ids', JSON.stringify(list));
          showToast('Event removed from wishlist');
        } else {
          showToast('Failed to remove from wishlist. Please try again.');
        }
      } else {
        // Add to wishlist
        const requestBody = {
          event_id: idParam,
          user_id: actualUserId
        };
        console.log('Debug - Sending request body:', requestBody);
        
        const response = await fetch('/api/wishlist/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (response.ok) {
          setIsWishlisted(true);
          // Update localStorage
          const wishRaw = window.localStorage.getItem('wishlist_event_ids');
          let list = wishRaw ? JSON.parse(wishRaw) : [];
          if (!list.includes(idParam)) list.push(idParam);
          window.localStorage.setItem('wishlist_event_ids', JSON.stringify(list));
          showToast('Event added to wishlist');
        } else {
          showToast('Failed to add to wishlist. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error handling wishlist:', error);
      showToast('An error occurred. Please try again.');
    } finally {
      setIsWishlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The event you are looking for could not be found.'}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.back()} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">
              Go Back
            </button>
            <button onClick={() => router.push('/main/2')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700">
              Browse Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{toast}</span>
          </div>
        </div>
      )}

      <header className="w-full px-6 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{title}</h1>
            <p className="text-gray-600 mt-2">Full event information</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">Back</button>
            <button onClick={() => router.push('/main/2')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700">Browse Events</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Motivational Hero */}
        <section className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Level up your skills. Meet mentors. Win prizes.</h2>
              <p className="mt-2 text-white/90 text-sm md:text-base">{eventData.caption || 'Join a vibrant community of builders and creators. Hands-on workshops, exclusive swag, and certificates to boost your portfolio.'}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {/* Registration Button - Only show for upcoming events */}
                {eventStatus?.showRegistration && (
                  <button 
                    onClick={handleRegister} 
                    disabled={isRegistered} 
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md ${
                      isRegistered 
                        ? 'bg-white/20 cursor-not-allowed' 
                        : 'bg-white text-blue-700 hover:bg-blue-50'
                    }`}
                  >
                    {isRegistered ? 'Already Registered' : (
                    eventData.registration_link 
                      ? 'Register Now (External)' 
                      : 'Register Now (Contact Admin)'
                  )}
                </button>
                )}
                
                {/* Event Status Badge */}
                {eventStatus && (
                  <div className={`px-4 py-2.5 rounded-lg text-sm font-semibold border shadow-md ${
                    eventStatus.status === 'upcoming' 
                      ? 'bg-blue-100/30 border-blue-400/40 text-blue-200' 
                      : eventStatus.status === 'live'
                      ? 'bg-green-100/30 border-green-400/40 text-green-200'
                      : 'bg-gray-100/30 border-gray-400/40 text-gray-200'
                  }`}>
                    {eventStatus.message}
                  </div>
                )}
                
                <button 
                  onClick={handleWishlist} 
                  disabled={isWishlistLoading}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold border shadow-md transition-all duration-200 ${
                    isWishlisted 
                      ? 'bg-pink-100/30 border-white/40' 
                      : 'bg-transparent border-white/40 hover:bg-white/10'
                  } ${isWishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isWishlistLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {isWishlisted ? 'Removing...' : 'Adding...'}
                    </div>
                  ) : (
                    isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'
                  )}
                </button>
              </div>
              
              {/* Info message when no registration link - Only show for upcoming events */}
              {!eventData.registration_link && eventStatus?.showRegistration && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">
                      <strong>No registration link available.</strong> Please contact the event administrator for registration instructions.
                    </span>
                  </div>
                </div>
              )}
              
              {/* Status-specific messages */}
              {eventStatus?.status === 'live' && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">
                      <strong>Event is currently live!</strong> Registration is closed as the event is in progress.
                    </span>
                  </div>
                </div>
              )}
              
              {eventStatus?.status === 'ended' && (
                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-800">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">
                      <strong>Event has ended.</strong> Registration is closed as this event has been completed.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>



                 {/* Event Details */}
         <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Event Image */}
            <div className="lg:col-span-1">
              <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => eventData.image_url && setShowImageModal(true)}>
                <div className="aspect-[4/3] w-full h-auto">
                  {/* Main event image - same logic as popup */}
                  {eventData.image_url ? (
                    <img 
                      id="main-event-image"
                      src={eventData.image_url} 
                      alt={eventData.event_name}
                      className="w-full h-full object-cover"

                      onLoad={(e) => {
                        // Image loaded successfully
                      }}
                      onError={(e) => {
                        // Show fallback when image fails
                        e.target.style.display = 'none';
                        const fallback = e.target.nextSibling;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <img 
                      id="main-event-image"
                      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDA2NmZmIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5UZXN0IEltYWdlPC90ZXh0Pgo8L3N2Zz4="
                      alt="Test Image" 
                      className="w-full h-full object-cover"
                      style={{ display: 'block', visibility: 'visible', opacity: '1', backgroundColor: 'blue' }}
                      onLoad={(e) => {
                        console.log('Test SVG loaded successfully');
                        console.log('Image dimensions:', e.target.naturalWidth, 'x', e.target.naturalHeight);
                      }}
                      onError={(e) => {
                        console.log('Test SVG failed to load');
                        console.log('Error details:', e.target.error);
                      }}
                    />
                  )}
                  
                  {/* Fallback when no image or image fails to load */}
                  <div className={`w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center ${eventData.image_url ? 'hidden' : 'flex'}`}>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 text-sm font-medium">Event Image</p>
                      <p className="text-gray-500 text-xs">Click to view details</p>
                </div>
                  </div>
                </div>
                
                {eventData.image_url && (
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3H7.5" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Details */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Detail label="Event Name" value={eventData.event_name || 'N/A'} />
              <Detail label="Start Date" value={eventData.start_date ? formatEventDate(eventData.start_date, 'long') : 'N/A'} />
              <Detail label="End Date" value={eventData.end_date ? formatEventDate(eventData.end_date, 'long') : 'N/A'} />
              <Detail label="Total Participants Allowed" value={eventData.total_participants_allowed || 'Unlimited'} />
              <Detail label="Currently Registered" value={`${eventData.registered_no || 0} participants`} />
              <Detail label="Available Spots" value={availableSlots ? 
                `${availableSlots.available} spots remaining` : 
                'Unlimited spots available'} />
              <Detail label="Description" value={eventData.description || eventData.caption || 'No description available'} wide />
              
              {/* Registration Link */}
              {eventData.registration_link && (
                <Detail label="Registration Link" value={eventData.registration_link} wide isCode />
              )}
              
              {/* Event Status */}
              <div className={`md:col-span-2 rounded-lg p-4 border ${
                eventStatus?.status === 'upcoming' 
                  ? 'bg-blue-50 border-blue-200' 
                  : eventStatus?.status === 'live'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`text-xs font-medium mb-2 ${
                  eventStatus?.status === 'upcoming' 
                    ? 'text-blue-600' 
                    : eventStatus?.status === 'live'
                    ? 'text-green-600'
                    : 'text-gray-600'
                }`}>
                  Event Status
                </div>
                <div className="flex items-center gap-4">
                  {eventStatus?.status === 'upcoming' && (
                    <>
                  <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Registration Open</span>
                  </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">
                          {availableSlots?.available} spots available
                        </span>
                      </div>
                    </>
                  )}
                  
                  {eventStatus?.status === 'live' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-700">Event in Progress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{eventData.registered_no || 0} participants</span>
                      </div>
                    </>
                  )}
                  
                  {eventStatus?.status === 'ended' && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Event Completed</span>
                      </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">{eventData.registered_no || 0} total participants</span>
                  </div>
                    </>
                  )}
              </div>
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

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-4xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button 
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors duration-200 z-10"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Image with error handling */}
            <div className="relative">
              {eventData.image_url ? (
                <img 
                  src={eventData.image_url} 
                  alt={eventData.event_name}
                  className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl"
                  onError={(e) => {
                    console.log('Modal image failed to load:', eventData.image_url);
                    e.target.style.display = 'none';
                    // Show fallback content
                    const fallback = e.target.nextSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                  onLoad={(e) => {
                    console.log('Modal image loaded successfully:', eventData.image_url);
                  }}
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">No Event Image</p>
                    <p className="text-gray-500 text-sm">Image not available</p>
                  </div>
                </div>
              )}
              {/* Fallback content for modal */}
              <div className="hidden w-full h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Image could not be loaded</p>
                  <p className="text-gray-500 text-sm">Please check the image URL</p>
                </div>
              </div>
            </div>
            
            {/* Image info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg">
              <h3 className="text-white font-semibold text-lg">{eventData.event_name}</h3>
              <p className="text-white/80 text-sm">Click outside to close</p>
            </div>
          </div>
        </div>
      )}

      {/* Registration Confirmation Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={() => setShowRegistrationModal(false)}>
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Registration Confirmation</h3>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-gray-700 mb-3">
                You are about to register for <strong>"{eventData.event_name}"</strong>.
              </p>
              <p className="text-gray-600 text-sm">
                Please ensure you have completed the registration process on the external form that opened in the new tab.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> This will update your registration count and mark you as registered for this event.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleRegistrationCancel}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRegistrationConfirm}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isConfirmingRegistration}
              >
                {isConfirmingRegistration ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Confirming...
                  </div>
                ) : (
                  'Confirm Registration'
                )}
              </button>
            </div>
          </div>
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


