import { useState, useEffect } from 'react';
import { Home, Wallet, Target, User, Shield, Info, StickyNote, ShoppingCart, ListChecks, LogOut, Crown, UtensilsCrossed, BookOpen, FileText, ShieldCheck, Mail, ChefHat, Image, ChevronDown, ChevronRight, Bot, DollarSign, Users, Cake, Gift, Film, CheckCircle, Package, Wrench, CreditCard, Dog, Plane, PiggyBank, TrendingUp, Zap, Library, GraduationCap, Calendar, Settings, Clock, MapPin, CalendarHeart, Heart } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Profile {
  name: string;
  avatar: string | null;
  family_name: string;
  enabled_modules: string | null;
}

interface SidebarProps {
  activePage: 'dashboard' | 'accounting' | 'budgets' | 'profile' | 'agenda' | 'shopping' | 'tasks' | 'notes' | 'admin' | 'about' | 'restaurants' | 'howitworks' | 'gallery' | 'contacts' | 'terms' | 'privacy' | 'contact' | 'meals' | 'birthdays' | 'anniversaries' | 'books_movies' | 'chatbot' | 'sales' | 'gifts' | 'habits' | 'home_inventory' | 'home_maintenance' | 'subscriptions' | 'pet_tracker' | 'travel_manager' | 'savings_goals' | 'internal_debts' | 'utility_bills' | 'family_library' | 'extra_school' | 'modules' | 'work_hours' | 'interesting_places' | 'family_organization' | 'indulgences';
  onNavigate: (page: 'dashboard' | 'accounting' | 'budgets' | 'profile' | 'agenda' | 'shopping' | 'tasks' | 'notes' | 'admin' | 'about' | 'restaurants' | 'howitworks' | 'gallery' | 'contacts' | 'terms' | 'privacy' | 'contact' | 'meals' | 'birthdays' | 'anniversaries' | 'books_movies' | 'chatbot' | 'sales' | 'gifts' | 'habits' | 'home_inventory' | 'home_maintenance' | 'subscriptions' | 'pet_tracker' | 'travel_manager' | 'savings_goals' | 'internal_debts' | 'utility_bills' | 'family_library' | 'extra_school' | 'modules' | 'work_hours' | 'interesting_places' | 'family_organization' | 'indulgences') => void;
  onLogout?: () => void;
  isAdmin?: boolean;
  isMobile?: boolean;
}

export function Sidebar({ activePage, onNavigate, onLogout, isAdmin, isMobile }: SidebarProps) {
  const [profile, setProfile] = useState<Profile>({ name: '', avatar: null, family_name: 'Mi Familia', enabled_modules: null });
  const [isHovered, setIsHovered] = useState(false);
  const [globalHiddenModules, setGlobalHiddenModules] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfile = () => {
      fetch(`${API_URL}/api/profile`, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => setProfile(data))
        .catch(console.error);
    };
    
    fetchProfile();
    
    const fetchGlobalHidden = () => {
      fetch(`${API_URL}/api/global-hidden-modules`, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => setGlobalHiddenModules(data))
        .catch(console.error);
    };
    fetchGlobalHidden();
    
    const interval = setInterval(() => {
      fetchProfile();
      fetchGlobalHidden();
    }, 2000);
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'profile_refresh') {
        fetchProfile();
      }
    };
    
    window.addEventListener('storage', handleStorage);
    
    const handleProfileUpdate = () => {
      fetchProfile();
    };
    window.addEventListener('profile_updated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('profile_updated', handleProfileUpdate);
      clearInterval(interval);
    };
  }, []);

  const defaultModules = ['dashboard', 'agenda', 'accounting', 'budgets', 'birthdays', 'anniversaries', 'habits', 'shopping', 'notes', 'tasks', 'meals', 'gifts', 'restaurants', 'books_movies', 'chatbot', 'sales', 'interesting_places', 'family_organization', 'indulgences', 'home_inventory', 'home_maintenance', 'subscriptions', 'pet_tracker', 'travel_manager', 'savings_goals', 'internal_debts', 'utility_bills', 'family_library', 'extra_school', 'work_hours', 'howitworks', 'about', 'terms', 'privacy'];

  const isModuleEnabled = (key: string) => {
    if (key === 'dashboard') return true;
    if (globalHiddenModules.includes(key)) return false;
    if (!profile.enabled_modules) return defaultModules.includes(key);
    return profile.enabled_modules.split(',').includes(key);
  };

  const getModuleOrder = (): string[] => {
    if (!profile.enabled_modules) return defaultModules;
    return profile.enabled_modules.split(',').filter(key => !globalHiddenModules.includes(key));
  };

  const moduleMap: Record<string, { page: string; icon: any; label: string }> = {
    dashboard: { page: 'dashboard', icon: Home, label: 'Dashboard' },
    accounting: { page: 'accounting', icon: Wallet, label: 'Contabilidad' },
    budgets: { page: 'budgets', icon: Target, label: 'Presupuestos' },
    agenda: { page: 'agenda', icon: Calendar, label: 'Agenda' },
    shopping: { page: 'shopping', icon: ShoppingCart, label: 'Lista Compra' },
    tasks: { page: 'tasks', icon: ListChecks, label: 'Tareas' },
    habits: { page: 'habits', icon: CheckCircle, label: 'Hábitos' },
    notes: { page: 'notes', icon: StickyNote, label: 'Notas' },
    meals: { page: 'meals', icon: ChefHat, label: 'Comidas' },
    birthdays: { page: 'birthdays', icon: Cake, label: 'Cumpleaños' },
    anniversaries: { page: 'anniversaries', icon: CalendarHeart, label: 'Aniversarios' },
    books_movies: { page: 'books_movies', icon: BookOpen, label: 'Libros y Películas' },
    gifts: { page: 'gifts', icon: Gift, label: 'Regalos' },
    restaurants: { page: 'restaurants', icon: UtensilsCrossed, label: 'Restaurantes' },
    contacts: { page: 'contacts', icon: Users, label: 'Contactos' },
    gallery: { page: 'gallery', icon: Image, label: 'Galería' },
    chatbot: { page: 'chatbot', icon: Bot, label: 'Chat IA' },
    home_inventory: { page: 'home_inventory', icon: Package, label: 'Inventario Hogar' },
    home_maintenance: { page: 'home_maintenance', icon: Wrench, label: 'Mantenimiento' },
    subscriptions: { page: 'subscriptions', icon: CreditCard, label: 'Suscripciones' },
    pet_tracker: { page: 'pet_tracker', icon: Dog, label: 'Mascotas' },
    travel_manager: { page: 'travel_manager', icon: Plane, label: 'Viajes' },
    savings_goals: { page: 'savings_goals', icon: PiggyBank, label: 'Ahorros' },
    internal_debts: { page: 'internal_debts', icon: TrendingUp, label: 'Deudas' },
    utility_bills: { page: 'utility_bills', icon: Zap, label: 'Facturas' },
    family_library: { page: 'family_library', icon: Library, label: 'Biblioteca' },
    extra_school: { page: 'extra_school', icon: GraduationCap, label: 'Extraescolares' },
    work_hours: { page: 'work_hours', icon: Clock, label: 'Horas Trabajo' },
    sales: { page: 'sales', icon: DollarSign, label: 'Ventas' },
    interesting_places: { page: 'interesting_places', icon: MapPin, label: 'Lugares de Interés' },
    family_organization: { page: 'family_organization', icon: Users, label: 'Org. Familiar' },
    indulgences: { page: 'indulgences', icon: Heart, label: 'Indulgencias' },
    howitworks: { page: 'howitworks', icon: BookOpen, label: 'Cómo funciona' },
    about: { page: 'about', icon: Info, label: 'Acerca de' },
    terms: { page: 'terms', icon: FileText, label: 'Términos' },
    privacy: { page: 'privacy', icon: ShieldCheck, label: 'Privacidad' },
  };

  const allModules = [
    { key: 'dashboard', page: 'dashboard', icon: Home, label: 'Dashboard' },
    { key: 'accounting', page: 'accounting', icon: Wallet, label: 'Contabilidad' },
    { key: 'budgets', page: 'budgets', icon: Target, label: 'Presupuestos' },
    { key: 'agenda', page: 'agenda', icon: Calendar, label: 'Agenda' },
    { key: 'shopping', page: 'shopping', icon: ShoppingCart, label: 'Lista Compra' },
    { key: 'tasks', page: 'tasks', icon: ListChecks, label: 'Tareas' },
    { key: 'habits', page: 'habits', icon: CheckCircle, label: 'Hábitos' },
    { key: 'notes', page: 'notes', icon: StickyNote, label: 'Notas' },
    { key: 'meals', page: 'meals', icon: ChefHat, label: 'Comidas' },
    { key: 'birthdays', page: 'birthdays', icon: Cake, label: 'Cumpleaños' },
    { key: 'anniversaries', page: 'anniversaries', icon: CalendarHeart, label: 'Aniversarios' },
    { key: 'books_movies', page: 'books_movies', icon: BookOpen, label: 'Libros y Películas' },
    { key: 'gifts', page: 'gifts', icon: Gift, label: 'Regalos' },
    { key: 'restaurants', page: 'restaurants', icon: UtensilsCrossed, label: 'Restaurantes' },
    { key: 'contacts', page: 'contacts', icon: Users, label: 'Contactos' },
    { key: 'gallery', page: 'gallery', icon: Image, label: 'Galería' },
    { key: 'chatbot', page: 'chatbot', icon: Bot, label: 'Chat IA' },
    { key: 'home_inventory', page: 'home_inventory', icon: Package, label: 'Inventario Hogar' },
    { key: 'home_maintenance', page: 'home_maintenance', icon: Wrench, label: 'Mantenimiento' },
    { key: 'subscriptions', page: 'subscriptions', icon: CreditCard, label: 'Suscripciones' },
    { key: 'pet_tracker', page: 'pet_tracker', icon: Dog, label: 'Mascotas' },
    { key: 'travel_manager', page: 'travel_manager', icon: Plane, label: 'Viajes' },
    { key: 'savings_goals', page: 'savings_goals', icon: PiggyBank, label: 'Ahorros' },
    { key: 'internal_debts', page: 'internal_debts', icon: TrendingUp, label: 'Deudas' },
    { key: 'utility_bills', page: 'utility_bills', icon: Zap, label: 'Facturas' },
    { key: 'family_library', page: 'family_library', icon: Library, label: 'Biblioteca' },
    { key: 'extra_school', page: 'extra_school', icon: GraduationCap, label: 'Extraescolares' },
    { key: 'work_hours', page: 'work_hours', icon: Clock, label: 'Horas Trabajo' },
    { key: 'sales', page: 'sales', icon: DollarSign, label: 'Ventas' },
    { key: 'interesting_places', page: 'interesting_places', icon: MapPin, label: 'Lugares de Interés' },
    { key: 'family_organization', page: 'family_organization', icon: Users, label: 'Org. Familiar' },
    { key: 'indulgences', page: 'indulgences', icon: Heart, label: 'Indulgencias' },
    { key: 'howitworks', page: 'howitworks', icon: BookOpen, label: 'Cómo funciona' },
    { key: 'about', page: 'about', icon: Info, label: 'Acerca de' },
    { key: 'terms', page: 'terms', icon: FileText, label: 'Términos' },
    { key: 'privacy', page: 'privacy', icon: ShieldCheck, label: 'Privacidad' },
  ];

  // Removed premium pages effect as tabs are now always visible

  const isExpanded = isMobile || isHovered;

  const navItemClasses = (page: string) => {
    const isActive = activePage === page;
    return `w-full flex items-center gap-3 rounded-xl transition-all duration-200 group ${
      isActive
        ? 'bg-gradient-to-r from-primary to-indigo-500 text-white shadow-lg shadow-primary/20'
        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80'
    } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`;
  };

  return (
    <aside
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      className={`glass-strong h-screen fixed left-0 top-0 flex flex-col transition-all duration-300 ease-out ${
        isExpanded ? 'w-60' : 'w-16'
      } ${isMobile ? 'w-64 shadow-glass-lg' : 'shadow-glass'}`}
      style={{ zIndex: 50 }}
    >
      {/* Header */}
      <div className={`border-b transition-all duration-300 ${isExpanded ? 'p-4' : 'p-3'}`} style={{ borderColor: 'var(--color-sidebar-border)' }}>
        {isExpanded ? (
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent truncate tracking-tight">
            {profile.family_name}
          </h1>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {profile.family_name?.[0]?.toUpperCase() || 'F'}
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className={`flex-1 transition-all duration-300 overflow-y-auto ${isExpanded ? 'p-3' : 'p-2'}`}>
        <ul className="space-y-0.5">
          {isAdmin && (
            <li>
              <button
                onClick={() => onNavigate('admin')}
                className={navItemClasses('admin')}
                title={isExpanded ? undefined : 'Admin'}
              >
                <Shield size={18} className={activePage === 'admin' ? '' : 'text-amber-500'} />
                {isExpanded && <span className="text-sm font-medium">Admin</span>}
              </button>
            </li>
          )}
          
          <li>
            <button
              onClick={() => onNavigate('dashboard')}
              className={navItemClasses('dashboard')}
              title={isExpanded ? undefined : 'Dashboard'}
            >
              <Home size={18} />
              {isExpanded && <span className="text-sm font-medium">Dashboard</span>}
            </button>
          </li>
          
          {getModuleOrder().filter(key => key !== 'dashboard' && key !== 'terms' && key !== 'privacy' && key !== 'about' && key !== 'howitworks' && key !== 'sales').map((moduleKey) => {
            const module = moduleMap[moduleKey];
            if (!module) return null;
            const Icon = module.icon;
            return (
              <li key={moduleKey}>
                <button
                  onClick={() => onNavigate(module.page as any)}
                  className={navItemClasses(module.page)}
                  title={isExpanded ? undefined : module.label}
                >
                  <Icon size={18} />
                  {isExpanded && <span className="text-sm font-medium">{module.label}</span>}
                </button>
              </li>
            );
          })}
          
          {/* Divider */}
          <li className="pt-2 pb-1">
            {isExpanded && (
              <div className="h-px mx-2 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            )}
          </li>

          {!globalHiddenModules.includes('about') && (
            <li>
              <button
                onClick={() => onNavigate('about')}
                className={navItemClasses('about')}
                title={isExpanded ? undefined : 'Acerca de'}
              >
                <Info size={18} />
                {isExpanded && <span className="text-sm font-medium">Acerca de</span>}
              </button>
            </li>
          )}
          {!globalHiddenModules.includes('howitworks') && (
            <li>
              <button
                onClick={() => onNavigate('howitworks')}
                className={navItemClasses('howitworks')}
                title={isExpanded ? undefined : 'Cómo funciona'}
              >
                <BookOpen size={18} />
                {isExpanded && <span className="text-sm font-medium">Cómo funciona</span>}
              </button>
            </li>
          )}
          {!globalHiddenModules.includes('privacy') && (
            <li>
              <button
                onClick={() => onNavigate('privacy')}
                className={navItemClasses('privacy')}
                title={isExpanded ? undefined : 'Privacidad'}
              >
                <ShieldCheck size={18} />
                {isExpanded && <span className="text-sm font-medium">Privacidad</span>}
              </button>
            </li>
          )}
          {!globalHiddenModules.includes('terms') && (
            <li>
              <button
                onClick={() => onNavigate('terms')}
                className={navItemClasses('terms')}
                title={isExpanded ? undefined : 'Términos'}
              >
                <FileText size={18} />
                {isExpanded && <span className="text-sm font-medium">Términos</span>}
              </button>
            </li>
          )}
          {!globalHiddenModules.includes('sales') && (
            <li>
              <button
                onClick={() => onNavigate('sales')}
                className={navItemClasses('sales')}
                title={isExpanded ? undefined : 'Ventas'}
              >
                <DollarSign size={18} />
                {isExpanded && <span className="text-sm font-medium">Ventas</span>}
              </button>
            </li>
          )}
          <li>
            <button
              onClick={() => onNavigate('modules')}
              className={navItemClasses('modules')}
              title={isExpanded ? undefined : 'Módulos'}
            >
              <Settings size={18} />
              {isExpanded && <span className="text-sm font-medium">Módulos</span>}
            </button>
          </li>

          {/* Divider */}
          <li className="pt-2 pb-1">
            {isExpanded && (
              <div className="h-px mx-2 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            )}
          </li>

          {/* Profile */}
          <li>
            <button
              onClick={() => onNavigate('profile')}
              className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 ${
                activePage === 'profile'
                  ? 'bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700'
              } ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}`}
              title={isExpanded ? undefined : (profile.name || 'Mi perfil')}
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/50 shadow-sm" />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activePage === 'profile' ? 'bg-white/20' : 'bg-gradient-to-br from-primary/10 to-purple-500/10'
                }`}>
                  <User size={16} className={activePage === 'profile' ? 'text-white' : 'text-primary'} />
                </div>
              )}
              {isExpanded && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold truncate">{profile.name || 'Mi perfil'}</p>
                  <p className="text-xs opacity-60 truncate">{profile.family_name}</p>
                </div>
              )}
              {isExpanded && onLogout && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogout();
                  }}
                  className={`ml-auto p-1.5 rounded-lg transition-all duration-200 ${
                    activePage === 'profile'
                      ? 'hover:bg-white/20 text-white'
                      : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                  }`}
                  title="Cerrar sesión"
                >
                  <LogOut size={16} />
                </button>
              )}
            </button>
          </li>
          {!isMobile && onLogout && !isExpanded && (
            <li>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}
