import { useState, useEffect } from 'react';
import { BookOpen, Film, Plus, Edit2, Trash2, X, Check, Eye, Star, Search } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  status: string;
  rating: number;
  notes: string;
  cover_url: string;
}

interface Movie {
  id: number;
  title: string;
  director: string;
  genre: string;
  year: number;
  status: string;
  rating: number;
  notes: string;
  poster_url: string;
}

type TabType = 'books' | 'movies';

const DEFAULT_BOOK_GENRES = ['Ficción', 'No ficción', 'Romance', 'Thriller', 'Ciencia ficción', 'Fantasy', 'Misterio', 'Biografía', 'Historia', 'Autoayuda', 'Otro'];
const DEFAULT_MOVIE_GENRES = ['Acción', 'Comedia', 'Drama', 'Thriller', 'Ciencia ficción', 'Fantasy', 'Horror', 'Romance', 'Documental', 'Animación', 'Otro'];

export function BooksMovies() {
  const [activeTab, setActiveTab] = useState<TabType>('books');
  const [books, setBooks] = useState<Book[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [customBookGenres, setCustomBookGenres] = useState<string[]>([]);
  const [customMovieGenres, setCustomMovieGenres] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [newGenre, setNewGenre] = useState('');
  const [editingItem, setEditingItem] = useState<Book | Movie | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reading' | 'watching' | 'completed'>('all');
  const [search, setSearch] = useState('');
  
  const [form, setForm] = useState({
    title: '',
    author: '',
    director: '',
    genre: '',
    year: '',
    status: 'pending',
    rating: 0,
    notes: ''
  });

  useEffect(() => {
    fetchBooks();
    fetchMovies();
    fetchCustomGenres();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/books`, { headers: getAuthHeaders() });
      if (res.ok) setBooks(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchMovies = async () => {
    try {
      const res = await fetch(`${API_URL}/api/movies`, { headers: getAuthHeaders() });
      if (res.ok) setMovies(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchCustomGenres = async () => {
    try {
      const bookRes = await fetch(`${API_URL}/api/genres/book`, { headers: getAuthHeaders() });
      const movieRes = await fetch(`${API_URL}/api/genres/movie`, { headers: getAuthHeaders() });
      if (bookRes.ok) {
        const bookGenres = await bookRes.json();
        setCustomBookGenres(bookGenres.map((g: any) => g.name));
      }
      if (movieRes.ok) {
        const movieGenres = await movieRes.json();
        setCustomMovieGenres(movieGenres.map((g: any) => g.name));
      }
    } catch (e) { console.error(e); }
  };

  const handleSave = async () => {
    if (!form.title) return;
    try {
      const endpoint = activeTab === 'books' ? 'books' : 'movies';
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? `${API_URL}/api/${endpoint}/${editingItem.id}` : `${API_URL}/api/${endpoint}`;
      
      const body = activeTab === 'books'
        ? { title: form.title, author: form.author, genre: form.genre, status: form.status, rating: form.rating, notes: form.notes }
        : { title: form.title, director: form.director, genre: form.genre, year: form.year ? parseInt(form.year) : null, status: form.status, rating: form.rating, notes: form.notes };

      await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      setShowModal(false);
      setEditingItem(null);
      resetForm();
      activeTab === 'books' ? fetchBooks() : fetchMovies();
    } catch (e) { console.error(e); }
  };

  const handleEdit = (item: Book | Movie) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      author: (item as Book).author || '',
      director: (item as Movie).director || '',
      genre: item.genre || '',
      year: (item as Movie).year?.toString() || '',
      status: item.status || 'pending',
      rating: item.rating || 0,
      notes: item.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminar?')) return;
    const endpoint = activeTab === 'books' ? 'books' : 'movies';
    try {
      await fetch(`${API_URL}/api/${endpoint}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      activeTab === 'books' ? fetchBooks() : fetchMovies();
    } catch (e) { console.error(e); }
  };

  const resetForm = () => {
    setForm({ title: '', author: '', director: '', genre: '', year: '', status: 'pending', rating: 0, notes: '' });
  };

  const openNew = () => {
    setEditingItem(null);
    resetForm();
    setShowModal(true);
  };

  const filteredBooks = books.filter(b => {
    const matchesFilter = filter === 'all' || b.status === filter;
    const matchesSearch = !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.author?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredMovies = movies.filter(m => {
    const matchesFilter = filter === 'all' || m.status === filter;
    const matchesSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.director?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderStars = (rating: number, onChange?: (r: number) => void) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={16}
          className={`${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} ${onChange ? 'cursor-pointer' : ''}`}
          onClick={onChange ? () => onChange(i) : undefined}
        />
      ))}
    </div>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-600',
      reading: 'bg-blue-100 text-blue-600',
      watching: 'bg-purple-100 text-purple-600',
      completed: 'bg-green-100 text-green-600'
    };
    const labels: Record<string, string> = {
      pending: 'Por leer',
      reading: 'Leyendo',
      watching: 'Viendo',
      completed: activeTab === 'books' ? 'Leído' : 'Vista'
    };
    return <span className={`px-2 py-0.5 rounded-full text-xs ${styles[status] || styles.pending}`}>{labels[status] || status}</span>;
  };

  const items = activeTab === 'books' ? filteredBooks : filteredMovies;
  const allGenres = activeTab === 'books' 
    ? [...DEFAULT_BOOK_GENRES, ...customBookGenres] 
    : [...DEFAULT_MOVIE_GENRES, ...customMovieGenres];
  const genres = [...new Set(allGenres)].sort((a, b) => a.localeCompare(b, 'es'));

  const handleAddGenre = async () => {
    if (!newGenre.trim()) return;
    const genreType = activeTab === 'books' ? 'book' : 'movie';
    const newGenreName = newGenre.trim();
    try {
      await fetch(`${API_URL}/api/genres`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: genreType, name: newGenreName })
      });
      if (activeTab === 'books') {
        setCustomBookGenres([...customBookGenres, newGenreName].sort((a, b) => a.localeCompare(b, 'es')));
      } else {
        setCustomMovieGenres([...customMovieGenres, newGenreName].sort((a, b) => a.localeCompare(b, 'es')));
      }
    } catch (e) { console.error(e); }
    setNewGenre('');
    setShowGenreModal(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-4 sm:p-6 text-white mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-white/20 p-2 sm:p-3 rounded-xl">
              {activeTab === 'books' ? <BookOpen size={24} className="sm:size-8" /> : <Film size={24} className="sm:size-8" />}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{activeTab === 'books' ? 'Libros' : 'Películas'}</h1>
              <p className="opacity-90 text-sm">
                {activeTab === 'books' 
                  ? `${books.filter(b => b.status === 'completed').length}/${books.length} leídos`
                  : `${movies.filter(m => m.status === 'completed').length}/${movies.length} vistas`}
              </p>
            </div>
          </div>
          <button onClick={openNew} className="bg-white text-indigo-500 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center">
            <Plus size={18} /> <span className="sm:hidden"></span><span className="hidden sm:inline">Añadir</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 overflow-x-auto pb-2">
        <div className="flex gap-2">
          {[
            { key: 'books', label: 'Libros', icon: BookOpen },
            { key: 'movies', label: 'Películas', icon: Film }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key as TabType); setFilter('all'); }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm ${activeTab === tab.key ? 'bg-indigo-500 text-white' : 'bg-white border'}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 relative min-w-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as any)}
          className="px-3 py-2 border rounded-lg bg-white text-sm whitespace-nowrap"
        >
          <option value="all">Todos</option>
          <option value="pending">Por {activeTab === 'books' ? 'leer' : 'ver'}</option>
          <option value="reading">{activeTab === 'books' ? 'Leyendo' : 'Viendo'}</option>
          <option value="completed">{activeTab === 'books' ? 'Leídos' : 'Vistas'}</option>
        </select>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          {activeTab === 'books' ? <BookOpen size={48} className="mx-auto mb-4 text-indigo-300" /> : <Film size={48} className="mx-auto mb-4 text-purple-300" />}
          <p className="text-gray-500">No hay {activeTab === 'books' ? 'libros' : 'películas'} todavía</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg line-clamp-1">{item.title}</h3>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(item)} className="p-1 text-gray-400 hover:text-indigo-500"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-2">{activeTab === 'books' ? (item as Book).author : (item as Movie).director}</p>
              <div className="flex items-center justify-between">
                <StatusBadge status={item.status} />
                {renderStars(item.rating)}
              </div>
              {item.notes && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{item.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{editingItem ? 'Editar' : 'Nuevo'} {activeTab === 'books' ? 'libro' : 'película'}</h3>
              <button onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              {activeTab === 'books' ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Autor</label>
                  <input type="text" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Director</label>
                    <input type="text" value={form.director} onChange={e => setForm({ ...form, director: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Año</label>
                    <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Género</label>
                <div className="flex gap-2">
                  <select value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })} className="flex-1 px-4 py-2 border rounded-lg">
                    <option value="">Seleccionar...</option>
                    {genres.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowGenreModal(true)} className="px-3 py-2 border rounded-lg text-gray-500 hover:bg-gray-50" title="Añadir género">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                  <option value="pending">Por {activeTab === 'books' ? 'leer' : 'ver'}</option>
                  <option value="reading">{activeTab === 'books' ? 'Leyendo' : 'Viendo'}</option>
                  <option value="completed">{activeTab === 'books' ? 'Leído' : 'Vista'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valoración</label>
                <div className="flex gap-1">{[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={24} className={`${i <= form.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} cursor-pointer`} onClick={() => setForm({ ...form, rating: i })} />
                ))}</div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2 border rounded-lg" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
              <button onClick={handleSave} disabled={!form.title} className="flex-1 py-2 bg-indigo-500 text-white rounded-lg disabled:opacity-50">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showGenreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Nuevo género</h3>
              <button onClick={() => setShowGenreModal(false)}><X size={20} /></button>
            </div>
            <input
              type="text"
              value={newGenre}
              onChange={e => setNewGenre(e.target.value)}
              placeholder="Nombre del género"
              className="w-full px-4 py-2 border rounded-lg mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setShowGenreModal(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
              <button onClick={handleAddGenre} disabled={!newGenre.trim()} className="flex-1 py-2 bg-indigo-500 text-white rounded-lg disabled:opacity-50">Añadir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
