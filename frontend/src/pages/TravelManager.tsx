import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Plane, Hotel, MapPin, CheckCircle, Calendar, DollarSign, Clock, X } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';
import type { Trip, TripMember, TripActivity } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

const DEFAULT_CHECKLIST = [
  { item: 'Pasaporte/DNI', packed: false },
  { item: 'Billetes', packed: false },
  { item: 'Tarjeta crédito', packed: false },
  { item: 'Ropa', packed: false },
  { item: 'Cargador móvil', packed: false },
  { item: 'Medicamentos', packed: false },
  { item: 'Gafas de sol', packed: false },
  { item: 'Protector solar', packed: false },
  { item: 'Zapatillas', packed: false },
  { item: 'Cámara fotos', packed: false },
];

export function TravelManager() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripMembers, setTripMembers] = useState<Record<string, TripMember[]>>({});
  const [tripActivities, setTripActivities] = useState<Record<string, TripActivity[]>>({});
  const [loading, setLoading] = useState(true);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [selectedTripName, setSelectedTripName] = useState('');

  const [tripForm, setTripForm] = useState({
    name: '',
    destination: '',
    start_date: '',
    end_date: '',
    budget: '',
    flights_booked: false,
    hotels_booked: false,
    activities_planned: false,
    notes: '',
  });

  const [memberForm, setMemberForm] = useState({ member_name: '', useDefaultChecklist: true });
  const [activityForm, setActivityForm] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    notes: '',
    cost: '',
    booked: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [tripsRes, membersRes] = await Promise.all([
        fetch(`${API_URL}/api/family/trips`, { headers }),
        fetch(`${API_URL}/api/family/trips/members`, { headers }),
      ]);
      const tripsData = await tripsRes.json();
      const membersData = membersRes.ok ? await membersRes.json() : [];
      
      setTrips(Array.isArray(tripsData) ? tripsData : []);
      if (Array.isArray(membersData)) {
        const grouped: Record<string, TripMember[]> = {};
        membersData.forEach((m: TripMember) => {
          if (!grouped[m.trip_id]) grouped[m.trip_id] = [];
          grouped[m.trip_id].push(m);
        });
        setTripMembers(grouped);
      }

      const activitiesData: Record<string, TripActivity[]> = {};
      for (const trip of Array.isArray(tripsData) ? tripsData : []) {
        try {
          const actRes = await fetch(`${API_URL}/api/family/trips/activities/${trip.id}`, { headers });
          if (actRes.ok) {
            const acts = await actRes.json();
            if (Array.isArray(acts) && acts.length > 0) {
              activitiesData[trip.id] = acts;
            }
          }
        } catch {}
      }
      setTripActivities(activitiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const url = editingTrip ? `${API_URL}/api/family/trips/${editingTrip.id}` : `${API_URL}/api/family/trips`;
      const method = editingTrip ? 'PUT' : 'POST';
      
      const payload = {
        ...tripForm,
        budget: tripForm.budget ? Number(tripForm.budget) : null
      };
      
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (!res.ok) {
        const errorText = await res.text();
        alert(`Error al ${editingTrip ? 'guardar' : 'crear'} viaje: ` + errorText);
        return;
      }
      fetchData();
      resetTripForm();
    } catch (error) {
      console.error('Error saving trip:', error);
      alert(`Error al ${editingTrip ? 'guardar' : 'crear'} viaje`);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    if (!confirm('¿Eliminar este viaje?')) return;
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/family/trips/${id}`, { method: 'DELETE', headers });
      setTrips(trips.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };

  const toggleActivityBooked = async (activity: TripActivity) => {
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/family/trips/activities/${activity.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...activity, booked: !activity.booked })
      });
      fetchData();
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const deleteActivity = async (activityId: string) => {
    if (!confirm('¿Eliminar actividad?')) return;
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/family/trips/activities/${activityId}`, { method: 'DELETE', headers });
      fetchData();
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  const addActivity = async () => {
    if (!selectedTrip || !activityForm.name.trim()) return;
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/family/trips/activities`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ trip_id: selectedTrip, ...activityForm, cost: activityForm.cost ? Number(activityForm.cost) : 0 })
      });
      setActivityForm({ name: '', date: '', time: '', location: '', notes: '', cost: '', booked: false });
      fetchData();
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const resetTripForm = () => {
    setShowTripForm(false);
    setEditingTrip(null);
    setTripForm({
      name: '',
      destination: '',
      start_date: '',
      end_date: '',
      budget: '',
      flights_booked: false,
      hotels_booked: false,
      activities_planned: false,
      notes: '',
    });
  };

  const openChecklistModal = (tripId: string, tripName: string) => {
    setSelectedTrip(tripId);
    setSelectedTripName(tripName);
    setShowChecklistModal(true);
  };

  const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString('es-ES') : '-';
  
  const getTripDuration = (start?: string, end?: string) => {
    if (!start || !end) return 0;
    return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const upcomingTrips = trips.filter(t => t.start_date && new Date(t.start_date) >= new Date());
  const totalBudget = trips.reduce((sum, t) => sum + (t.budget || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestor de Viajes</h1>
          <p className="text-gray-500 text-sm">Vuelos, hoteles, actividades y presupuesto</p>
        </div>
        <button
          onClick={() => { setEditingTrip(null); setShowTripForm(true); }}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-primary)]/90 transition-colors"
        >
          <Plus size={18} />
          Nuevo viaje
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <Plane size={18} />
            <span className="text-sm">Viajes</span>
          </div>
          <p className="text-3xl font-bold">{trips.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Calendar size={18} />
            <span className="text-sm">Próximo</span>
          </div>
          <p className="text-xl font-bold text-gray-800">
            {upcomingTrips[0]?.name || 'Sin viajes'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <DollarSign size={18} />
            <span className="text-sm">Presupuesto total</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalBudget}€</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <MapPin size={18} />
            <span className="text-sm">Actividades</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {Object.values(tripActivities).flat().length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : trips.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Plane size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No hay viajes</p>
          <p className="text-sm text-gray-400">Planifica tu próxima vacaciones</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcomingTrips.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-700 mb-3">Próximos viajes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingTrips.map((trip) => (
                  <div key={trip.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                          <MapPin size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{trip.name}</h3>
                          <p className="text-sm text-gray-500">{trip.destination || 'Destino por definir'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingTrip(trip);
                            setTripForm({
                              name: trip.name,
                              destination: trip.destination || '',
                              start_date: trip.start_date || '',
                              end_date: trip.end_date || '',
                              budget: trip.budget?.toString() || '',
                              flights_booked: trip.flights_booked || false,
                              hotels_booked: trip.hotels_booked || false,
                              activities_planned: trip.activities_planned || false,
                              notes: trip.notes || '',
                            });
                            setShowTripForm(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[var(--color-primary)] rounded-lg hover:bg-gray-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTrip(trip.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-gray-600">
                          {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                          {trip.start_date && trip.end_date && ` (${getTripDuration(trip.start_date, trip.end_date)} días)`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${trip.flights_booked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <Plane size={12} />
                        {trip.flights_booked ? 'Vuelos OK' : 'Sin vuelos'}
                      </span>
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${trip.hotels_booked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <Hotel size={12} />
                        {trip.hotels_booked ? 'Hotel OK' : 'Sin hotel'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openChecklistModal(trip.id, trip.name)}
                        className="flex-1 py-2 text-sm text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 rounded-lg border border-[var(--color-primary)]"
                      >
                        Equipaje
                      </button>
                      <button
                        onClick={() => { setSelectedTrip(trip.id); setSelectedTripName(trip.name); setShowActivityModal(true); }}
                        className="flex-1 py-2 text-sm text-white bg-purple-500 hover:bg-purple-600 rounded-lg"
                      >
                        Actividades
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showActivityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Actividades</h2>
                <p className="text-sm text-gray-500">{selectedTripName}</p>
              </div>
              <button onClick={() => setShowActivityModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b bg-gray-50">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Actividad"
                  value={activityForm.name}
                  onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="date"
                  value={activityForm.date}
                  onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="time"
                  value={activityForm.time}
                  onChange={(e) => setActivityForm({ ...activityForm, time: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Ubicación"
                  value={activityForm.location}
                  onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Coste (€)"
                  value={activityForm.cost}
                  onChange={(e) => setActivityForm({ ...activityForm, cost: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={activityForm.booked}
                    onChange={(e) => setActivityForm({ ...activityForm, booked: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  Reservado
                </label>
              </div>
              <button
                onClick={addActivity}
                className="w-full mt-2 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary)]/90"
              >
                Añadir actividad
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {selectedTrip && tripActivities[selectedTrip]?.length > 0 ? (
                <div className="space-y-3">
                  {tripActivities[selectedTrip].map((activity) => (
                    <div key={activity.id} className={`p-3 rounded-lg border ${activity.booked ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleActivityBooked(activity)}
                            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center ${activity.booked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}
                          >
                            {activity.booked && <CheckCircle size={14} />}
                          </button>
                          <div>
                            <h4 className={`font-medium ${activity.booked ? 'text-green-800' : 'text-gray-800'}`}>{activity.name}</h4>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                              {activity.date && <span className="flex items-center gap-1"><Calendar size={12} />{formatDate(activity.date)}</span>}
                              {activity.time && <span className="flex items-center gap-1"><Clock size={12} />{activity.time}</span>}
                              {activity.cost && <span className="flex items-center gap-1"><DollarSign size={12} />{activity.cost}€</span>}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => deleteActivity(activity.id)} className="p-1 text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                  <p>No hay actividades aún</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}