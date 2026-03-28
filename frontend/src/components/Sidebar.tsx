import { useState, useEffect } from 'react';
import { Home, Wallet, Target, User, Shield, Info, StickyNote, ShoppingCart, ListChecks, LogOut, Crown, UtensilsCrossed, BookOpen, FileText, ShieldCheck, Mail, ChefHat, Image, ChevronDown, ChevronRight, Bot, DollarSign, Users, Cake, Gift, Film } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Profile {
  name: string;
  avatar: string | null;
  family_name: string;
}

interface SidebarProps {
  activePage: 'dashboard' | 'accounting' | 'budgets' | 'profile' | 'agenda' | 'shopping' | 'tasks' | 'notes' | 'admin' | 'about' | 'restaurants' | 'howitworks' | 'gallery' | 'contacts' | 'terms' | 'privacy' | 'contact' | 'meals' | 'birthdays' | 'books_movies' | 'chatbot' | 'sales' | 'gifts';
  onNavigate: (page: 'dashboard' | 'accounting' | 'budgets' | 'profile' | 'agenda' | 'shopping' | 'tasks' | 'notes' | 'admin' | 'about' | 'restaurants' | 'howitworks' | 'gallery' | 'contacts' | 'terms' | 'privacy' | 'contact' | 'meals' | 'birthdays' | 'books_movies' | 'chatbot' | 'sales' | 'gifts') => void;
  onLogout?: () => void;
  isAdmin?: boolean;
  isMobile?: boolean;
}

export function Sidebar({ activePage, onNavigate, onLogout, isAdmin, isMobile }: SidebarProps) {
  const [profile, setProfile] = useState<Profile>({ name: '', avatar: null, family_name: 'Mi Familia' });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/profile`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(console.error);
  }, []);

  // Removed premium pages effect as tabs are now always visible

  const isExpanded = isMobile || isHovered;

  return (
    <aside
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      className={`bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col transition-all duration-200 ${
        isExpanded ? 'w-60' : 'w-16'
      } ${isMobile ? 'w-64 shadow-2xl' : ''}`}
    >
      <div className={`border-b border-gray-200 transition-all duration-200 ${isExpanded ? 'p-4' : 'p-3'}`}>
        {isExpanded ? (
          <h1 className="text-lg font-bold text-primary truncate">{profile.family_name}</h1>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {profile.family_name?.[0]?.toUpperCase() || 'F'}
          </div>
        )}
      </div>
      
      <nav className={`flex-1 transition-all duration-200 overflow-y-auto ${isExpanded ? 'p-3' : 'p-2'}`}>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => onNavigate('dashboard')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'dashboard'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Dashboard'}
            >
              <Home size={18} />
              {isExpanded && <span className="text-sm">Dashboard</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('accounting')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'accounting'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Contabilidad'}
            >
              <Wallet size={18} />
              {isExpanded && <span className="text-sm">Contabilidad</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('budgets')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'budgets'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Presupuestos'}
            >
              <Target size={18} />
              {isExpanded && <span className="text-sm">Presupuestos</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('agenda')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'agenda'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Agenda'}
            >
              <Home size={18} />
              {isExpanded && <span className="text-sm">Agenda</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('shopping')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'shopping'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Lista Compra'}
            >
              <ShoppingCart size={18} />
              {isExpanded && <span className="text-sm">Lista Compra</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('tasks')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'tasks'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Tareas'}
            >
              <ListChecks size={18} />
              {isExpanded && <span className="text-sm">Tareas</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('notes')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'notes'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Notas'}
            >
              <StickyNote size={18} />
              {isExpanded && <span className="text-sm">Notas</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('meals')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'meals'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Comidas'}
            >
              <ChefHat size={18} />
              {isExpanded && <span className="text-sm">Comidas</span>}
            </button>
          </li>
          <li key="birthdays">
            <button
              onClick={() => onNavigate('birthdays')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'birthdays'
                  ? 'bg-pink-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Cumpleaños'}
            >
              <Cake size={18} />
              {isExpanded && <span className="text-sm">Cumpleaños</span>}
            </button>
          </li>
          <li key="books_movies">
            <button
              onClick={() => onNavigate('books_movies')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'books_movies'
                  ? 'bg-indigo-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined: 'Libros y Películas'}
            >
              <BookOpen size={18} />
              {isExpanded && <span className="text-sm">Libros y Películas</span>}
            </button>
          </li>
          <li key="gifts">
            <button
              onClick={() => onNavigate('gifts')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'gifts'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Regalos'}
            >
              <Gift size={18} className={activePage === 'gifts' ? 'text-white' : 'text-amber-500'} />
              {isExpanded && <span className="text-sm font-medium">Regalos</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('restaurants')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'restaurants'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Restaurantes'}
            >
              <UtensilsCrossed size={18} />
              {isExpanded && <span className="text-sm">Restaurantes</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('contacts')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'contacts'
                  ? 'bg-amber-100 text-amber-700'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Contactos'}
            >
              <Users size={18} />
              {isExpanded && <span className="text-sm">Contactos</span>}
            </button>
          </li>
          <li key="gallery">
            <button
              onClick={() => onNavigate('gallery')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'gallery'
                  ? 'bg-amber-100 text-amber-700'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Galería'}
            >
              <Image size={18} />
              {isExpanded && <span className="text-sm">Galería</span>}
            </button>
          </li>
          <li key="chatbot">
            <button
              onClick={() => onNavigate('chatbot')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'chatbot'
                  ? 'bg-amber-100 text-amber-700'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Chat IA'}
            >
              <Bot size={18} />
              {isExpanded && <span className="text-sm">Chat IA</span>}
            </button>
          </li>
          <li key="sales">
            <button
              onClick={() => onNavigate('sales')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'sales'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Ventas'}
            >
              <DollarSign size={18} />
              {isExpanded && <span className="text-sm">Ventas</span>}
            </button>
          </li>
          {isAdmin && (
            <li>
              <button
                onClick={() => onNavigate('admin')}
                className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                  activePage === 'admin'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
                title={isExpanded ? undefined : 'Admin'}
              >
                <Shield size={18} />
                {isExpanded && <span className="text-sm">Admin</span>}
              </button>
            </li>
          )}
          <li>
            <button
              onClick={() => onNavigate('howitworks')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'howitworks'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Cómo funciona'}
            >
              <BookOpen size={18} />
              {isExpanded && <span className="text-sm">Cómo funciona</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('about')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'about'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Acerca de'}
            >
              <Info size={18} />
              {isExpanded && <span className="text-sm">Acerca de</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('terms')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'terms'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Términos'}
            >
              <FileText size={18} />
              {isExpanded && <span className="text-sm">Términos</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('privacy')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'privacy'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Privacidad'}
            >
              <ShieldCheck size={18} />
              {isExpanded && <span className="text-sm">Privacidad</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('contact')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'contact'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Contacto'}
            >
              <Mail size={18} />
              {isExpanded && <span className="text-sm">Contacto</span>}
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate('profile')}
              className={`w-full flex items-center gap-3 rounded-xl transition-all ${
                activePage === 'profile'
                  ? 'bg-gradient-to-r from-primary to-pink-500 text-white shadow-lg shadow-primary/25'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : (profile.name || 'Mi perfil')}
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/50" />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activePage === 'profile' ? 'bg-white/20' : 'bg-primary/10'
                }`}>
                  <User size={16} className={activePage === 'profile' ? 'text-white' : 'text-primary'} />
                </div>
              )}
              {isExpanded && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{profile.name || 'Mi perfil'}</p>
                  <p className="text-xs opacity-60 truncate">{profile.family_name}</p>
                </div>
              )}
            </button>
          </li>
          {onLogout && (
            <li>
              <button
                onClick={onLogout}
                className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                  isExpanded
                    ? 'text-gray-500 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 hover:text-red-500 px-3 py-2.5'
                    : 'text-gray-400 hover:text-red-500 p-2.5 justify-center'
                }`}
                title="Cerrar sesión"
              >
                <LogOut size={18} />
                {isExpanded && <span className="text-sm">Cerrar sesión</span>}
              </button>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}
