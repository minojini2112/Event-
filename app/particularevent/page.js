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

  const safeParseArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error('JSON parse error:', error);
        return [];
      }
    }
    return [];
  };

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
      
      // Check if event is ended and fetch past event details
      if (eventStatus?.status === 'ended') {
        fetchPastEventDetails(eventData.event_id);
      }
    }
  }, [eventData, eventStatus]);

  // CTA state and handlers
  const [isRegistered, setIsRegistered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [toast, setToast] = useState('');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showTeamRegistrationModal, setShowTeamRegistrationModal] = useState(false);
  const [isConfirmingRegistration, setIsConfirmingRegistration] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [eventRegistrationType, setEventRegistrationType] = useState(null);

  // Past event details state
  const [pastEventDetails, setPastEventDetails] = useState(null);
  const [isPastEvent, setIsPastEvent] = useState(false);
  const [pastEventLoading, setPastEventLoading] = useState(false);
  
  // Feedback state
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Toast function
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  // Fetch past event details if event is ended
  const fetchPastEventDetails = async (eventId) => {
    try {
      setPastEventLoading(true);
      const response = await fetch(`/api/events/past-event-details?event_id=${eventId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Past event details received:', data);
        if (data.isPastEvent) {
          console.log('Photos array:', data.pastEvent?.photos);
          console.log('Photo URLs:', data.pastEvent?.photos?.map(photo => photo));
          setPastEventDetails(data.pastEvent);
          setIsPastEvent(true);
        }
      }
    } catch (error) {
      console.error('Error fetching past event details:', error);
    } finally {
      setPastEventLoading(false);
    }
  };

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) return;
    
    try {
      setIsSubmittingFeedback(true);
      
      // Get the user's profile to get the correct user_id
      const supabaseUserId = localStorage.getItem('userId');
      if (!supabaseUserId) {
        showToast('Please log in to submit feedback');
        return;
      }

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
      
      // Submit feedback
      const response = await fetch('/api/events/add-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: idParam,
          participant_id: actualUserId,
          feedback_text: feedbackText.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast(data.message);
        setFeedbackText(''); // Clear the form
        
        // Refresh past event details to show updated feedback
        await fetchPastEventDetails(idParam);
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
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

  // Function to validate image URL
  const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

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

  const handleRegister = async () => {
    try {
      // Always open registration link first if available
    if (eventData.registration_link) {
      window.open(eventData.registration_link, '_blank');
      }
      
      // Get event registration info to determine if it's team or individual
      const response = await fetch(`/api/events/registration-info?event_id=${idParam}`);
      if (response.ok) {
        const data = await response.json();
        setEventRegistrationType(data.event.registration_type);
        
        if (data.event.registration_type === 'team') {
          // Show team registration modal for team events
          setShowTeamRegistrationModal(true);
        } else {
          // Individual event - show regular registration confirmation
      setShowRegistrationModal(true);
        }
    } else {
        // Fallback to regular registration confirmation if API fails
        setShowRegistrationModal(true);
      }
    } catch (error) {
      console.error('Error checking event registration type:', error);
      // Fallback to regular registration confirmation
      setShowRegistrationModal(true);
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
          registration_type: eventRegistrationType || 'individual',
          team_name: eventRegistrationType === 'team' ? teamName : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsRegistered(true);
        showToast('Registration confirmed successfully!');
        setShowRegistrationModal(false);
        
        // Reset team registration state
        if (eventRegistrationType === 'team') {
          setTeamName('');
          setEventRegistrationType(null);
        }
        
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
    
    // Reset team registration state
    if (eventRegistrationType === 'team') {
      setTeamName('');
      setEventRegistrationType(null);
    }
  };

  const handleTeamRegistrationConfirm = async () => {
    if (!teamName.trim()) {
      showToast('Please enter a team name');
      return;
    }
    
    // Close team modal and show regular registration modal
    setShowTeamRegistrationModal(false);
    setShowRegistrationModal(true);
  };

  const handleTeamRegistrationCancel = () => {
    setShowTeamRegistrationModal(false);
    setTeamName('');
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
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-3xl shadow-xl border border-white/60 p-8 backdrop-blur-sm">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Event Details</h3>
              <p className="text-gray-500 text-sm">Complete information about this event</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Event Image */}
            <div className="lg:col-span-1">
              <div className="relative w-full overflow-hidden rounded-2xl border-2 border-white/20 bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]" onClick={() => eventData.image_url && setShowImageModal(true)}>
                <div className="aspect-[3/4] w-full h-auto min-h-[400px]">
                  {/* Main event image */}
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
                  <div className={`w-full h-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center ${eventData.image_url ? 'hidden' : 'flex'}`}>
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-700 text-base font-semibold">Event Image</p>
                      <p className="text-gray-500 text-sm">Click to view details</p>
                    </div>
                  </div>
                </div>
                
                {/* Hover overlay */}
                {eventData.image_url && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform scale-90 hover:scale-100 transition-transform duration-200 shadow-lg">
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3H7.5" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Details Grid */}
            <div className="lg:col-span-2">
              {/* Main Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Detail label="Event Name" value={eventData.event_name || 'N/A'} />
                <Detail label="Start Date" value={eventData.start_date ? formatEventDate(eventData.start_date, 'long') : 'N/A'} />
                <Detail label="End Date" value={eventData.end_date ? formatEventDate(eventData.end_date, 'long') : 'N/A'} />
                <Detail label="Total Participants Allowed" value={eventData.total_participants_allowed || 'Unlimited'} />
                <Detail label="Currently Registered" value={`${eventData.registered_no || 0} participants`} />
                <Detail label="Available Spots" value={availableSlots ? 
                  `${availableSlots.available} spots remaining` : 
                  'Unlimited spots available'} />
              </div>

              {/* Description Card */}
              <div className="mb-6">
                <Detail label="Description" value={eventData.description || eventData.caption || 'No description available'} wide />
              </div>
              
              {/* Registration Link Card */}
              {eventData.registration_link && (
                <div className="mb-6">
                  <Detail label="Registration Link" value={eventData.registration_link} wide isCode />
                </div>
              )}
              
              {/* Enhanced Event Status Card */}
              <div className={`rounded-2xl p-6 border-2 shadow-lg ${
                eventStatus?.status === 'upcoming' 
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200/50' 
                  : eventStatus?.status === 'live'
                  ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200/50'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200/50'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    eventStatus?.status === 'upcoming' 
                      ? 'bg-blue-500' 
                      : eventStatus?.status === 'live'
                      ? 'bg-green-500'
                      : 'bg-gray-500'
                  }`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${
                      eventStatus?.status === 'upcoming' 
                        ? 'text-blue-700' 
                        : eventStatus?.status === 'live'
                        ? 'text-green-700'
                        : 'text-gray-700'
                    }`}>
                      Event Status
                    </div>
                    <div className={`text-lg font-bold ${
                      eventStatus?.status === 'upcoming' 
                        ? 'text-blue-800' 
                        : eventStatus?.status === 'live'
                        ? 'text-green-800'
                        : 'text-gray-800'
                    }`}>
                      {eventStatus?.status === 'upcoming' ? 'Registration Open' : 
                       eventStatus?.status === 'live' ? 'Event in Progress' : 'Event Completed'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eventStatus?.status === 'upcoming' && (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-white/30">
                        <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                        <span className="text-sm font-medium text-blue-800">Registration Open</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-white/30">
                        <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                        <span className="text-sm font-medium text-green-800">
                          {availableSlots?.available} spots available
                        </span>
                      </div>
                    </>
                  )}
                  
                  {eventStatus?.status === 'live' && (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-white/30">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                        <span className="text-sm font-medium text-green-800">Event in Progress</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-white/30">
                        <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                        <span className="text-sm font-medium text-blue-800">{eventData.registered_no || 0} participants</span>
                      </div>
                    </>
                  )}
                  
                  {eventStatus?.status === 'ended' && (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-white/30">
                        <div className="w-3 h-3 bg-gray-500 rounded-full shadow-sm"></div>
                        <span className="text-sm font-medium text-gray-800">Event Completed</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-white/30">
                        <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                        <span className="text-sm font-medium text-blue-800">{eventData.registered_no || 0} total participants</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Student Coordinators & Staff Incharge */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6 mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Event Team</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Coordinators */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-blue-900">Student Coordinators</h4>
              </div>
                                <div className="space-y-2">
                    {eventData.student_coordinators ? (() => {
                      try {
                        const coordinators = typeof eventData.student_coordinators === 'string' 
                          ? JSON.parse(eventData.student_coordinators) 
                          : eventData.student_coordinators;
                        
                        if (Array.isArray(coordinators) && coordinators.length > 0) {
                          return coordinators.map((coordinator, index) => {
                            // Handle if coordinator is an object
                            if (typeof coordinator === 'object' && coordinator !== null) {
                              const name = coordinator.name || 'No Name';
                              const phone = coordinator.phone || 'No Phone';
                              return (
                                <div key={index} className="flex items-center gap-2 text-blue-800">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{name}</span>
                                    <span className="text-xs text-blue-600">{phone}</span>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div key={index} className="flex items-center gap-2 text-blue-800">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span className="text-sm font-medium">{String(coordinator)}</span>
                                </div>
                              );
                            }
                          });
                        } else if (typeof coordinators === 'object' && coordinators !== null) {
                          // Handle single object case
                          const name = coordinators.name || 'No Name';
                          const phone = coordinators.phone || 'No Phone';
                          return (
                            <div className="text-blue-800">
                              <div className="text-sm font-medium">{name}</div>
                              <div className="text-xs text-blue-600">{phone}</div>
                            </div>
                          );
                        } else {
                          return <div className="text-blue-800 text-sm font-medium">{String(coordinators)}</div>;
                        }
                      } catch (e) {
                        return <div className="text-blue-800 text-sm font-medium">{String(eventData.student_coordinators)}</div>;
                      }
                    })() : (
                      <div className="text-blue-600 text-sm italic">Not added</div>
                    )}
                  </div>
            </div>

            {/* Staff Incharge */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-green-900">Staff Incharge</h4>
              </div>
                                <div className="space-y-2">
                    {eventData.staff_incharge ? (() => {
                      try {
                        const staff = typeof eventData.staff_incharge === 'string' 
                          ? JSON.parse(eventData.staff_incharge) 
                          : eventData.staff_incharge;
                        
                        if (Array.isArray(staff) && staff.length > 0) {
                          return staff.map((member, index) => {
                            // Handle if member is an object
                            if (typeof member === 'object' && member !== null) {
                              const name = member.name || 'No Name';
                              const department = member.department || 'No Department';
                              return (
                                <div key={index} className="flex items-center gap-2 text-green-800">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{name}</span>
                                    <span className="text-xs text-green-600">{department}</span>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div key={index} className="flex items-center gap-2 text-green-800">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-sm font-medium">{String(member)}</span>
                                </div>
                              );
                            }
                          });
                        } else if (typeof staff === 'object' && staff !== null) {
                          // Handle single object case
                          const name = staff.name || 'No Name';
                          const department = staff.department || 'No Department';
                          return (
                            <div className="text-green-800">
                              <div className="text-sm font-medium">{name}</div>
                              <div className="text-xs text-green-600">{department}</div>
                            </div>
                          );
                        } else {
                          return <div className="text-green-800 text-sm font-medium">{String(staff)}</div>;
                        }
                      } catch (e) {
                        return <div className="text-green-800 text-sm font-medium">{String(eventData.staff_incharge)}</div>;
                      }
                    })() : (
                      <div className="text-green-600 text-sm italic">Not added</div>
                    )}
                  </div>
            </div>
          </div>
        </div>

        {/* Past Event Details */}
        {isPastEvent && pastEventDetails && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6 mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Event Results & Memories</h3>
            
            {/* Event Details */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Event Summary
              </h4>
              {pastEventDetails.event_details ? (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700">{pastEventDetails.event_details}</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-500 text-sm italic">Not added</p>
                </div>
              )}
            </div>

            {/* Winners */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Winners
              </h4>
              {pastEventDetails.winners && pastEventDetails.winners.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastEventDetails.winners.map((winner, index) => {
                    // Handle if winner is an object
                    const displayText = typeof winner === 'object' && winner !== null
                      ? winner.name || winner.phone || JSON.stringify(winner)
                      : String(winner);
                    
                    return (
                      <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-100 rounded-lg p-4 border border-yellow-200">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-yellow-900">{displayText}</p>
                            <p className="text-yellow-700 text-sm">
                              {index === 0 ? '1st Place' : index === 1 ? '2nd Place' : index === 2 ? '3rd Place' : `${index + 1}th Place`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-500 text-sm italic">Not added</p>
                </div>
              )}
            </div>

            {/* Event Photos - ONLY FIXING THIS SECTION */}
            <div className="mb-8">
                <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">📷</span> Event Photos 
                  {safeParseArray(pastEventDetails.photos).length > 0 && (
                    <span className="ml-2 text-sm text-gray-500">({safeParseArray(pastEventDetails.photos).length} photos)</span>
                  )}
                </h4>
                {safeParseArray(pastEventDetails.photos).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {safeParseArray(pastEventDetails.photos).map((photo, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-w-16 aspect-h-12 bg-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                            style={{
                              display: 'block',
                              backgroundColor: '#f3f4f6'
                            }}
                            onError={(e) => {
                              e.target.style.backgroundColor = '#ef4444';
                              e.target.style.color = 'white';
                              e.target.style.display = 'flex';
                              e.target.style.alignItems = 'center';
                              e.target.style.justifyContent = 'center';
                              e.target.innerHTML = 'Invalid URL';
                            }}
                          />
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-sm text-gray-600">Photo {index + 1}</p>
                          <a 
                            href={photo} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Click to view
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Not added</p>
                )}
              </div>

            {/* Student Feedback */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Student Feedback
              </h4>
              
              {/* Feedback Form for Registered Participants */}
              {isRegistered && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg p-6 border border-blue-200">
                  <h5 className="text-md font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Share Your Experience
                  </h5>
                  <p className="text-blue-700 text-sm mb-4">
                    As a registered participant, you can share your feedback about this event.
                  </p>
                  
                  <div className="space-y-3">
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Share your experience, what you learned, or any suggestions for future events..."
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={4}
                      maxLength={500}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-600">
                        {feedbackText.length}/500 characters
                      </span>
                      <button
                        onClick={handleSubmitFeedback}
                        disabled={!feedbackText.trim() || isSubmittingFeedback}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingFeedback ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Submitting...
                          </div>
                        ) : (
                          'Submit Feedback'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Message for non-registered participants */}
              {!isRegistered && (
                <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-100 rounded-lg p-6 border border-amber-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h5 className="text-md font-semibold text-amber-900">Feedback Not Available</h5>
                  </div>
                  <p className="text-amber-700 text-sm">
                    Only registered participants can submit feedback for this event. If you participated in this event, please make sure you're logged in with the account you used for registration.
                  </p>
                </div>
              )}
              
              {/* Display Existing Feedback */}
              {pastEventDetails.students_feedback && pastEventDetails.students_feedback.length > 0 ? (
                <div className="space-y-4">
                  {pastEventDetails.students_feedback.map((feedback, index) => {
                    // Handle if feedback is an object
                    let displayText = '';
                    let participantInfo = '';
                    
                    if (typeof feedback === 'object' && feedback !== null) {
                      if (feedback.feedback) {
                        displayText = feedback.feedback;
                        participantInfo = `Participant Feedback`;
                        if (feedback.timestamp) {
                          participantInfo += ` • ${new Date(feedback.timestamp).toLocaleDateString()}`;
                        }
                      } else {
                        displayText = feedback.message || feedback.text || feedback.comment || JSON.stringify(feedback);
                        participantInfo = `Student Feedback #${index + 1}`;
                      }
                    } else {
                      displayText = String(feedback);
                      participantInfo = `Student Feedback #${index + 1}`;
                    }
                    
                    return (
                      <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-lg p-4 border border-green-200">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-green-800 text-sm leading-relaxed">"{displayText}"</p>
                            <p className="text-green-600 text-xs mt-2">{participantInfo}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-500 text-sm italic">No feedback submitted yet</p>
                </div>
              )}
            </div>

            {/* Show message if no past event details */}
            {!pastEventDetails.event_details && 
             (!pastEventDetails.winners || pastEventDetails.winners.length === 0) && 
             (!pastEventDetails.photos || pastEventDetails.photos.length === 0) && 
             (!pastEventDetails.students_feedback || pastEventDetails.students_feedback.length === 0) && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No additional details available for this past event.</p>
              </div>
            )}
          </div>
        )}

        {/* Loading state for past event details */}
        {eventStatus?.status === 'ended' && pastEventLoading && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6 mt-8">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <span className="ml-3 text-gray-600">Loading event results...</span>
            </div>
          </div>
        )}
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

      {/* Team Registration Modal */}
      {showTeamRegistrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={() => setShowTeamRegistrationModal(false)}>
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Team Registration</h3>
              <p className="text-sm text-green-600 font-medium">External form opened in new tab</p>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-gray-700 mb-3">
                This is a <strong>team event</strong>. The registration form has been opened in a new tab.
              </p>
              <p className="text-gray-600 text-sm mb-4">
                Please complete the registration form in the new tab, then enter your team name below to confirm.
              </p>
              <div className="mt-4">
                <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 text-left mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter your team name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 text-sm">
                  <strong>Note:</strong> You will be registered as the team leader for this event. Make sure you've completed the external registration form first.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleTeamRegistrationCancel}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleTeamRegistrationConfirm}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200"
              >
                Confirm Team Name
              </button>
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
              {eventRegistrationType === 'team' && teamName && (
                <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-800 text-sm">
                    <strong>Team Event:</strong> You will be registered as the team leader for <strong>"{teamName}"</strong>.
                  </p>
                </div>
              )}
              <p className="text-gray-600 text-sm">
                The registration form has been opened in a new tab. Please ensure you have completed the registration process there.
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
                  eventRegistrationType === 'team' ? 'Confirm Team Registration' : 'Confirm Registration'
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
    <div className={`${wide ? 'md:col-span-2' : ''} bg-gradient-to-br from-white to-gray-50/80 rounded-xl p-5 border border-white/40 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] backdrop-blur-sm`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</div>
      </div>
      {isCode ? (
        <div className="bg-gray-900/5 rounded-lg p-3 border border-gray-200/50">
          <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words font-mono">{value}</pre>
        </div>
      ) : (
        <div className="text-sm font-semibold text-gray-800 mt-1 leading-relaxed">{value}</div>
      )}
    </div>
  );
}


