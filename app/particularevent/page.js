'use client';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getEventStatus, getAvailableSlots, formatEventDate } from '../../lib/eventUtils';

function ParticularEventComponent() {
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

  // When status changes to ended, fetch past results from DB
  useEffect(() => {
    if (eventStatus?.status === 'ended' && (eventData?.event_id || idParam)) {
      fetchPastEventDetails(eventData?.event_id || idParam);
    }
  }, [eventStatus?.status, eventData?.event_id, idParam]);

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

  // Role & access state
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [canEditEvent, setCanEditEvent] = useState(false);

  // Past event details state
  const [pastEventDetails, setPastEventDetails] = useState({});
  const [pastEventLoading, setPastEventLoading] = useState(false);
  const [showPastEventEditor, setShowPastEventEditor] = useState(false);
  const [pastPhotoFiles, setPastPhotoFiles] = useState([]);
  const [uploadingPastImages, setUploadingPastImages] = useState(false);
  const [pastEventSummary, setPastEventSummary] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [selectedWinners, setSelectedWinners] = useState([]);

  // Load registered users for winner selection when admin opens editor
  useEffect(() => {
    const loadRegisteredUsers = async () => {
      try {
        if (!showPastEventEditor || !eventData?.event_id) return;
        const res = await fetch(`/api/participants/registered-users?event_id=${eventData.event_id}`);
        if (res.ok) {
          const json = await res.json();
          setRegisteredUsers(Array.isArray(json.users) ? json.users : []);
        }
      } catch {}
    };
    loadRegisteredUsers();
  }, [showPastEventEditor, eventData]);

  // Prefill winners selection from existing past event details (if available)
  useEffect(() => {
    if (pastEventDetails?.winners) {
      const winnersPrefill = (Array.isArray(pastEventDetails.winners) ? pastEventDetails.winners : [])
        .map((w) => (typeof w === 'object' && w !== null) ? { profile_id: w.profile_id || '', username: w.username || (w.name || '') } : { profile_id: '', username: String(w) })
        .slice(0, 3);
      setSelectedWinners(winnersPrefill);
    }
  }, [pastEventDetails]);
  
  // Feedback state
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Toast function
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  // Load role and userId
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const role = window.localStorage.getItem('role');
      const uid = window.localStorage.getItem('userId');
      setUserRole(role);
      setUserId(uid);
    } catch {}
  }, []);

  const isGlobalAdmin = useMemo(() => userRole === 'global' || userRole === 'global admin', [userRole]);
  const isEventAdmin = useMemo(() => userRole === 'admin', [userRole]);
  const showParticipantCTAs = useMemo(() => !(isGlobalAdmin || isEventAdmin), [isGlobalAdmin, isEventAdmin]);

  // Check if current admin has edit access to this event
  useEffect(() => {
    const checkEditAccess = async () => {
      try {
        if (!eventData || !isEventAdmin || !userId) return;
        const res = await fetch(`/api/events?adminId=${userId}`);
        if (!res.ok) return;
        const json = await res.json();
        const list = Array.isArray(json.events) ? json.events : [];
        const match = list.find((e) => String(e.event_id) === String(eventData.event_id) || e.event_name === eventData.event_name);
        setCanEditEvent(!!match);
      } catch (e) {
        // noop
      }
    };
    checkEditAccess();
  }, [eventData, isEventAdmin, userId]);

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
          // Pre-fill editor fields
          setPastEventSummary(data.pastEvent?.event_details || '');
          setPastWinnersInput(Array.isArray(data.pastEvent?.winners) ? data.pastEvent.winners.map(w => (typeof w === 'object' ? (w.name || JSON.stringify(w)) : String(w))).join('\n') : '');
        } else {
          // Past event with no details yet
          setIsPastEvent(eventStatus?.status === 'ended');
          setPastEventDetails({ photos: [], winners: [], students_feedback: [], event_details: '' });
        }
      }
    } catch (error) {
      console.error('Error fetching past event details:', error);
    } finally {
      setPastEventLoading(false);
    }
  };

  const uploadPastImages = async (files) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const folder = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER;
    if (!cloudName || !uploadPreset) {
      showToast('Image upload is not configured');
      return [];
    }
    setUploadingPastImages(true);
    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', uploadPreset);
          if (folder) formData.append('folder', folder);
          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
          if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Upload failed');
          }
          const data = await response.json();
          return data.secure_url || data.url;
        })
      );
      return uploadedUrls;
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast('Image upload failed');
      return [];
    } finally {
      setUploadingPastImages(false);
    }
  };

  const handleSavePastEventDetails = async () => {
    if (!eventData?.event_id) return;
    try {
      let uploaded = [];
      if (pastPhotoFiles && pastPhotoFiles.length > 0) {
        uploaded = await uploadPastImages(pastPhotoFiles);
      }
      const existing = Array.isArray(pastEventDetails?.photos) ? pastEventDetails.photos : [];
      const photos = [...existing, ...uploaded];
      const winners = selectedWinners.filter(Boolean).map(w => ({ profile_id: w.profile_id, username: w.username }));

      const res = await fetch('/api/events/past-event-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventData.event_id,
          photos,
          winners,
          event_details: pastEventSummary
        })
      });
      if (res.ok) {
        showToast('Past event details saved');
        await fetchPastEventDetails(eventData.event_id);
        setPastPhotoFiles([]);
        setShowPastEventEditor(false);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save details');
      }
    } catch (err) {
      showToast('Failed to save details');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showToast('Event deleted successfully');
        router.push('/main/0'); // Redirect to global admin dashboard
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('Failed to delete event');
    }
  };

  const handleCancelPastEventEdit = () => {
    setShowPastEventEditor(false);
    setPastEventSummary(pastEventDetails?.event_details || '');
    const winnersPrefill = (Array.isArray(pastEventDetails?.winners) ? pastEventDetails.winners : [])
      .map((w) => (typeof w === 'object' && w !== null)
        ? { profile_id: w.profile_id || '', username: w.username || (w.name || '') }
        : { profile_id: '', username: String(w) })
      .slice(0, 3);
    setSelectedWinners(winnersPrefill);
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
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] relative overflow-hidden flex items-center justify-center">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Floating Orbs */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-[#06B6D4]/10 to-[#3B82F6]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-[#3B82F6]/5 to-[#1E40AF]/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-full flex items-center justify-center animate-pulse">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-[#3B82F6] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.001 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-[#3B82F6]/20 to-[#06B6D4]/20 rounded-full blur-2xl animate-pulse"></div>
          </div>
          <p className="text-[#64748B] mt-6 text-lg font-medium">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#EFF6FF] relative overflow-hidden flex items-center justify-center">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none">
          {/* Floating Orbs */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-[#06B6D4]/10 to-[#3B82F6]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-[#3B82F6]/5 to-[#1E40AF]/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="text-center max-w-md mx-auto px-6 relative z-10">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#1E40AF] mb-2">Event Not Found</h2>
          <p className="text-[#64748B] mb-6">{error || 'The event you are looking for could not be found.'}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.back()} className="px-4 py-2 rounded-lg text-sm font-medium border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition-all duration-200">
              Go Back
            </button>
            <button onClick={() => router.push('/main/2')} className="bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-[#1E40AF] hover:to-[#3B82F6] transition-all duration-300 shadow-lg hover:shadow-xl">
              Browse Events
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-[#10B981] to-[#059669] text-white px-6 py-3 rounded-2xl shadow-2xl transform transition-all duration-300 animate-in slide-in-from-top-2 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{toast}</span>
          </div>
        </div>
      )}

      <header className="relative z-50 w-full px-4 sm:px-8 py-4 sm:py-6 bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0]/50 shadow-lg sticky top-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-[#3B82F6] to-[#1E40AF] bg-clip-text text-transparent">{title}</h1>
            <p className="text-sm sm:text-base text-[#64748B] mt-2 font-medium">Full event information and details</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button onClick={() => router.back()} className="group relative px-4 sm:px-6 py-2.5 sm:py-3 text-[#3B82F6] border-2 border-[#3B82F6] rounded-2xl hover:bg-[#EFF6FF] hover:border-[#1E40AF] transition-all duration-300 font-semibold bg-white/80 backdrop-blur-sm overflow-hidden text-sm sm:text-base">
              <span className="relative z-10">Back</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </button>
            <button onClick={() => router.push('/main/2')} className="group relative px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white rounded-2xl hover:from-[#1E40AF] hover:to-[#3B82F6] transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 overflow-hidden text-sm sm:text-base">
              <span className="relative z-10">Browse Events</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Motivational Hero */}
        <section className="mb-8 sm:mb-12 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white rounded-3xl shadow-2xl overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-full translate-y-8 sm:translate-y-12 -translate-x-8 sm:-translate-x-12"></div>
          
          <div className="p-6 sm:p-8 md:p-12 relative z-10">
            <div className="max-w-4xl">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-3 sm:mb-4">Level up your skills. Meet mentors. Win prizes.</h2>
              <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed">{eventData.caption || 'Join a vibrant community of builders and creators. Hands-on workshops, exclusive swag, and certificates to boost your portfolio.'}</p>
              
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                {/* Registration Button - Only for participants (not admins) and upcoming events */}
                {showParticipantCTAs && eventStatus?.showRegistration && (
                  <button 
                    onClick={handleRegister} 
                    disabled={isRegistered} 
                    className={`group relative px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-sm sm:text-base font-bold shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden ${
                      isRegistered 
                        ? 'bg-white/20 border-2 border-white/30 text-white cursor-not-allowed' 
                        : 'bg-white text-[#3B82F6] hover:bg-[#F8FAFC] hover:shadow-2xl'
                    }`}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                    {isRegistered ? (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Already Registered
                        </>
                    ) : (
                        <>
                          {eventData.registration_link 
                      ? 'Register Now (External)' 
                            : 'Register Now (Contact Admin)'}
                        </>
                      )}
                    </span>
                    {!isRegistered && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </button>
                )}
                
                {/* Event Status Badge */}
                {eventStatus && (
                  <div className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl text-sm sm:text-base font-bold border-2 shadow-lg backdrop-blur-sm ${
                    eventStatus.status === 'upcoming' 
                      ? 'bg-white/20 border-white/30 text-white' 
                      : eventStatus.status === 'live'
                      ? 'bg-green-500/20 border-green-400/30 text-green-100'
                      : 'bg-gray-500/20 border-gray-400/30 text-gray-100'
                  }`}>
                    {eventStatus.message}
                  </div>
                )}
                
                {showParticipantCTAs && (
                <button 
                  onClick={handleWishlist} 
                  disabled={isWishlistLoading}
                    className={`group relative px-4 sm:px-6 py-3 sm:py-4 rounded-2xl text-sm sm:text-base font-bold border-2 shadow-lg transition-all duration-300 transform hover:scale-105 overflow-hidden ${
                    isWishlisted 
                        ? 'bg-pink-500/20 border-pink-400/30 text-pink-100' 
                        : 'bg-white/20 border-white/30 hover:bg-white/30'
                  } ${isWishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <span className="relative z-10 flex items-center gap-2">
                  {isWishlistLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {isWishlisted ? 'Removing...' : 'Adding...'}
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        </>
                      )}
                    </span>
                </button>
                )}

                {/* Edit button for event admins with access (only for upcoming/live) */}
                {canEditEvent && eventStatus?.status !== 'ended' && (
                  <button 
                    onClick={() => router.push(`/admin/addnewevent?id=${eventData.event_id}`)}
                    className="group relative px-6 py-4 bg-white/90 text-[#3B82F6] rounded-2xl text-base font-bold shadow-lg hover:bg-white transition-all duration-300 transform hover:scale-105 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    Edit Event
                    </span>
                  </button>
                )}

                {/* Edit button for global admins (only for upcoming/live events) */}
                {isGlobalAdmin && eventStatus?.status !== 'ended' && (
                  <button 
                    onClick={() => router.push(`/admin/addnewevent?id=${eventData.event_id}`)}
                    className="group relative px-6 py-4 bg-white/90 text-[#3B82F6] rounded-2xl text-base font-bold shadow-lg hover:bg-white transition-all duration-300 transform hover:scale-105 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    Edit Event
                    </span>
                  </button>
                )}

                {/* Delete button for global admins */}
                {isGlobalAdmin && (
                  <button 
                    onClick={() => handleDeleteEvent(eventData.event_id)}
                    className="group relative px-6 py-4 bg-red-500/90 text-white rounded-2xl text-base font-bold shadow-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    Delete Event
                    </span>
                  </button>
                )}
              </div>
              
              {/* Success message when already registered */}
              {showParticipantCTAs && eventStatus?.showRegistration && isRegistered && (
                <div className="p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl">
                  <div className="flex items-center gap-3 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-base font-medium">
                      <strong>You are already registered for this event!</strong> No further action is needed.
                    </span>
                  </div>
                </div>
              )}
              
              {/* Info message when no registration link - Only for participants on upcoming events */}
              {showParticipantCTAs && !eventData.registration_link && eventStatus?.showRegistration && !isRegistered && (
                <div className="p-4 bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl">
                  <div className="flex items-center gap-3 text-yellow-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-base font-medium">
                      <strong>No registration link available.</strong> Please contact the event administrator for registration instructions.
                    </span>
                  </div>
                </div>
              )}
              
              {/* Status-specific messages */}
              {eventStatus?.status === 'live' && (
                <div className="p-4 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-2xl">
                  <div className="flex items-center gap-3 text-green-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-base font-medium">
                      <strong>Event is currently live!</strong> Registration is closed as the event is in progress.
                    </span>
                  </div>
                </div>
              )}
              
              {eventStatus?.status === 'ended' && (
                <div className="p-4 bg-gray-500/20 backdrop-blur-sm border border-gray-400/30 rounded-2xl">
                  <div className="flex items-center gap-3 text-gray-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-base font-medium">
                      <strong>Event has ended.</strong> Registration is closed as this event has been completed.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>



        {/* Event Details */}
        <div className="bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-3xl shadow-xl p-6 sm:p-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-r from-[#3B82F6]/5 to-[#06B6D4]/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-r from-[#06B6D4]/5 to-[#3B82F6]/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          {/* Section Header */}
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 relative z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#3B82F6] to-[#1E40AF] bg-clip-text text-transparent">Event Details</h3>
              <p className="text-[#64748B] text-sm sm:text-base font-medium">Complete information about this event</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left: Event Image */}
            <div className="lg:col-span-1">
              <div className="relative w-full overflow-hidden rounded-3xl border-2 border-[#E2E8F0]/30 bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF] cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] group" onClick={() => eventData.image_url && setShowImageModal(true)}>
                <div className="aspect-[3/4] w-full h-auto min-h-[300px] sm:min-h-[400px]">
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
                      onLoad={() => {
                        console.log('Test SVG loaded successfully');
                      }}
                      onError={() => {
                        console.log('Test SVG failed to load');
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
                  <div className="absolute inset-0 bg-gradient-to-t from-[#3B82F6]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform duration-200 shadow-lg">
                      <svg className="w-6 h-6 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
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
              <div className="mb-4 sm:mb-6">
                <Detail label="Description" value={eventData.description || eventData.caption || 'No description available'} wide />
              </div>
              
              {/* Registration Link Card */}
              {eventData.registration_link && (
                <div className="mb-4 sm:mb-6">
                  <Detail label="Registration Link" value={eventData.registration_link} wide isCode />
                </div>
              )}
              
              {/* Enhanced Event Status Card */}
              <div className={`rounded-3xl p-6 sm:p-8 border-2 shadow-xl backdrop-blur-sm ${
                eventStatus?.status === 'upcoming' 
                  ? 'bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 border-[#3B82F6]/30' 
                  : eventStatus?.status === 'live'
                  ? 'bg-gradient-to-r from-[#10B981]/10 to-[#059669]/10 border-[#10B981]/30'
                  : 'bg-gradient-to-r from-[#6B7280]/10 to-[#4B5563]/10 border-[#6B7280]/30'
              }`}>
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                    eventStatus?.status === 'upcoming' 
                      ? 'bg-gradient-to-r from-[#3B82F6] to-[#06B6D4]' 
                      : eventStatus?.status === 'live'
                      ? 'bg-gradient-to-r from-[#10B981] to-[#059669]'
                      : 'bg-gradient-to-r from-[#6B7280] to-[#4B5563]'
                  }`}>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className={`text-xs sm:text-sm font-bold uppercase tracking-wide ${
                      eventStatus?.status === 'upcoming' 
                        ? 'text-[#3B82F6]' 
                        : eventStatus?.status === 'live'
                        ? 'text-[#10B981]'
                        : 'text-[#6B7280]'
                    }`}>
                      Event Status
                    </div>
                    <div className={`text-lg sm:text-xl font-black ${
                      eventStatus?.status === 'upcoming' 
                        ? 'text-[#1E40AF]' 
                        : eventStatus?.status === 'live'
                        ? 'text-[#065F46]'
                        : 'text-[#374151]'
                    }`}>
                      {eventStatus?.status === 'upcoming' ? 'Registration Open' : 
                       eventStatus?.status === 'live' ? 'Event in Progress' : 'Event Completed'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {eventStatus?.status === 'upcoming' && (
                    <>
                      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-sm">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#3B82F6] rounded-full shadow-sm"></div>
                        <span className="text-xs sm:text-sm font-bold text-[#1E40AF]">Registration Open</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-sm">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#10B981] rounded-full shadow-sm"></div>
                        <span className="text-xs sm:text-sm font-bold text-[#065F46]">
                          {availableSlots?.available} spots available
                        </span>
                      </div>
                    </>
                  )}
                  
                  {eventStatus?.status === 'live' && (
                    <>
                      <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-sm">
                        <div className="w-3 h-3 bg-[#10B981] rounded-full animate-pulse shadow-sm"></div>
                        <span className="text-sm font-bold text-[#065F46]">Event in Progress</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-sm">
                        <div className="w-3 h-3 bg-[#3B82F6] rounded-full shadow-sm"></div>
                        <span className="text-sm font-bold text-[#1E40AF]">{eventData.registered_no || 0} participants</span>
                      </div>
                    </>
                  )}
                  
                  {eventStatus?.status === 'ended' && (
                    <>
                      <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-sm">
                        <div className="w-3 h-3 bg-[#6B7280] rounded-full shadow-sm"></div>
                        <span className="text-sm font-bold text-[#374151]">Event Completed</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-sm">
                        <div className="w-3 h-3 bg-[#3B82F6] rounded-full shadow-sm"></div>
                        <span className="text-sm font-bold text-[#1E40AF]">{eventData.registered_no || 0} total participants</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Student Coordinators & Staff Incharge */}
        <div className="bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-3xl shadow-xl p-6 sm:p-8 mb-8 sm:mb-12 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#3B82F6]/5 to-[#06B6D4]/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-[#06B6D4]/5 to-[#3B82F6]/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-2xl flex items-center justify-center shadow-xl">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#1E40AF]">Event Team</h3>
                <p className="text-[#64748B] text-base sm:text-lg font-medium">Meet the organizers and coordinators</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Student Coordinators */}
              <div className="bg-gradient-to-br from-[#3B82F6]/10 to-[#06B6D4]/10 rounded-3xl p-6 sm:p-8 border border-[#3B82F6]/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                  <h4 className="text-xl sm:text-2xl font-black text-[#1E40AF]">Student Coordinators</h4>
              </div>
                <div className="space-y-3 sm:space-y-4">
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
                              <div key={index} className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-white/30">
                                <div className="w-3 h-3 bg-[#3B82F6] rounded-full shadow-sm"></div>
                                  <div className="flex flex-col">
                                  <span className="text-base font-bold text-[#1E40AF]">{name}</span>
                                  <span className="text-sm text-[#64748B]">{phone}</span>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                              <div key={index} className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-white/30">
                                <div className="w-3 h-3 bg-[#3B82F6] rounded-full shadow-sm"></div>
                                <span className="text-base font-bold text-[#1E40AF]">{String(coordinator)}</span>
                                </div>
                              );
                            }
                          });
                        } else if (typeof coordinators === 'object' && coordinators !== null) {
                          // Handle single object case
                          const name = coordinators.name || 'No Name';
                          const phone = coordinators.phone || 'No Phone';
                          return (
                          <div className="p-4 bg-white/50 rounded-2xl border border-white/30">
                            <div className="text-base font-bold text-[#1E40AF]">{name}</div>
                            <div className="text-sm text-[#64748B]">{phone}</div>
                            </div>
                          );
                        } else {
                        return <div className="text-base font-bold text-[#1E40AF]">{String(coordinators)}</div>;
                        }
                      } catch (e) {
                      return <div className="text-base font-bold text-[#1E40AF]">{String(eventData.student_coordinators)}</div>;
                      }
                    })() : (
                    <div className="text-[#64748B] text-base italic">Not added</div>
                    )}
                  </div>
            </div>

            {/* Staff Incharge */}
              <div className="bg-gradient-to-br from-[#10B981]/10 to-[#059669]/10 rounded-3xl p-6 sm:p-8 border border-[#10B981]/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-[#10B981] to-[#059669] rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
                  </svg>
                </div>
                  <h4 className="text-xl sm:text-2xl font-black text-[#065F46]">Staff Incharge</h4>
              </div>
                <div className="space-y-3 sm:space-y-4">
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
                              <div key={index} className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-white/30">
                                <div className="w-3 h-3 bg-[#10B981] rounded-full shadow-sm"></div>
                                  <div className="flex flex-col">
                                  <span className="text-base font-bold text-[#065F46]">{name}</span>
                                  <span className="text-sm text-[#64748B]">{department}</span>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                              <div key={index} className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-white/30">
                                <div className="w-3 h-3 bg-[#10B981] rounded-full shadow-sm"></div>
                                <span className="text-base font-bold text-[#065F46]">{String(member)}</span>
                                </div>
                              );
                            }
                          });
                        } else if (typeof staff === 'object' && staff !== null) {
                          // Handle single object case
                          const name = staff.name || 'No Name';
                          const department = staff.department || 'No Department';
                          return (
                          <div className="p-4 bg-white/50 rounded-2xl border border-white/30">
                            <div className="text-base font-bold text-[#065F46]">{name}</div>
                            <div className="text-sm text-[#64748B]">{department}</div>
                            </div>
                          );
                        } else {
                        return <div className="text-base font-bold text-[#065F46]">{String(staff)}</div>;
                        }
                      } catch (err) {
                      return <div className="text-base font-bold text-[#065F46]">{String(eventData.staff_incharge)}</div>;
                      }
                    })() : (
                    <div className="text-[#64748B] text-base italic">Not added</div>
                    )}
                </div>
                  </div>
            </div>
          </div>
        </div>

        {/* Past Event Details */}
        {eventStatus?.status === 'ended' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Event Results & Memories</h3>
              {(((isEventAdmin && canEditEvent) || isGlobalAdmin) && eventStatus?.status === 'ended') && (
                showPastEventEditor ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSavePastEventDetails}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelPastEventEdit}
                      className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPastEventEditor(true)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                  >
                    Edit Details
                  </button>
                )
              )}
            </div>
            
            {/* Event Details */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Event Summary
              </h4>
              {showPastEventEditor ? (
                <textarea
                  value={pastEventSummary}
                  onChange={(e) => setPastEventSummary(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Describe what happened during the event"
                />
              ) : (
                pastEventDetails.event_details ? (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700">{pastEventDetails.event_details}</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-500 text-sm italic">Not added</p>
                </div>
                )
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
              {showPastEventEditor ? (
                registeredUsers.length > 0 ? (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select winners (any number)</label>
                    <select
                      multiple
                      value={selectedWinners.map(w => String(w?.profile_id || ''))}
                      onChange={(e) => {
                        const options = Array.from(e.target.selectedOptions).map(o => o.value);
                        const chosen = registeredUsers.filter(u => options.includes(String(u.profile_id)));
                        setSelectedWinners(chosen);
                      }}
                      className="w-full px-3 py-2 border rounded-lg h-36"
                    >
                      {registeredUsers.map(u => (
                        <option key={u.profile_id} value={u.profile_id}>{u.username}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">No registered users found.</div>
                )
              ) : (
                pastEventDetails.winners && pastEventDetails.winners.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastEventDetails.winners.map((winner, index) => {
                    const displayText = typeof winner === 'object' && winner !== null
                        ? (winner.username || winner.name || winner.phone || JSON.stringify(winner))
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
                )
              )}
            </div>

            {/* Removed CTA banner for missing past event details */}

            {/* Inline editor removed in favor of per-field editing above */}

            {/* Event Photos */}
            <div className="mb-8">
                <h4 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">📷</span> Event Photos 
                  {safeParseArray(pastEventDetails.photos).length > 0 && (
                    <span className="ml-2 text-sm text-gray-500">({safeParseArray(pastEventDetails.photos).length} photos)</span>
                  )}
                </h4>
                {showPastEventEditor && (
                  <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add photos</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setPastPhotoFiles(Array.from(e.target.files || []))}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    {pastPhotoFiles && pastPhotoFiles.length > 0 && (
                      <div className="text-xs text-gray-600 mt-2">{pastPhotoFiles.length} new photo(s) selected. They will be added on Save.</div>
                    )}
                    {uploadingPastImages && <div className="text-xs text-gray-600 mt-1">Uploading...</div>}
                  </div>
                )}
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
              
              {/* Message for non-registered participants (hide for admins/global) */}
              {!isRegistered && !isEventAdmin && !isGlobalAdmin && (
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
                    Only registered participants can submit feedback for this event. If you participated in this event, please make sure you&apos;re logged in with the account you used for registration.
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
                            <p className="text-green-800 text-sm leading-relaxed">&quot;{displayText}&quot;</p>
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

            {/* Removed placeholder when no past event details */}
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
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4" onClick={(ev) => ev.stopPropagation()}>
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
                  onChange={(ev) => setTeamName(ev.target.value)}
                  placeholder="Enter your team name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 text-sm">
                  <strong>Note:</strong> You will be registered as the team leader for this event. Make sure you&apos;ve completed the external registration form first.
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
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-md w-full mx-4" onClick={(ev) => ev.stopPropagation()}>
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
                You are about to register for <strong>&quot;{eventData.event_name}&quot;</strong>.
              </p>
              {eventRegistrationType === 'team' && teamName && (
                <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-800 text-sm">
                    <strong>Team Event:</strong> You will be registered as the team leader for <strong>&quot;{teamName}&quot;</strong>.
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

// Loading component
function LoadingComponent() {
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
          Loading Event Details...
        </h2>
        <p className="mt-2 text-[#64748B]">Please wait while we fetch the event information</p>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function ParticularEventPage() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <ParticularEventComponent />
    </Suspense>
  );
}

function Detail({ label, value, wide = false, isCode = false }) {
  return (
    <div className={`${wide ? 'md:col-span-2' : ''} bg-white/80 backdrop-blur-sm border border-[#E2E8F0]/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-r from-[#3B82F6]/5 to-[#06B6D4]/5 rounded-full -translate-y-8 translate-x-8"></div>
      
      <div className="flex items-center gap-3 mb-3 relative z-10">
        <div className="w-3 h-3 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-full shadow-sm"></div>
        <div className="text-sm font-bold text-[#64748B] uppercase tracking-wide">{label}</div>
      </div>
      {isCode ? (
        <div className="bg-[#1E40AF]/5 rounded-xl p-4 border border-[#3B82F6]/20 relative z-10">
          <pre className="text-sm text-[#1E40AF] whitespace-pre-wrap break-words font-mono font-semibold">{value}</pre>
        </div>
      ) : (
        <div className="text-base font-semibold text-[#334155] mt-2 leading-relaxed relative z-10">{value}</div>
      )}
    </div>
  );
}


