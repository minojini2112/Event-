'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AddNewEventPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="w-full px-6 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isEditMode ? 'Edit Event' : 'Add New Event'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditMode ? 'Update event information' : 'Create and publish a new event'}
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Access gating cards for admins without approval */}
        {!isEditMode && !isNameLocked && !isGlobalAdmin && (
          latestRequest && latestRequest.status === 'pending' ? (
            <div className="mb-6 bg-yellow-50 rounded-2xl border border-yellow-200 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-900">Access request pending</h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    You already have a pending request for <span className="font-semibold">{latestRequest.event_name}</span>. Please wait until it is accepted or rejected.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl border border-amber-200 p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-amber-900">Request access to create a new event</h3>
                  <p className="text-sm text-amber-800 mt-1">Submit your event name for approval. Once approved, the name will be auto-filled and locked in this form.</p>
                  {isCheckingAccess && (
                    <div className="mt-2 text-sm text-amber-800">Checking approval status...</div>
                  )}
                  {accessError && (
                    <div className="mt-2 text-sm text-red-700">{accessError}</div>
                  )}
                  {latestRequest && latestRequest.status === 'rejected' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                      <span>Your previous request for </span>
                      <span className="font-semibold">{latestRequest.event_name}</span>
                      <span> was rejected. You may submit a new request.</span>
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <input
                      type="text"
                      value={requestEventName}
                      onChange={(e) => setRequestEventName(e.target.value)}
                      placeholder="Proposed event name"
                      className="text-sm rounded-lg border border-amber-300 ring-1 ring-amber-200 px-3 py-2 bg-white text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={handleSubmitAccessRequest}
                      disabled={isSubmittingAccessRequest}
                      className="sm:col-span-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                    >
                      {isSubmittingAccessRequest ? 'Submitting...' : 'Request Access'}
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Registered Count (read only dummy for now) */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Registered Count</label>
                <input value={form.registered_count} readOnly className="text-sm rounded-lg border border-gray-200 ring-1 ring-gray-200 px-3 py-2 bg-gray-50 text-gray-800" />
              </div>

              {/* Event Name */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-900 mb-1">Event Name</label>
                <input
                  value={form.event_name}
                  onChange={(e) => updateField('event_name', e.target.value)}
                  readOnly={isNameLocked || isEditMode}
                  disabled={isNameLocked || isEditMode}
                  placeholder="Enter event name"
                  className={`text-sm rounded-lg border px-3 py-2 bg-white ring-1 text-gray-800 ${errors.event_name ? 'border-red-300 ring-red-200' : 'border-gray-200 ring-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.event_name && <span className="text-xs text-red-600 mt-1">{errors.event_name}</span>}
              </div>

              {/* Caption */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-900 mb-1">Caption</label>
                <input
                  value={form.caption}
                  onChange={(e) => updateField('caption', e.target.value)}
                  placeholder="Short caption shown in lists"
                  className="text-sm rounded-lg border px-3 py-2 bg-white ring-1 text-gray-800 border-gray-200 ring-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Start Date */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-900 mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => updateField('start_date', e.target.value)}
                  className={`text-sm rounded-lg border px-3 py-2 bg-white ring-1 text-gray-800 ${errors.start_date ? 'border-red-300 ring-red-200' : 'border-gray-200 ring-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.start_date && <span className="text-xs text-red-600 mt-1">{errors.start_date}</span>}
              </div>

              {/* End Date */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-900 mb-1">End Date</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => updateField('end_date', e.target.value)}
                  className={`text-sm rounded-lg border px-3 py-2 bg-white ring-1 text-gray-800 ${errors.end_date ? 'border-red-300 ring-red-200' : 'border-gray-200 ring-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.end_date && <span className="text-xs text-red-600 mt-1">{errors.end_date}</span>}
              </div>

              {/* Images Upload */}
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm text-gray-900 mb-1">Images</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    updateField('images', files);
                  }}
                  className="text-sm rounded-lg border border-gray-200 ring-1 ring-gray-200 px-3 py-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {uploadingImages && (
                  <div className="text-sm text-gray-600 mt-2">Uploading images...</div>
                )}
                {form.image_urls && form.image_urls.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {form.image_urls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <img src={url} alt={`img-${idx}`} className="w-full h-28 object-cover rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => updateField('image_urls', form.image_urls.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-white/90 text-gray-700 rounded-full px-2 py-0.5 text-xs shadow hover:bg-white"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {form.images && form.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {form.images.map((file, idx) => (
                      <div key={idx} className="relative group">
                        <img src={URL.createObjectURL(file)} alt={`img-${idx}`} className="w-full h-28 object-cover rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => updateField('images', form.images.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-white/90 text-gray-700 rounded-full px-2 py-0.5 text-xs shadow hover:bg-white"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm text-gray-900 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  placeholder="Short summary of the event"
                  className="text-sm rounded-lg border border-gray-200 ring-1 ring-gray-200 px-3 py-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Student Coordinators */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-900 mb-2">Student Coordinators</label>
                <div className="space-y-2">
                  {form.student_coordinators.map((c, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                      <input
                        value={c.name}
                        onChange={(e) => updateArrayField('student_coordinators', i, 'name', e.target.value)}
                        placeholder="Name"
                        className={`text-sm rounded-lg border px-3 py-2 bg-white ring-1 text-gray-800 ${errors[`student_${i}`] ? 'border-red-300 ring-red-200' : 'border-gray-200 ring-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                      <input
                        value={c.phone}
                        onChange={(e) => updateArrayField('student_coordinators', i, 'phone', e.target.value)}
                        placeholder="Phone"
                        className={`text-sm rounded-lg border px-3 py-2 bg-white ring-1 text-gray-800 ${errors[`student_${i}`] ? 'border-red-300 ring-red-200' : 'border-gray-200 ring-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                      <div className="col-span-2 text-right">
                        <button type="button" onClick={() => removeRow('student_coordinators', i)} className="text-xs text-red-600 hover:underline">Remove</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addRow('student_coordinators', { name: '', phone: '' })} className="text-sm text-blue-700 hover:underline">+ Add coordinator</button>
                </div>
              </div>

              {/* Staff Incharge */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-900 mb-2">Staff Incharge</label>
                <div className="space-y-2">
                  {form.staff_incharge.map((s, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                      <input
                        value={s.name}
                        onChange={(e) => updateArrayField('staff_incharge', i, 'name', e.target.value)}
                        placeholder="Name"
                        className={`text-sm rounded-lg border px-3 py-2 bg-white ring-1 text-gray-800 ${errors[`staff_${i}`] ? 'border-red-300 ring-red-200' : 'border-gray-200 ring-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                      <input
                        value={s.department}
                        onChange={(e) => updateArrayField('staff_incharge', i, 'department', e.target.value)}
                        placeholder="Department"
                        className={`text-sm rounded-lg border px-3 py-2 bg-white ring-1 text-gray-800 ${errors[`staff_${i}`] ? 'border-red-300 ring-red-200' : 'border-gray-200 ring-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                      <div className="col-span-2 text-right">
                        <button type="button" onClick={() => removeRow('staff_incharge', i)} className="text-xs text-red-600 hover:underline">Remove</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addRow('staff_incharge', { name: '', department: '' })} className="text-sm text-blue-700 hover:underline">+ Add staff</button>
                </div>
              </div>

              {/* Total participants */}
              <div className="flex flex-col md:col-span-2">
                <label className="text-sm text-gray-900 mb-1">Total Participants Allowed</label>
                <input
                  type="number"
                  value={form.total_participants_allowed}
                  onChange={(e) => updateField('total_participants_allowed', e.target.value)}
                  placeholder="e.g., 100"
                  className={`text-sm rounded-lg border px-3 py-2 bg-white ring-1 text-gray-800 ${errors.total_participants_allowed ? 'border-red-300 ring-red-200' : 'border-gray-200 ring-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.total_participants_allowed && <span className="text-xs text-red-600 mt-1">{errors.total_participants_allowed}</span>}
              </div>

              {/* Registration Link */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-900 mb-1">Registration Link</label>
                <input
                  type="url"
                  value={form.registration_link}
                  onChange={(e) => updateField('registration_link', e.target.value)}
                  placeholder="e.g., https://forms.gle/..."
                  className={`text-sm rounded-lg border px-3 py-2 bg-white ring-1 text-gray-800 ${errors.registration_link ? 'border-red-300 ring-red-200' : 'border-gray-200 ring-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.registration_link && <span className="text-xs text-red-600 mt-1">{errors.registration_link}</span>}
              </div>

              {/* Registration Type */}
              <div className="flex flex-col">
                <label className="text-sm text-gray-900 mb-1">Registration Type</label>
                <select
                  value={form.registration_type}
                  onChange={(e) => updateField('registration_type', e.target.value)}
                  className="text-sm rounded-lg border border-gray-200 ring-1 ring-gray-200 px-3 py-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="individual">Individual</option>
                  <option value="team">Team</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-60" disabled={saveStatus === 'saving'}>
                {saveStatus === 'saving' ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          ) : (
          // View mode with edit option
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Event Details</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">Edit</button>
                {isGlobalAdmin && isEditMode && (
                  <button 
                    onClick={() => handleDeleteEvent(eventId)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Delete Event
                  </button>
                )}
                {saveStatus === 'saved' && (
                  <button onClick={handleConfirmPost} disabled={postStatus === 'posting' || postStatus === 'posted'} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                    {postStatus === 'posted' ? (isEditMode ? 'Updated' : 'Posted') : postStatus === 'posting' ? (isEditMode ? 'Updating...' : 'Posting...') : (isEditMode ? 'Confirm & Update' : 'Confirm & Post')}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Detail label="Registration Number" value={form.registration_number} />
              <Detail label="Event Name" value={form.event_name} />
              <Detail label="Caption" value={form.caption || '-'} />
              <Detail label="Start Date" value={form.start_date} />
              <Detail label="End Date" value={form.end_date} />
              <Detail label="Total Allowed" value={form.total_participants_allowed || '-'} />
              <Detail label="Total Allowed" value={form.total_participants_allowed || '-'} />
              <Detail label="Description" value={form.description || '-'} wide />
              <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-600">Images</div>
                {form.images && form.images.length > 0 ? (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {form.images.map((file, idx) => (
                      <img key={idx} src={URL.createObjectURL(file)} alt={`img-${idx}`} className="w-full h-28 object-cover rounded-lg border border-gray-200" />
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-800 mt-1">-</div>
                )}
              </div>
              <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-600">Student Coordinators</div>
                <ul className="mt-1 text-sm text-gray-900 list-disc list-inside">
                  {form.student_coordinators.filter(c => c.name || c.phone).map((c, i) => (
                    <li key={i}>{c.name} {c.phone && `• ${c.phone}`}</li>
                  ))}
                </ul>
              </div>
              <div className="md:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-xs text-gray-600">Staff Incharge</div>
                <ul className="mt-1 text-sm text-gray-900 list-disc list-inside">
                  {form.staff_incharge.filter(s => s.name || s.department).map((s, i) => (
                    <li key={i}>{s.name} {s.department && `• ${s.department}`}</li>
                  ))}
                </ul>
              </div>
              <Detail label="Registration Link" value={form.registration_link || '-'} wide />
              <Detail label="Registration Type" value={form.registration_type} wide />
            </div>
            {postStatus === 'posted' && (
              <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200 text-sm">
                Event has been {isEditMode ? 'updated' : 'posted'} successfully.
              </div>
            )}
          </div>
          )
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Awaiting Approval</h2>
            <p className="text-sm text-gray-700">The event editor will be available once your access request is approved by a global admin.</p>
          </div>
        )}
      </main>

      {/* Post success popup */}
      {isPostPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-[90%] max-w-sm text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              Event {isEditMode ? 'updated' : 'posted'}
            </div>
            <div className="text-sm text-gray-700 mt-1">Redirecting to Admin Main...</div>
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


