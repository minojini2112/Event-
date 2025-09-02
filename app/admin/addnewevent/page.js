'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AddNewEventComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('id');
  const isEditMode = !!eventId;

  const [isEditing, setIsEditing] = useState(true);
  const [form, setForm] = useState({
    registered_count: 0,
    event_name: '',
    description: '',
    caption: '',
    start_date: '',
    end_date: '',
    images: [], // File[]
    image_urls: [], // string[]
    student_coordinators: [{ name: '', phone: '' }],
    staff_incharge: [{ name: '', department: '' }],
    total_participants_allowed: '',
    registration_link: '',
    registration_type: 'individual' // 'individual' or 'team'
  });

  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved
  const [postStatus, setPostStatus] = useState('idle'); // idle | posting | posted
  const [isPostPopupOpen, setIsPostPopupOpen] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isNameLocked, setIsNameLocked] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [requestEventName, setRequestEventName] = useState('');
  const [isSubmittingAccessRequest, setIsSubmittingAccessRequest] = useState(false);
  const [latestRequest, setLatestRequest] = useState(null); // {status, event_name}

  // Check if user is global admin
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

  const loadExistingEvent = useCallback(async () => {
    try {
      if (!eventId) return;
      // Always fetch from DB for edit mode
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) {
        console.error('Failed to fetch event from DB');
        return;
      }
      const json = await res.json();
      const ev = json.event;
      if (!ev) return;
      setForm({
        registered_count: ev.registered_no ?? 0,
        event_name: ev.event_name || '',
        description: ev.description || '',
        caption: ev.caption || '',
        start_date: ev.start_date || '',
        end_date: ev.end_date || '',
        images: [],
        image_urls: ev.image_url ? [ev.image_url] : [],
        student_coordinators: Array.isArray(ev.student_coordinators) ? ev.student_coordinators : (ev.student_coordinators ? [ev.student_coordinators] : [{ name: '', phone: '' }]),
        staff_incharge: Array.isArray(ev.staff_incharge) ? ev.staff_incharge : (ev.staff_incharge ? [ev.staff_incharge] : [{ name: '', department: '' }]),
        total_participants_allowed: ev.total_participants_allowed || '',
        registration_link: ev.registration_link || '',
        registration_type: ev.registration_type || 'individual'
      });
    } catch (e) {
      console.error('Failed to load existing event:', e);
    }
  }, [eventId]);

  // Load existing event data if in edit mode
  useEffect(() => {
    if (isEditMode && typeof window !== 'undefined') {
      loadExistingEvent();
    }
  }, [isEditMode, loadExistingEvent]);

  // Prefill event name from approved access flow and lock the field
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const approvedName = window.localStorage.getItem('approved_event_name');
    if (approvedName && !isEditMode) {
      setForm((prev) => ({ ...prev, event_name: approvedName }));
      setIsNameLocked(true);
    }
  }, [isEditMode]);

  // Check if user is global admin
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userRole = window.localStorage.getItem('role');
    const isGlobal = userRole === 'global' || userRole === 'global admin';
    setIsGlobalAdmin(isGlobal);
  }, []);

  // If name not pre-approved via localStorage, check access backend directly
  useEffect(() => {
    const maybeCheckAccess = async () => {
      if (isEditMode) return;
      if (isNameLocked) return;
      try {
        const adminUserId = typeof window !== 'undefined' ? window.localStorage.getItem('userId') : null;
        if (!adminUserId) return;
        setIsCheckingAccess(true);
        setAccessError('');
        // Pull latest request to show pending/rejected info
        try {
          const latestRes = await fetch(`/api/access-requests/my-latest?adminUserId=${adminUserId}`);
          if (latestRes.ok) {
            const latestJson = await latestRes.json();
            setLatestRequest(latestJson.latest || null);
          }
        } catch {}
        const res = await fetch(`/api/access-requests/check-access?adminUserId=${adminUserId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data?.hasAccess && data?.approvedEventName) {
          try {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('approved_event_name', data.approvedEventName);
            }
          } catch {}
          setForm((prev) => ({ ...prev, event_name: data.approvedEventName }));
          setIsNameLocked(true);
        }
      } catch {
        setAccessError('Unable to check access at the moment.');
      } finally {
        setIsCheckingAccess(false);
      }
    };
    maybeCheckAccess();
  }, [isEditMode, isNameLocked]);

  const handleSubmitAccessRequest = async () => {
    try {
      const adminUserId = typeof window !== 'undefined' ? window.localStorage.getItem('userId') : null;
      const username = typeof window !== 'undefined' ? window.localStorage.getItem('username') : null;
      if (!adminUserId || !username) {
        alert('User not found. Please log in again.');
        return;
      }
      if (!requestEventName.trim()) {
        alert('Please enter an event name to request access.');
        return;
      }
      setIsSubmittingAccessRequest(true);
      const response = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: requestEventName.trim(), adminUserId })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data?.error || 'Failed to submit request');
        return;
      }
      alert('Access request submitted! A global admin will review it.');
      setRequestEventName('');
    } catch {
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmittingAccessRequest(false);
    }
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateArrayField = (key, index, field, value) => {
    setForm((prev) => {
      const copy = [...prev[key]];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, [key]: copy };
    });
  };

  // Prepare a minimal event object for the main feeds (admin/participant)
  const buildEventForFeed = (draft) => {
    return {
      id: Date.now(),
      title: draft.event_name || 'Untitled Event',
      date: draft.start_date || new Date().toISOString().slice(0, 10),
      description: draft.description || '',
      caption: draft.caption || '',
      image_urls: Array.isArray(draft.image_urls) ? draft.image_urls : [],
      // Extra details for "View More" screens
      start_date: draft.start_date || '',
      end_date: draft.end_date || '',
      total_participants_allowed: draft.total_participants_allowed || '',
      student_coordinators: Array.isArray(draft.student_coordinators) ? draft.student_coordinators : [],
      staff_incharge: Array.isArray(draft.staff_incharge) ? draft.staff_incharge : [],
      registration_link: draft.registration_link || '',
      registration_type: draft.registration_type || 'individual'
    };
  };

  const addRow = (key, emptyRow) => {
    setForm((prev) => ({ ...prev, [key]: [...prev[key], emptyRow] }));
  };

  const removeRow = (key, index) => {
    setForm((prev) => {
      const next = prev[key].filter((_, i) => i !== index);
      return { ...prev, [key]: next.length ? next : [key === 'student_coordinators' ? { name: '', phone: '' } : { name: '', department: '' }] };
    });
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.event_name.trim()) nextErrors.event_name = 'Event name is required';
    if (!form.start_date) nextErrors.start_date = 'Start date is required';
    if (!form.end_date) nextErrors.end_date = 'End date is required';
    if (form.start_date && form.end_date && new Date(form.end_date) < new Date(form.start_date)) {
      nextErrors.end_date = 'End date must be after start date';
    }
    if (form.total_participants_allowed && Number.isNaN(Number(form.total_participants_allowed))) {
      nextErrors.total_participants_allowed = 'Must be a number';
    }
    // Validate registration link if provided
    if (form.registration_link && !isValidUrl(form.registration_link)) {
      nextErrors.registration_link = 'Please enter a valid URL';
    }
    // Basic validation for arrays
    form.student_coordinators.forEach((c, i) => {
      if (!c.name || !c.phone) {
        nextErrors[`student_${i}`] = 'Name and phone are required';
      }
    });
    form.staff_incharge.forEach((s, i) => {
      if (!s.name || !s.department) {
        nextErrors[`staff_${i}`] = 'Name and department are required';
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Helper function to validate URLs
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  // Client-side image upload helper (Cloudinary unsigned)
  const uploadImages = async (files) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const folder = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER;
    if (!cloudName || !uploadPreset) {
      alert('Image upload is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.');
      return [];
    }
    setUploadingImages(true);
    try {
      const uploadedUrls = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', uploadPreset);
          if (folder) formData.append('folder', folder);
          const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) {
            const text = await response.text();
            throw new Error(text || 'Upload failed');
          }
          const data = await response.json();
          return data.secure_url || data.url;
        })
      );
      return uploadedUrls;
    } catch (e) {
      console.error('Image upload failed:', e);
      alert('Image upload failed. Check your Cloudinary configuration.');
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaveStatus('saving');
    // TODO: Replace with real API call
    await new Promise((r) => setTimeout(r, 600));
    setSaveStatus('saved');
    setIsEditing(false);
  };

  const handleConfirmPost = async () => {
    setPostStatus('posting');
    try {
      // Upload images first and collect URLs
      let imageUrls = Array.isArray(form.image_urls) ? [...form.image_urls] : [];
      if (form.images && form.images.length > 0) {
        const uploaded = await uploadImages(form.images);
        if (uploaded.length > 0) {
          imageUrls = [...imageUrls, ...uploaded];
          // reflect in UI for view mode
          updateField('image_urls', imageUrls);
        }
      }

      // Prepare clean payload for API (exclude File objects)
      const payload = {
        event_name: form.event_name,
        description: form.description,
        caption: form.caption || null,
        start_date: form.start_date,
        end_date: form.end_date || null,
        registered_count: form.registered_count ?? null,
        total_participants_allowed: form.total_participants_allowed ? Number(form.total_participants_allowed) : null,
        registration_link: form.registration_link || null,
        registration_type: form.registration_type || 'individual',
        student_coordinators: Array.isArray(form.student_coordinators) ? form.student_coordinators : [],
        staff_incharge: Array.isArray(form.staff_incharge) ? form.staff_incharge : [],
        image_urls: imageUrls
      };

      // Call the API to create or update event in database
      const apiResponse = await (isEditMode
        ? fetch(`/api/events/${eventId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        : fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
      );

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      const result = await apiResponse.json();
      console.log('Event saved successfully:', result);

      // Also persist to localStorage for backward compatibility
      const key = 'posted_events';
      const nextEvent = buildEventForFeed(form);
      
      // Optionally sync to localStorage (best-effort)
      try {
        const existing = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
        let list = existing ? JSON.parse(existing) : [];
        if (isEditMode) {
          const idx = list.findIndex(e => String(e.id) === String(eventId));
          nextEvent.id = eventId;
          if (idx !== -1) list[idx] = nextEvent; else list.push(nextEvent);
        } else {
          list.push(nextEvent);
        }
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(list));
        }
      } catch {}
      
      setPostStatus('posted');
      setIsPostPopupOpen(true);
      // Clear the approved name so future clicks prompt for access again
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('approved_event_name');
        }
      } catch {}
      // Navigate after a short delay to let user see the popup
      setTimeout(() => {
        router.push('/main/1');
      }, 1200);
    } catch (err) {
      console.error('Failed to post event:', err);
      setPostStatus('idle');
      // You could add error handling UI here
      alert(`Failed to create event: ${err.message}`);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }
      alert('Event deleted successfully!');
      setPostStatus('posted'); // Simulate post status for redirection
      setIsPostPopupOpen(true);
      setTimeout(() => {
        router.push('/main/1');
      }, 1200);
    } catch (err) {
      console.error('Failed to delete event:', err);
      alert(`Failed to delete event: ${err.message}`);
    }
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

      <header className="relative z-50 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-white/80 backdrop-blur-xl border-b border-[#E2E8F0]/50 shadow-lg sticky top-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-[#3B82F6] to-[#1E40AF] bg-clip-text text-transparent">
                  {isEditMode ? 'Edit Event' : 'Add New Event'}
                </h1>
                <p className="text-[#64748B] mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg font-medium">
                  {isEditMode ? 'Update event information and details' : 'Create and publish a new event'}
                </p>
              </div>
            </div>
            
            {/* Back Navigation Button */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push('/main/1')} 
                className="group relative px-4 sm:px-6 py-2 sm:py-3 text-[#3B82F6] border-2 border-[#3B82F6] rounded-2xl hover:bg-[#EFF6FF] hover:border-[#1E40AF] transition-all duration-300 font-semibold bg-white/80 backdrop-blur-sm overflow-hidden text-sm sm:text-base w-full sm:w-auto"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="hidden sm:inline">Back to Main</span>
                  <span className="sm:hidden">Back</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Access gating cards for admins without approval */}
        {!isEditMode && !isNameLocked && !isGlobalAdmin && (
          latestRequest && latestRequest.status === 'pending' ? (
            <div className="mb-6 sm:mb-8 bg-gradient-to-br from-[#FEF3C7]/80 to-[#FDE68A]/80 rounded-3xl border border-[#F59E0B]/30 p-4 sm:p-6 lg:p-8 backdrop-blur-sm shadow-xl">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white shadow-lg flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-[#92400E] mb-2">Access request pending</h3>
                  <p className="text-[#B45309] text-sm sm:text-base leading-relaxed">
                    You already have a pending request for <span className="font-bold">{latestRequest.event_name}</span>. Please wait until it is accepted or rejected.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 sm:mb-8 bg-gradient-to-br from-[#FEF3C7]/80 to-[#FDE68A]/80 rounded-3xl border border-[#F59E0B]/30 p-4 sm:p-6 lg:p-8 backdrop-blur-sm shadow-xl relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-[#F59E0B]/10 to-[#D97706]/10 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
              
              <div className="flex items-start gap-3 sm:gap-4 relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white shadow-lg flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-[#92400E] mb-2">Request access to create a new event</h3>
                  <p className="text-[#B45309] text-sm sm:text-base leading-relaxed mb-4">Submit your event name for approval. Once approved, the name will be auto-filled and locked in this form.</p>
                  
                  {isCheckingAccess && (
                    <div className="mb-4 p-3 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 text-[#B45309] font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin"></div>
                        Checking approval status...
                      </div>
                    </div>
                  )}
                  
                  {accessError && (
                    <div className="mb-4 p-3 bg-red-500/10 backdrop-blur-sm rounded-2xl border border-red-500/20 text-red-700 font-medium">
                      {accessError}
                    </div>
                  )}
                  
                  {latestRequest && latestRequest.status === 'rejected' && (
                    <div className="mb-4 p-4 bg-red-500/10 backdrop-blur-sm rounded-2xl border border-red-500/20">
                      <p className="text-red-700 text-sm font-medium">
                      <span>Your previous request for </span>
                        <span className="font-bold">{latestRequest.event_name}</span>
                      <span> was rejected. You may submit a new request.</span>
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                    <input
                      type="text"
                      value={requestEventName}
                      onChange={(e) => setRequestEventName(e.target.value)}
                      placeholder="Proposed event name"
                      className="flex-1 text-sm sm:text-base rounded-2xl border-2 border-[#F59E0B]/30 ring-1 ring-[#F59E0B]/20 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/80 backdrop-blur-sm text-[#92400E] placeholder-[#B45309]/60 focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] transition-all duration-200 font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleSubmitAccessRequest}
                      disabled={isSubmittingAccessRequest}
                      className="group relative px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-2xl text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span className="relative z-10">
                        {isSubmittingAccessRequest ? 'Submitting...' : 'Request Access'}
                      </span>
                      {!isSubmittingAccessRequest && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
        {/* Editor (gated until approval for new events, or always visible for global admins) */}
        {(isEditMode || isNameLocked || isGlobalAdmin) ? (
          isEditing ? (
          <div className="bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-[#3B82F6]/5 to-[#06B6D4]/5 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-[#06B6D4]/5 to-[#3B82F6]/5 rounded-full translate-y-10 sm:translate-y-12 -translate-x-10 sm:-translate-x-12"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 relative z-10">
              {/* Registered Count (read only dummy for now) */}
              <div className="flex flex-col">
                <label className="text-sm font-bold text-[#64748B] mb-2 uppercase tracking-wide">Registered Count</label>
                <input 
                  value={form.registered_count} 
                  readOnly 
                  className="text-base rounded-2xl border-2 border-[#E2E8F0]/50 ring-1 ring-[#E2E8F0]/30 px-4 py-3 bg-[#F8FAFC]/80 backdrop-blur-sm text-[#64748B] font-medium cursor-not-allowed" 
                />
              </div>

              {/* Event Name */}
              <div className="flex flex-col">
                <label className="text-sm font-bold text-[#64748B] mb-2 uppercase tracking-wide">Event Name</label>
                <input
                  value={form.event_name}
                  onChange={(e) => updateField('event_name', e.target.value)}
                  readOnly={isNameLocked || isEditMode}
                  disabled={isNameLocked || isEditMode}
                  placeholder="Enter event name"
                  className={`text-base rounded-2xl border-2 px-4 py-3 bg-white/80 backdrop-blur-sm ring-1 text-[#334155] placeholder-[#94A3B8] transition-all duration-200 font-medium ${
                    errors.event_name 
                      ? 'border-red-400 ring-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                      : 'border-[#E2E8F0]/50 ring-[#E2E8F0]/30 focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]'
                  } ${(isNameLocked || isEditMode) ? 'bg-[#F1F5F9]/80 cursor-not-allowed' : 'hover:border-[#3B82F6]/50'}`}
                />
                {errors.event_name && <span className="text-sm text-red-600 mt-2 font-medium">{errors.event_name}</span>}
              </div>

              {/* Caption */}
              <div className="flex flex-col">
                <label className="text-sm font-bold text-[#64748B] mb-2 uppercase tracking-wide">Caption</label>
                <input
                  value={form.caption}
                  onChange={(e) => updateField('caption', e.target.value)}
                  placeholder="Short caption shown in lists"
                  className="text-base rounded-2xl border-2 border-[#E2E8F0]/50 ring-1 ring-[#E2E8F0]/30 px-4 py-3 bg-white/80 backdrop-blur-sm text-[#334155] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all duration-200 font-medium hover:border-[#3B82F6]/50"
                />
              </div>

              {/* Start Date */}
              <div className="flex flex-col">
                <label className="text-sm font-bold text-[#64748B] mb-2 uppercase tracking-wide">Start Date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => updateField('start_date', e.target.value)}
                  className={`text-base rounded-2xl border-2 px-4 py-3 bg-white/80 backdrop-blur-sm ring-1 text-[#334155] transition-all duration-200 font-medium ${
                    errors.start_date 
                      ? 'border-red-400 ring-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                      : 'border-[#E2E8F0]/50 ring-[#E2E8F0]/30 focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]'
                  } hover:border-[#3B82F6]/50`}
                />
                {errors.start_date && <span className="text-sm text-red-600 mt-2 font-medium">{errors.start_date}</span>}
              </div>

              {/* End Date */}
              <div className="flex flex-col">
                <label className="text-sm font-bold text-[#64748B] mb-2 uppercase tracking-wide">End Date</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => updateField('end_date', e.target.value)}
                  className={`text-base rounded-2xl border-2 px-4 py-3 bg-white/80 backdrop-blur-sm ring-1 text-[#334155] transition-all duration-200 font-medium ${
                    errors.end_date 
                      ? 'border-red-400 ring-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                      : 'border-[#E2E8F6]/50 ring-[#E2E8F0]/30 focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]'
                  } hover:border-[#3B82F6]/50`}
                />
                {errors.end_date && <span className="text-sm text-red-600 mt-2 font-medium">{errors.end_date}</span>}
              </div>

              {/* Images Upload */}
              <div className="flex flex-col lg:col-span-2">
                <label className="text-sm font-bold text-[#64748B] mb-2 uppercase tracking-wide">Images</label>
                <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    updateField('images', files);
                  }}
                    className="w-full text-sm sm:text-base rounded-2xl border-2 border-[#E2E8F0]/50 ring-1 ring-[#E2E8F0]/30 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/80 backdrop-blur-sm text-[#334155] focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all duration-200 font-medium hover:border-[#3B82F6]/50 cursor-pointer"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 pointer-events-none">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                
                {uploadingImages && (
                  <div className="mt-4 p-3 bg-[#3B82F6]/10 backdrop-blur-sm rounded-2xl border border-[#3B82F6]/20 text-[#1E40AF] font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
                      Uploading images...
                    </div>
                  </div>
                )}
                
                {form.image_urls && form.image_urls.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {form.image_urls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} alt={`img-${idx}`} className="w-full h-24 sm:h-32 object-cover rounded-2xl border-2 border-[#E2E8F0]/50 shadow-lg group-hover:shadow-xl transition-all duration-300" />
                        <button
                          type="button"
                          onClick={() => updateField('image_urls', form.image_urls.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-red-500/90 backdrop-blur-sm text-white rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold shadow-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-110"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {form.images && form.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {form.images.map((file, idx) => (
                      <div key={idx} className="relative group">
                        <img src={URL.createObjectURL(file)} alt={`img-${idx}`} className="w-full h-24 sm:h-32 object-cover rounded-2xl border-2 border-[#E2E8F0]/50 shadow-lg group-hover:shadow-xl transition-all duration-300" />
                        <button
                          type="button"
                          onClick={() => updateField('images', form.images.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-red-500/90 backdrop-blur-sm text-white rounded-full px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold shadow-lg hover:bg-red-600 transition-all duration-200 transform hover:scale-110"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col lg:col-span-2">
                <label className="text-sm font-bold text-[#64748B] mb-2 uppercase tracking-wide">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  placeholder="Short summary of the event"
                  className="text-sm sm:text-base rounded-2xl border-2 border-[#E2E8F0]/50 ring-1 ring-[#E2E8F0]/30 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/80 backdrop-blur-sm text-[#334155] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all duration-200 font-medium hover:border-[#3B82F6]/50 resize-none"
                />
              </div>

              {/* Student Coordinators */}
              <div className="flex flex-col">
                <label className="text-sm font-bold text-[#64748B] mb-3 uppercase tracking-wide">Student Coordinators</label>
                <div className="space-y-3">
                  {form.student_coordinators.map((c, i) => (
                    <div key={i} className="p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-[#E2E8F0]/30 shadow-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <input
                        value={c.name}
                        onChange={(e) => updateArrayField('student_coordinators', i, 'name', e.target.value)}
                        placeholder="Name"
                          className={`text-sm sm:text-base rounded-xl border-2 px-3 py-2 sm:py-2.5 bg-white/80 backdrop-blur-sm ring-1 text-[#334155] placeholder-[#94A3B8] transition-all duration-200 font-medium ${
                            errors[`student_${i}`] 
                              ? 'border-red-400 ring-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                              : 'border-[#E2E8F0]/50 ring-[#E2E8F0]/30 focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]'
                          } hover:border-[#3B82F6]/50`}
                      />
                      <input
                        value={c.phone}
                        onChange={(e) => updateArrayField('student_coordinators', i, 'phone', e.target.value)}
                        placeholder="Phone"
                          className={`text-sm sm:text-base rounded-xl border-2 px-3 py-2 sm:py-2.5 bg-white/80 backdrop-blur-sm ring-1 text-[#334155] placeholder-[#94A3B8] transition-all duration-200 font-medium ${
                            errors[`student_${i}`] 
                              ? 'border-red-400 ring-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                              : 'border-[#E2E8F0]/50 ring-[#E2E8F0]/30 focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]'
                          } hover:border-[#3B82F6]/50`}
                        />
                      </div>
                      <div className="text-right">
                        <button 
                          type="button" 
                          onClick={() => removeRow('student_coordinators', i)} 
                          className="px-3 py-1.5 bg-red-500/90 backdrop-blur-sm text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => addRow('student_coordinators', { name: '', phone: '' })} 
                    className="w-full p-2.5 sm:p-3 bg-[#3B82F6]/10 backdrop-blur-sm text-[#3B82F6] rounded-2xl border-2 border-[#3B82F6]/30 text-sm sm:text-base font-bold hover:bg-[#3B82F6]/20 hover:border-[#3B82F6]/50 transition-all duration-200 transform hover:scale-105"
                  >
                    + Add Coordinator
                  </button>
                </div>
              </div>

              {/* Staff Incharge */}
              <div className="flex flex-col">
                <label className="text-sm font-bold text-[#64748B] mb-3 uppercase tracking-wide">Staff Incharge</label>
                <div className="space-y-3">
                  {form.staff_incharge.map((s, i) => (
                    <div key={i} className="p-3 sm:p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-[#E2E8F0]/30 shadow-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <input
                        value={s.name}
                        onChange={(e) => updateArrayField('staff_incharge', i, 'name', e.target.value)}
                        placeholder="Name"
                          className={`text-sm sm:text-base rounded-xl border-2 px-3 py-2 sm:py-2.5 bg-white/80 backdrop-blur-sm ring-1 text-[#334155] placeholder-[#94A3B8] transition-all duration-200 font-medium ${
                            errors[`staff_${i}`] 
                              ? 'border-red-400 ring-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                              : 'border-[#E2E8F0]/50 ring-[#E2E8F0]/30 focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]'
                          } hover:border-[#3B82F6]/50`}
                      />
                      <input
                        value={s.department}
                        onChange={(e) => updateArrayField('staff_incharge', i, 'department', e.target.value)}
                        placeholder="Department"
                          className={`text-sm sm:text-base rounded-xl border-2 px-3 py-2 sm:py-2.5 bg-white/80 backdrop-blur-sm ring-1 text-[#334155] placeholder-[#94A3B8] transition-all duration-200 font-medium ${
                            errors[`staff_${i}`] 
                              ? 'border-red-400 ring-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                              : 'border-[#E2E8F0]/50 ring-[#E2E8F0]/30 focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]'
                          } hover:border-[#3B82F6]/50`}
                        />
                      </div>
                      <div className="text-right">
                        <button 
                          type="button" 
                          onClick={() => removeRow('staff_incharge', i)} 
                          className="px-3 py-1.5 bg-red-500/90 backdrop-blur-sm text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => addRow('staff_incharge', { name: '', department: '' })} 
                    className="w-full p-2.5 sm:p-3 bg-[#3B82F6]/10 backdrop-blur-sm text-[#3B82F6] rounded-2xl border-2 border-[#3B82F6]/30 text-sm sm:text-base font-bold hover:bg-[#3B82F6]/20 hover:border-[#3B82F6]/50 transition-all duration-200 transform hover:scale-105"
                  >
                    + Add Staff
                  </button>
                </div>
              </div>

              {/* Total participants */}
              <div className="flex flex-col lg:col-span-2">
                <label className="text-sm font-bold text-[#64748B] mb-2 uppercase tracking-wide">Total Participants Allowed</label>
                <input
                  type="number"
                  value={form.total_participants_allowed}
                  onChange={(e) => updateField('total_participants_allowed', e.target.value)}
                  placeholder="e.g., 100"
                  className={`text-sm sm:text-base rounded-2xl border-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/80 backdrop-blur-sm ring-1 text-[#334155] placeholder-[#94A3B8] transition-all duration-200 font-medium ${
                    errors.total_participants_allowed 
                      ? 'border-red-400 ring-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                      : 'border-[#E2E8F0]/50 ring-[#E2E8F0]/30 focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]'
                  } hover:border-[#3B82F6]/50`}
                />
                {errors.total_participants_allowed && <span className="text-sm text-red-600 mt-2 font-medium">{errors.total_participants_allowed}</span>}
              </div>

              {/* Registration Link */}
              <div className="flex flex-col">
                <label className="text-sm font-bold text-[#64748B] mb-2 uppercase tracking-wide">Registration Link</label>
                <input
                  type="url"
                  value={form.registration_link}
                  onChange={(e) => updateField('registration_link', e.target.value)}
                  placeholder="e.g., https://forms.gle/..."
                  className={`text-base rounded-2xl border-2 px-4 py-3 bg-white/80 backdrop-blur-sm ring-1 text-[#334155] placeholder-[#94A3B8] transition-all duration-200 font-medium ${
                    errors.registration_link 
                      ? 'border-red-400 ring-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500' 
                      : 'border-[#E2E8F0]/50 ring-[#E2E8F0]/30 focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6]'
                  } hover:border-[#3B82F6]/50`}
                />
                {errors.registration_link && <span className="text-sm text-red-600 mt-2 font-medium">{errors.registration_link}</span>}
              </div>

              {/* Registration Type */}
              <div className="flex flex-col">
                <label className="text-sm font-bold text-[#64748B] mb-2 uppercase tracking-wide">Registration Type</label>
                <select
                  value={form.registration_type}
                  onChange={(e) => updateField('registration_type', e.target.value)}
                  className="text-base rounded-2xl border-2 border-[#E2E8F0]/50 ring-1 ring-[#E2E8F0]/30 px-4 py-3 bg-white/80 backdrop-blur-sm text-[#334155] focus:ring-2 focus:ring-[#3B82F6] focus:border-[#3B82F6] transition-all duration-200 font-medium hover:border-[#3B82F6]/50"
                >
                  <option value="individual">Individual</option>
                  <option value="team">Team</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#E2E8F0]/30">
              <button 
                onClick={handleSave} 
                className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto" 
                disabled={saveStatus === 'saving'}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {saveStatus === 'saving' ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Saving...</span>
                      <span className="sm:hidden">Save</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="hidden sm:inline">Save Event</span>
                      <span className="sm:hidden">Save</span>
                    </>
                  )}
                </span>
                {saveStatus !== 'saving' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                )}
              </button>
            </div>
          </div>
          ) : (
          // View mode with edit option
          <div className="bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-3xl shadow-xl p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-[#3B82F6]/5 to-[#06B6D4]/5 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-[#06B6D4]/5 to-[#3B82F6]/5 rounded-full translate-y-10 sm:translate-y-12 -translate-x-10 sm:-translate-x-12"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#1E40AF]">Event Details</h2>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="group relative px-4 sm:px-6 py-2.5 sm:py-3 text-[#3B82F6] border-2 border-[#3B82F6] rounded-2xl hover:bg-[#EFF6FF] hover:border-[#1E40AF] transition-all duration-300 font-semibold bg-white/80 backdrop-blur-sm overflow-hidden text-sm sm:text-base w-full sm:w-auto"
                >
                  <span className="relative z-10">Edit</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/10 to-[#06B6D4]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </button>
                {isGlobalAdmin && isEditMode && (
                  <button 
                    onClick={() => handleDeleteEvent(eventId)}
                    className="group relative px-4 sm:px-6 py-2.5 sm:py-3 bg-red-500/90 text-white rounded-2xl font-semibold shadow-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105 overflow-hidden text-sm sm:text-base w-full sm:w-auto"
                  >
                    <span className="relative z-10">Delete Event</span>
                  </button>
                )}
                {saveStatus === 'saved' && (
                  <button 
                    onClick={handleConfirmPost} 
                    disabled={postStatus === 'posting' || postStatus === 'posted'} 
                    className="group relative px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto"
                  >
                    <span className="relative z-10">
                      {postStatus === 'posted' ? (isEditMode ? 'Updated' : 'Posted') : postStatus === 'posting' ? (isEditMode ? 'Updating...' : 'Posting...') : (isEditMode ? 'Confirm & Update' : 'Confirm & Post')}
                    </span>
                    {postStatus !== 'posting' && postStatus !== 'posted' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 relative z-10">
              <Detail label="Registration Number" value={form.registration_number} />
              <Detail label="Event Name" value={form.event_name} />
              <Detail label="Caption" value={form.caption || '-'} />
              <Detail label="Start Date" value={form.start_date} />
              <Detail label="End Date" value={form.end_date} />
              <Detail label="Total Allowed" value={form.total_participants_allowed || '-'} />
              <Detail label="Description" value={form.description || '-'} wide />
              
              <div className="lg:col-span-2 bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-[#E2E8F0]/30 shadow-sm">
                <div className="text-sm font-bold text-[#64748B] uppercase tracking-wide mb-3">Images</div>
                {form.images && form.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {form.images.map((file, idx) => (
                      <img key={idx} src={URL.createObjectURL(file)} alt={`img-${idx}`} className="w-full h-24 sm:h-32 object-cover rounded-2xl border-2 border-[#E2E8F0]/50 shadow-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="text-[#64748B] text-sm sm:text-base font-medium">No images uploaded</div>
                )}
              </div>
              
              <div className="lg:col-span-2 bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-[#E2E8F0]/30 shadow-sm">
                <div className="text-sm font-bold text-[#64748B] uppercase tracking-wide mb-3">Student Coordinators</div>
                <ul className="space-y-2">
                  {form.student_coordinators.filter(c => c.name || c.phone).map((c, i) => (
                    <li key={i} className="flex items-center gap-3 p-2.5 sm:p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-[#E2E8F0]/30">
                      <div className="w-2 h-2 bg-[#3B82F6] rounded-full flex-shrink-0"></div>
                      <span className="text-[#334155] font-medium text-sm sm:text-base">{c.name} {c.phone && `• ${c.phone}`}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="lg:col-span-2 bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-[#E2E8F0]/30 shadow-sm">
                <div className="text-sm font-bold text-[#64748B] uppercase tracking-wide mb-3">Staff Incharge</div>
                <ul className="space-y-2">
                  {form.staff_incharge.filter(s => s.name || s.department).map((s, i) => (
                    <li key={i} className="flex items-center gap-3 p-2.5 sm:p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-[#E2E8F0]/30">
                      <div className="w-2 h-2 bg-[#06B6D4] rounded-full flex-shrink-0"></div>
                      <span className="text-[#334155] font-medium text-sm sm:text-base">{s.name} {s.department && `• ${s.department}`}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Detail label="Registration Link" value={form.registration_link || '-'} wide />
              <Detail label="Registration Type" value={form.registration_type} wide />
            </div>
            
            {postStatus === 'posted' && (
              <div className="mt-6 p-4 bg-[#10B981]/10 backdrop-blur-sm rounded-2xl border border-[#10B981]/20 text-[#065F46] font-medium">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                Event has been {isEditMode ? 'updated' : 'posted'} successfully.
                </div>
              </div>
            )}
          </div>
          )
        ) : (
          <div className="bg-white/90 backdrop-blur-xl border border-[#E2E8F0]/50 rounded-3xl shadow-xl p-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-r from-[#F59E0B]/5 to-[#D97706]/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-r from-[#D97706]/5 to-[#F59E0B]/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-[#92400E] mb-3">Awaiting Approval</h2>
              <p className="text-[#B45309] text-lg leading-relaxed">The event editor will be available once your access request is approved by a global admin.</p>
            </div>
          </div>
        )}
      </main>

      {/* Post success popup */}
      {isPostPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#E2E8F0]/50 p-6 sm:p-8 w-full max-w-md text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-[#10B981]/10 to-[#059669]/10 rounded-full -translate-y-10 sm:-translate-y-12 translate-x-10 sm:translate-x-12"></div>
            
            <div className="relative z-10">
              <div className="mx-auto mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
              <div className="text-xl sm:text-2xl font-black text-[#065F46] mb-2">
                Event {isEditMode ? 'Updated' : 'Posted'}
            </div>
              <div className="text-[#047857] text-sm sm:text-base lg:text-lg font-medium">Redirecting to Admin Main...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, wide = false, isCode = false }) {
  return (
    <div className={`${wide ? 'lg:col-span-2' : ''} bg-white/80 backdrop-blur-sm border border-[#E2E8F0]/50 rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-[#3B82F6]/5 to-[#06B6D4]/5 rounded-full -translate-y-6 sm:-translate-y-8 translate-x-6 sm:translate-x-8"></div>
      
      <div className="text-xs sm:text-sm font-bold text-[#64748B] uppercase tracking-wide mb-2 relative z-10">{label}</div>
      {isCode ? (
        <pre className="text-xs sm:text-sm text-[#1E40AF] whitespace-pre-wrap break-words font-mono font-semibold relative z-10">{value}</pre>
      ) : (
        <div className="text-sm sm:text-base font-semibold text-[#334155] relative z-10">{value}</div>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.001 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <div className="absolute -inset-4 bg-gradient-to-r from-[#3B82F6]/20 to-[#06B6D4]/20 rounded-full blur-2xl animate-pulse"></div>
        </div>
        <p className="text-[#64748B] mt-6 text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
}

// Main export component with Suspense boundary
export default function AddNewEventPage() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <AddNewEventComponent />
    </Suspense>
  );
}

