import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, AlertTriangle, Dog, Syringe, Pill, Calendar, Camera } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';
import type { Pet, PetVaccine, PetMedication } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '';

export function PetTracker() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [vaccines, setVaccines] = useState<PetVaccine[]>([]);
  const [medications, setMedications] = useState<PetMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPetForm, setShowPetForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [showVaccineForm, setShowVaccineForm] = useState(false);
  const [showMedicationForm, setShowMedicationForm] = useState(false);

  const [petForm, setPetForm] = useState({
    name: '',
    species: '',
    breed: '',
    birth_date: '',
    weight: '',
    microchip: '',
    photo_url: '',
  });

  const [vaccineForm, setVaccineForm] = useState({
    pet_id: '',
    name: '',
    date_given: '',
    next_due: '',
    veterinarian: '',
    notes: '',
  });

  const [medicationForm, setMedicationForm] = useState({
    pet_id: '',
    name: '',
    dosage: '',
    frequency: '',
    start_date: '',
    end_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [petsRes, vaccinesRes, medsRes] = await Promise.all([
        fetch(`${API_URL}/api/family/pets`, { headers }),
        fetch(`${API_URL}/api/family/pets/vaccines`, { headers }),
        fetch(`${API_URL}/api/family/pets/medications`, { headers }),
      ]);
      const petsData = await petsRes.json();
      const vaccinesData = await vaccinesRes.json();
      const medsData = await medsRes.json();
      
      setPets(Array.isArray(petsData) ? petsData : []);
      setVaccines(Array.isArray(vaccinesData) ? vaccinesData : []);
      setMedications(Array.isArray(medsData) ? medsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const url = editingPet ? `${API_URL}/api/family/pets/${editingPet.id}` : `${API_URL}/api/family/pets`;
      const method = editingPet ? 'PUT' : 'POST';
      
      const res = await fetch(url, { method, headers, body: JSON.stringify(petForm) });
      if (res.ok) {
        fetchData();
        resetPetForm();
      }
    } catch (error) {
      console.error('Error saving pet:', error);
    }
  };

  const handleDeletePet = async (id: string) => {
    if (!confirm('¿Eliminar esta mascota?')) return;
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/family/pets/${id}`, { method: 'DELETE', headers });
      setPets(pets.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting pet:', error);
    }
  };

  const handleVaccineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const res = await fetch(`${API_URL}/api/family/pets/vaccines`, {
        method: 'POST',
        headers,
        body: JSON.stringify(vaccineForm)
      });
      if (res.ok) {
        fetchData();
        setVaccineForm({ pet_id: '', name: '', date_given: '', next_due: '', veterinarian: '', notes: '' });
      }
    } catch (error) {
      console.error('Error saving vaccine:', error);
    }
  };

  const handleMedicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const res = await fetch(`${API_URL}/api/family/pets/medications`, {
        method: 'POST',
        headers,
        body: JSON.stringify(medicationForm)
      });
      if (res.ok) {
        fetchData();
        setMedicationForm({ pet_id: '', name: '', dosage: '', frequency: '', start_date: '', end_date: '', notes: '' });
      }
    } catch (error) {
      console.error('Error saving medication:', error);
    }
  };

  const resetPetForm = () => {
    setShowPetForm(false);
    setEditingPet(null);
    setPetForm({ name: '', species: '', breed: '', birth_date: '', weight: '', microchip: '', photo_url: '' });
  };

  const getVaccinesForPet = (petId: string) => vaccines.filter(v => v.pet_id === petId);
  const getMedsForPet = (petId: string) => medications.filter(m => m.pet_id === petId);

  const upcomingVaccines = vaccines.filter(v => {
    if (!v.next_due) return false;
    const daysUntil = Math.ceil((new Date(v.next_due).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil >= 0;
  });

  const activeMedications = medications.filter(m => {
    if (!m.end_date) return true;
    return new Date(m.end_date) >= new Date();
  });

  const getSpeciesIcon = (species: string) => {
    return <Dog size={18} />;
  };

  const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString('es-ES') : '-';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Seguimiento de Mascotas</h1>
          <p className="text-gray-500 text-sm">Vacunas, veterinario, alimentación, medicación</p>
        </div>
        <button
          onClick={() => setShowPetForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Nueva mascota
        </button>
      </div>

      {upcomingVaccines.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-amber-800">{upcomingVaccines.length} vacuna(s) próxima(s)</p>
            <p className="text-sm text-amber-700">
              {upcomingVaccines.map(v => `${v.name} (${formatDate(v.next_due)})`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : pets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Dog size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No hay mascotas</p>
          <p className="text-sm text-gray-400">Añade tu primera mascota</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                      {pet.photo_url ? (
                        <img src={pet.photo_url} alt={pet.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        getSpeciesIcon(pet.species)
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{pet.name}</h3>
                      <p className="text-sm text-gray-500">{pet.species} {pet.breed && `- ${pet.breed}`}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingPet(pet);
                        setPetForm({
                          name: pet.name,
                          species: pet.species,
                          breed: pet.breed || '',
                          birth_date: pet.birth_date || '',
                          weight: pet.weight?.toString() || '',
                          microchip: pet.microchip || '',
                          photo_url: pet.photo_url || '',
                        });
                        setShowPetForm(true);
                      }}
                      className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeletePet(pet.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-sm text-gray-500">
                  {pet.birth_date && <span>Cumpleaños: {formatDate(pet.birth_date)}</span>}
                  {pet.weight && <span>{pet.weight} kg</span>}
                  {pet.microchip && <span>Microchip: {pet.microchip}</span>}
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Syringe size={16} className="text-blue-500" />
                    Vacunas
                  </h4>
                  <div className="space-y-2">
                    {getVaccinesForPet(pet.id).map((v) => (
                      <div key={v.id} className="flex items-center justify-between bg-blue-50 rounded-lg p-2 text-sm">
                        <span className="font-medium text-gray-700">{v.name}</span>
                        <span className="text-gray-500">{v.next_due ? `Próxima: ${formatDate(v.next_due)}` : `Última: ${formatDate(v.date_given)}`}</span>
                      </div>
                    ))}
                    <button
                      onClick={() => { setVaccineForm({ ...vaccineForm, pet_id: pet.id }); setShowVaccineForm(true); }}
                      className="text-sm text-primary hover:underline"
                    >
                      + Añadir vacuna
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Pill size={16} className="text-purple-500" />
                    Medicación
                  </h4>
                  <div className="space-y-2">
                    {getMedsForPet(pet.id).map((m) => (
                      <div key={m.id} className="flex items-center justify-between bg-purple-50 rounded-lg p-2 text-sm">
                        <span className="font-medium text-gray-700">{m.name}</span>
                        <span className="text-gray-500">{m.dosage} {m.frequency && `(${m.frequency})`}</span>
                      </div>
                    ))}
                    <button
                      onClick={() => { setMedicationForm({ ...medicationForm, pet_id: pet.id }); setShowMedicationForm(true); }}
                      className="text-sm text-primary hover:underline"
                    >
                      + Añadir medicación
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPetForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editingPet ? 'Editar mascota' : 'Nueva mascota'}
              </h2>
              <form onSubmit={handlePetSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={petForm.name}
                    onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Especie</label>
                    <input
                      type="text"
                      required
                      value={petForm.species}
                      onChange={(e) => setPetForm({ ...petForm, species: e.target.value })}
                      placeholder="Perro, Gato..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Raza</label>
                    <input
                      type="text"
                      value={petForm.breed}
                      onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha nacimiento</label>
                    <input
                      type="date"
                      value={petForm.birth_date}
                      onChange={(e) => setPetForm({ ...petForm, birth_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={petForm.weight}
                      onChange={(e) => setPetForm({ ...petForm, weight: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Microchip</label>
                  <input
                    type="text"
                    value={petForm.microchip}
                    onChange={(e) => setPetForm({ ...petForm, microchip: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL foto</label>
                  <input
                    type="url"
                    value={petForm.photo_url}
                    onChange={(e) => setPetForm({ ...petForm, photo_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={resetPetForm} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg">
                    {editingPet ? 'Guardar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showVaccineForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Nueva Vacuna</h2>
              <form onSubmit={handleVaccineSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={vaccineForm.name}
                    onChange={(e) => setVaccineForm({ ...vaccineForm, name: e.target.value })}
                    placeholder="Rabia, Moquillo..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha aplicada</label>
                    <input
                      type="date"
                      required
                      value={vaccineForm.date_given}
                      onChange={(e) => setVaccineForm({ ...vaccineForm, date_given: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Próxima fecha</label>
                    <input
                      type="date"
                      value={vaccineForm.next_due}
                      onChange={(e) => setVaccineForm({ ...vaccineForm, next_due: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Veterinario</label>
                  <input
                    type="text"
                    value={vaccineForm.veterinarian}
                    onChange={(e) => setVaccineForm({ ...vaccineForm, veterinarian: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    value={vaccineForm.notes}
                    onChange={(e) => setVaccineForm({ ...vaccineForm, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    rows={2}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowVaccineForm(false); setSelectedPet(null); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showMedicationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Nueva Medicación</h2>
              <form onSubmit={handleMedicationSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={medicationForm.name}
                    onChange={(e) => setMedicationForm({ ...medicationForm, name: e.target.value })}
                    placeholder="Antibiótico, Antiparasitario..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosis</label>
                    <input
                      type="text"
                      value={medicationForm.dosage}
                      onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                      placeholder="1 comprimido"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
                    <input
                      type="text"
                      value={medicationForm.frequency}
                      onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
                      placeholder="2 veces al día"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
                    <input
                      type="date"
                      required
                      value={medicationForm.start_date}
                      onChange={(e) => setMedicationForm({ ...medicationForm, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
                    <input
                      type="date"
                      value={medicationForm.end_date}
                      onChange={(e) => setMedicationForm({ ...medicationForm, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <textarea
                    value={medicationForm.notes}
                    onChange={(e) => setMedicationForm({ ...medicationForm, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    rows={2}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowMedicationForm(false); setSelectedPet(null); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
