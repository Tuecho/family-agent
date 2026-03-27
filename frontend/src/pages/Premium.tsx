import { useState, useEffect, useRef } from 'react';
import { Users, Upload, Plus, Trash2, Phone, Mail, MapPin, X, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Contact {
  id: number;
  name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
}

interface ImportResult {
  success: boolean;
  summary: { total: number; imported: number; skipped: number };
  details: { errors: { row: number; error: string }[] };
}

export function Premium() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newContact, setNewContact] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/contacts`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (e) {
      console.error('Error fetching contacts:', e);
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (content: string): any[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const contacts = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const contact: any = {};

      headers.forEach((header, idx) => {
        if (header === 'nombre') contact.name = values[idx];
        else if (header === 'relacion' || header === 'relationship') contact.relationship = values[idx];
        else if (header === 'telefono' || header === 'phone') contact.phone = values[idx];
        else if (header === 'email' || header === 'correo') contact.email = values[idx];
        else if (header === 'direccion' || header === 'address') contact.address = values[idx];
        else if (header === 'notas' || header === 'notes') contact.notes = values[idx];
      });

      if (contact.name) contacts.push(contact);
    }

    return contacts;
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const contacts = parseCSV(text);

      if (contacts.length === 0) {
        setError('No se encontraron contactos en el archivo');
        setImporting(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/contacts/import`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error importando contactos');
      }

      setResult(data);
      if (data.summary.imported > 0) {
        fetchContacts();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar archivo');
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        '.xlsx',
        '.xls',
        '.csv'
      ];

      if (!validTypes.some(type =>
        selectedFile.name.endsWith(type) ||
        selectedFile.type.includes('excel') ||
        selectedFile.type.includes('spreadsheet') ||
        selectedFile.type.includes('csv')
      )) {
        setError('Por favor, selecciona un archivo válido (.xlsx, .xls o .csv)');
        return;
      }

      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/contacts`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });

      if (res.ok) {
        setShowAdd(false);
        setNewContact({ name: '', relationship: '', phone: '', email: '', address: '', notes: '' });
        fetchContacts();
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Error agregando contacto');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este contacto?')) return;

    try {
      const res = await fetch(`${API_URL}/api/contacts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (res.ok) {
        fetchContacts();
      }
    } catch (err) {
      console.error('Error deleting contact:', err);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.relationship && c.relationship.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-xl flex items-center justify-center">
            <Users className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-wider">Contactos</h1>
            <p className="text-gray-500 text-sm font-medium">Gestiona tus contactos familiares</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            className="flex-1 min-w-[140px] px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-amber-500 text-white shadow-lg shadow-amber-500/30"
          >
            <Users size={18} />
            Contactos
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800">Contactos</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-white rounded-lg hover:from-amber-600 hover:to-yellow-500 transition-colors"
          >
            <Upload size={18} />
            Importar
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={18} />
            Nuevo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar contactos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : filteredContacts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay contactos</p>
          <p className="text-sm">Importa un archivo o agrega contactos manualmente</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map(contact => (
            <div key={contact.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                    {contact.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{contact.name}</h3>
                    {contact.relationship && (
                      <p className="text-sm text-gray-500">{contact.relationship}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} />
                    <a href={`tel:${contact.phone}`} className="hover:text-primary">{contact.phone}</a>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} />
                    <a href={`mailto:${contact.email}`} className="hover:text-primary">{contact.email}</a>
                  </div>
                )}
                {contact.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={14} />
                    <span>{contact.address}</span>
                  </div>
                )}
              </div>

              {contact.notes && (
                <p className="mt-3 text-sm text-gray-500 italic">{contact.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Importar */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Upload className="text-amber-500" size={24} />
                Importar Contactos
              </h3>
              <button
                onClick={() => { setShowImport(false); setFile(null); setResult(null); setError(null); }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-800 mb-2">Formato esperado del archivo CSV:</h4>
              <p className="text-sm text-blue-600">El archivo debe tener las siguientes columnas en la primera fila:</p>
              <ul className="text-sm text-blue-600 mt-2 space-y-1">
                <li><strong>nombre</strong> - Obligatorio</li>
                <li><strong>relacion</strong> - (Opcional) familia, amigo, trabajo...</li>
                <li><strong>telefono</strong> - (Opcional)</li>
                <li><strong>email</strong> - (Opcional)</li>
                <li><strong>direccion</strong> - (Opcional)</li>
                <li><strong>notas</strong> - (Opcional)</li>
              </ul>
            </div>

            {!result && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    file ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:border-primary'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <Users className="text-amber-500" size={32} />
                      <div className="text-left">
                        <p className="font-medium text-gray-800">{file.name}</p>
                        <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto text-gray-400 mb-2" size={48} />
                      <p className="text-gray-600">Haz clic o arrastra un archivo aquí</p>
                      <p className="text-sm text-gray-400 mt-1">.csv, .xlsx o .xls</p>
                    </>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-800">{result.summary.total}</p>
                    <p className="text-sm text-gray-500">Total</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{result.summary.imported}</p>
                    <p className="text-sm text-gray-500">Importados</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-500">{result.summary.skipped}</p>
                    <p className="text-sm text-gray-500">Omitidos</p>
                  </div>
                </div>

                {result.summary.imported > 0 && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                    <CheckCircle size={20} />
                    <span>¡Importación completada con éxito!</span>
                  </div>
                )}

                {result.details.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-500 mb-2">Errores:</h4>
                    <div className="bg-red-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                      {result.details.errors.map((e, i) => (
                        <div key={i} className="text-sm text-red-500">
                          Fila {e.row}: {e.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4 mt-4 border-t">
              {result ? (
                <>
                  <button
                    onClick={() => { setResult(null); setFile(null); }}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Importar otro
                  </button>
                  <button
                    onClick={() => { setShowImport(false); setFile(null); setResult(null); }}
                    className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Cerrar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setShowImport(false); setFile(null); }}
                    className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!file || importing}
                    className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {importing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Importar
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nuevo contacto */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Nuevo Contacto</h3>
              <button onClick={() => { setShowAdd(false); setError(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Nombre del contacto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relación</label>
                <input
                  type="text"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Amigo, Familiar, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="+34 600 000 000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={newContact.address}
                  onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Dirección"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  rows={2}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mt-3">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-4 mt-4 border-t">
              <button
                onClick={() => { setShowAdd(false); setError(null); }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddContact}
                className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
