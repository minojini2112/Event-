'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddNewEventPage() {

  const [isEditing, setIsEditing] = useState(true);
  const [form, setForm] = useState({
    registered_count: 6,
    event_name: '',
    description: '',
    start_date: '',
    end_date: '',
    images: [], // File[]
    student_coordinators: [{ name: '', phone: '' }],
    staff_incharge: [{ name: '', department: '' }],
    total_participants_allowed: ''
  });

  const [errors, setErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved
  const [postStatus, setPostStatus] = useState('idle'); // idle | posting | posted
  const [isPostPopupOpen, setIsPostPopupOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {}, []);

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
      // Extra details for "View More" screens
      start_date: draft.start_date || '',
      end_date: draft.end_date || '',
      total_participants_allowed: draft.total_participants_allowed || '',
      student_coordinators: Array.isArray(draft.student_coordinators) ? draft.student_coordinators : [],
      staff_incharge: Array.isArray(draft.staff_incharge) ? draft.staff_incharge : []
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
      // Persist posted event to localStorage so both main pages can read it
      const key = 'posted_events';
      const nextEvent = buildEventForFeed(form);
      const existing = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      const list = existing ? JSON.parse(existing) : [];
      list.push(nextEvent);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(list));
      }
      // Simulate network delay
      await new Promise((r) => setTimeout(r, 500));
      setPostStatus('posted');
      setIsPostPopupOpen(true);
      // Navigate after a short delay to let user see the popup
      setTimeout(() => {
        router.push('/main/1');
      }, 1200);
    } catch (err) {
      console.error('Failed to post event:', err);
      setPostStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="w-full px-6 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Add New Event</h1>
          <p className="text-gray-600 mt-2">Create and publish a new event</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Editor */}
        {isEditing ? (
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
                  placeholder="Enter event name"
                  className={`text-sm rounded-lg border px-3 py-2 bg-white ring-1 text-gray-800 ${errors.event_name ? 'border-red-300 ring-red-200' : 'border-gray-200 ring-gray-200'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.event_name && <span className="text-xs text-red-600 mt-1">{errors.event_name}</span>}
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
                {saveStatus === 'saved' && (
                  <button onClick={handleConfirmPost} disabled={postStatus === 'posting' || postStatus === 'posted'} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                    {postStatus === 'posted' ? 'Posted' : postStatus === 'posting' ? 'Posting...' : 'Confirm & Post'}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Detail label="Registration Number" value={form.registration_number} />
              <Detail label="Event Name" value={form.event_name} />
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
            </div>
            {postStatus === 'posted' && (
              <div className="mt-4 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200 text-sm">Event has been posted successfully.</div>
            )}
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
            <div className="text-lg font-semibold text-gray-900">Event posted</div>
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


