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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="w-full px-6 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Registrations</h1>
            <p className="text-gray-600 mt-2">{eventTitle} — {count} registered</p>
          </div>
          <button onClick={() => router.back()} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">Back</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {registrations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200/60 p-10 text-center text-gray-900">No registrations yet.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
            <div className="grid grid-cols-12 gap-0 border-b border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50">
              <div className="col-span-4 px-4 py-2">Name</div>
              <div className="col-span-3 px-4 py-2">Email</div>
              <div className="col-span-3 px-4 py-2">Department</div>
              <div className="col-span-2 px-4 py-2">Reg. Number</div>
            </div>
            <ul>
              {registrations.map((u, i) => (
                <li key={i} className="grid grid-cols-12 gap-0 border-b border-gray-100 text-sm text-gray-900">
                  <div className="col-span-4 px-4 py-2">{u.name}</div>
                  <div className="col-span-3 px-4 py-2">{u.email}</div>
                  <div className="col-span-3 px-4 py-2">{u.department}</div>
                  <div className="col-span-2 px-4 py-2">{u.registerNumber}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}


