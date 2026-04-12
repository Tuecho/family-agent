import { useState, useEffect, useRef } from 'react';
import { Image, Upload, X, Trash2, ChevronLeft, ChevronRight, FolderPlus } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Photo {
  id: number;
  owner_id: number;
  title: string;
  description: string;
  image_data: string;
  album: string;
  created_at: string;
}

interface Album {
  id?: number;
  name: string;
  count?: number;
  description?: string;
}

export function FamilyGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    album: '',
    image_data: ''
  });

  useEffect(() => {
    fetchPhotos();
    fetchAlbums();
  }, []);

  const fetchPhotos = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/gallery/photos`, { headers });
      const data = await response.json();
      setPhotos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
    setLoading(false);
  };

  const fetchAlbums = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/gallery/albums`, { headers });
      const data = await response.json();
      setAlbums(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setUploadForm({ ...uploadForm, image_data: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.image_data) return;

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/gallery/photos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(uploadForm)
      });

      setUploadForm({ title: '', description: '', album: '', image_data: '' });
      setShowUploadModal(false);
      fetchPhotos();
      fetchAlbums();
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta foto?')) return;

    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/gallery/photos/${id}`, {
        method: 'DELETE',
        headers
      });
      fetchPhotos();
      fetchAlbums();
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;

    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      console.log('Creating album with headers:', headers);
      const response = await fetch(`${API_URL}/api/gallery/albums`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: newAlbumName.trim() })
      });
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (err) {
        console.error('JSON parse error:', err);
        throw new Error('La respuesta del servidor no fue válida. El álbum podría haberse creado.');
      }

      if (!response.ok) {
        alert(data.error || 'Error creando álbum');
        return;
      }

      setNewAlbumName('');
      setShowAlbumModal(false);
      setSelectedAlbum(newAlbumName.trim());
      await fetchAlbums();
    } catch (error: any) {
      console.error('Error creating album:', error);
      alert(error.message || 'Error de conexión creando álbum. Verifica si ya fue creado.');
    } finally {
      // Intentar refrescar la lista por si el álbum se creó a pesar del error de conexión
      fetchAlbums();
    }
  };

  const handleDeleteAlbum = async (album: Album) => {
    if (!album.name || album.name === 'General') return;
    
    const confirmMessage = `¿Estás seguro de que quieres borrar el álbum "${album.name}"?\n\n¡ATENCIÓN! Las fotos se moverán al álbum "General".`;
    
    if (!confirm(confirmMessage)) return;

    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/gallery/albums/${encodeURIComponent(album.name)}`, {
        method: 'DELETE',
        headers: { ...headers, 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Error eliminando álbum');
        return;
      }

      if (selectedAlbum === album.name) {
        setSelectedAlbum('all');
      }
      fetchAlbums();
      fetchPhotos();
    } catch (error) {
      console.error('Error deleting album:', error);
      alert('Error eliminando álbum');
    }
  };

  const filteredPhotos = selectedAlbum === 'all'
    ? photos
    : photos.filter(p => p.album === selectedAlbum);

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setShowLightbox(true);
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % filteredPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Image className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Galería Familiar</h1>
            <p className="text-gray-500 text-sm">Guarda los mejores momentos de tu familia</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAlbumModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FolderPlus size={18} />
            <span>Nuevo Álbum</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Upload size={18} />
            <span>Subir Foto</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedAlbum('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedAlbum === 'all'
              ? 'bg-primary text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Todas ({photos.length})
        </button>
        {albums.map((album) => (
          <div key={album.name} className="flex items-center gap-1">
            <button
              onClick={() => setSelectedAlbum(album.name)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedAlbum === album.name
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {album.name} {album.count !== undefined && `(${album.count})`}
            </button>
            {album.id && (
              <button
                onClick={() => handleDeleteAlbum(album)}
                className="p-2 text-red-500 hover:bg-red-50 transition-colors rounded-lg flex-shrink-0"
                title="Eliminar álbum y sus fotos"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Image className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No tienes fotos en este álbum</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 text-primary hover:underline"
          >
            Subir tu primera foto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openLightbox(index)}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={photo.image_data}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3">
                <h3 className="font-medium text-gray-800 truncate">{photo.title}</h3>
                {photo.album && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                    {photo.album}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(photo.id);
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg transition-colors hover:bg-red-600 shadow-sm"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Subir Foto</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Título de la foto"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Descripción opcional..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Álbum
                </label>
                <select
                  value={uploadForm.album}
                  onChange={(e) => setUploadForm({ ...uploadForm, album: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Seleccionar álbum...</option>
                  {albums.map((album) => (
                    <option key={album.name} value={album.name}>{album.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagen *
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {uploadForm.image_data && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={uploadForm.image_data}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadForm({ ...uploadForm, image_data: '' })}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!uploadForm.title || !uploadForm.image_data}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Subir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAlbumModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Nuevo Álbum</h2>
              <button
                onClick={() => setShowAlbumModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateAlbum} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del álbum
                </label>
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Ej: Vacaciones 2024"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAlbumModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLightbox && filteredPhotos.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg"
          >
            <X size={24} />
          </button>
          
          <button
            onClick={prevPhoto}
            className="absolute left-4 p-2 text-white hover:bg-white/20 rounded-lg"
          >
            <ChevronLeft size={32} />
          </button>
          
          <div className="max-w-4xl max-h-[90vh] p-4">
            <img
              src={filteredPhotos[currentPhotoIndex].image_data}
              alt={filteredPhotos[currentPhotoIndex].title}
              className="max-w-full max-h-[80vh] object-contain"
            />
            <div className="text-center text-white mt-4">
              <h3 className="text-xl font-semibold">{filteredPhotos[currentPhotoIndex].title}</h3>
              {filteredPhotos[currentPhotoIndex].description && (
                <p className="text-gray-300 mt-1">{filteredPhotos[currentPhotoIndex].description}</p>
              )}
              {filteredPhotos[currentPhotoIndex].album && (
                <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                  {filteredPhotos[currentPhotoIndex].album}
                </span>
              )}
              <p className="text-gray-400 text-sm mt-2">
                {currentPhotoIndex + 1} / {filteredPhotos.length}
              </p>
            </div>
          </div>
          
          <button
            onClick={nextPhoto}
            className="absolute right-4 p-2 text-white hover:bg-white/20 rounded-lg"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      )}
    </div>
  );
}
