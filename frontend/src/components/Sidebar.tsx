import { useState, useEffect } from 'react';
import { Home, Wallet, Bot, Target, MessageCircle, User, Shield } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Profile {
  name: string;
  avatar: string | null;
  family_name: string;
}

interface SidebarProps {
  activePage: 'dashboard' | 'accounting' | 'chatbot' | 'budgets' | 'profile' | 'agenda' | 'admin';
  onNavigate: (page: 'dashboard' | 'accounting' | 'chatbot' | 'budgets' | 'profile' | 'agenda' | 'admin') => void;
  onLogout?: () => void;
  isAdmin?: boolean;
  isMobile?: boolean;
}

export function Sidebar({ activePage, onNavigate, onLogout, isAdmin, isMobile }: SidebarProps) {
  const [profile, setProfile] = useState<Profile>({ name: '', avatar: null, family_name: 'Mi Familia' });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/profile`)
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(console.error);
  }, []);

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
              onClick={() => onNavigate('chatbot')}
              className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
                activePage === 'chatbot'
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : 'Chat IA'}
            >
              <Bot size={18} />
              {isExpanded && <span className="text-sm">Chat IA</span>}
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
        </ul>
      </nav>

      <div className={`border-t border-gray-200 space-y-1 transition-all duration-200 ${isExpanded ? 'p-3' : 'p-2'}`}>
        <button
          onClick={() => onNavigate('profile')}
          className={`w-full flex items-center gap-2 rounded-lg transition-colors ${
            activePage === 'profile'
              ? 'bg-primary/10 text-primary'
              : 'text-gray-500 hover:bg-gray-100'
          } ${isExpanded ? 'px-3 py-2' : 'p-2.5 justify-center'}`}
          title={isExpanded ? undefined : (profile.name || 'Mi perfil')}
        >
          {profile.avatar ? (
            <img src={profile.avatar} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <User size={16} />
          )}
          {isExpanded && <span className="text-sm truncate">{profile.name || 'Mi perfil'}</span>}
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            className={`w-full text-xs text-gray-400 hover:text-expense transition-colors ${
              isExpanded ? 'text-left px-3 py-2' : 'text-center p-2.5'
            }`}
          >
            {isExpanded ? 'Cerrar sesión' : '🔓'}
          </button>
        )}
      </div>
    </aside>
  );
}
