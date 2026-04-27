import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Accounting } from './pages/Accounting';

import { Budgets } from './pages/Budgets';
import { Profile } from './pages/Profile';
import { Agenda } from './pages/Agenda';
import { ShoppingList } from './pages/ShoppingList';
import { FamilyTasks } from './pages/FamilyTasks';
import { Notes } from './pages/Notes';
import { MealPlanning } from './pages/MealPlanning';
import { Birthdays } from './pages/Birthdays';
import Anniversaries from './pages/Anniversaries';
import { BooksMovies } from './pages/BooksMovies';
import { AdminPage } from './pages/AdminPage';
import { About } from './pages/About';
import { HowItWorks } from './pages/HowItWorks';
import { FavoriteRestaurants } from './pages/FavoriteRestaurants';
import { FamilyGallery } from './pages/FamilyGallery';
import { Premium } from './pages/Premium';
import { ChatBotPage } from './pages/ChatBotPage';
import { SalesContact } from './pages/SalesContact';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Contact } from './pages/Contact';
import { Gifts } from './pages/Gifts';
import { HomeInventory } from './pages/HomeInventory';
import { HomeMaintenance } from './pages/HomeMaintenance';
import { SubscriptionManager } from './pages/SubscriptionManager';
import { PetTracker } from './pages/PetTracker';
import { TravelManager } from './pages/TravelManager';
import { SavingsGoals } from './pages/SavingsGoals';
import { InternalDebts } from './pages/InternalDebts';
import { UtilityBills } from './pages/UtilityBills';
import { FamilyLibrary } from './pages/FamilyLibrary';
import { ExtraSchoolManager } from './pages/ExtraSchoolManager';
import { HabitTracker } from './pages/HabitTracker';
import { ModuleManager } from './pages/ModuleManager';
import { WorkHours } from './pages/WorkHours';
import { SitesOfInterest } from './pages/SitesOfInterest';
import { FamilyOrganization } from './pages/FamilyOrganization';
import Indulgences from './pages/Indulgences';
import { ChatWidget } from './components/ChatWidget';
import { Login, useAuth, AuthProvider } from './components/Auth';
import { Menu, X } from 'lucide-react';

type PageType = 'dashboard' | 'accounting' | 'budgets' | 'profile' | 'agenda' | 'shopping' | 'tasks' | 'notes' | 'admin' | 'about' | 'restaurants' | 'howitworks' | 'gallery' | 'contacts' | 'terms' | 'privacy' | 'contact' | 'meals' | 'birthdays' | 'anniversaries' | 'books_movies' | 'chatbot' | 'sales' | 'gifts' | 'habits' | 'home_inventory' | 'home_maintenance' | 'subscriptions' | 'pet_tracker' | 'travel_manager' | 'savings_goals' | 'internal_debts' | 'utility_bills' | 'family_library' | 'extra_school' | 'modules' | 'work_hours' | 'interesting_places' | 'family_organization' | 'indulgences';

function AppContent() {
  const [activePage, setActivePage] = useState<PageType>(() => {
    const saved = localStorage.getItem('lastPage');
    return (saved as PageType) || 'dashboard';
  });
  const { isAuthenticated, isAdmin, login, logout } = useAuth();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalHiddenModules, setGlobalHiddenModules] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/global-hidden-modules`, { headers: { 'Authorization': localStorage.getItem('token') || '' } })
      .then(res => res.json())
      .then(data => setGlobalHiddenModules(data))
      .catch(console.error);
  }, []);

  const handleNavigate = (page: PageType) => {
    if (globalHiddenModules.includes(page)) {
      setActivePage('dashboard');
      return;
    }
    setActivePage(page);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    if (globalHiddenModules.includes(activePage)) {
      setActivePage('dashboard');
    }
  }, [globalHiddenModules]);

  useEffect(() => {
    localStorage.setItem('lastPage', activePage);
  }, [activePage]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      handleNavigate(hash as PageType);
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        handleNavigate(hash as PageType);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  }, [activePage]);

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-3 left-3 z-50 flex gap-2">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="glass-strong text-slate-700 p-2.5 rounded-xl shadow-soft active:scale-95 transition-all duration-200"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Desktop sidebar */}
      <div
        className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 hidden lg:block fixed inset-y-0 left-0 transition-transform duration-300 ease-out z-50`}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
      >
        <Sidebar 
          activePage={activePage} 
          onNavigate={handleNavigate} 
          onLogout={logout} 
          isAdmin={isAdmin}
        />
      </div>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 animate-slide-in-left">
          <Sidebar 
            activePage={activePage} 
            onNavigate={handleNavigate} 
            onLogout={logout} 
            isAdmin={isAdmin}
            isMobile={true}
          />
        </div>
      )}
      
      {/* Main content */}
      <main className={`transition-all duration-300 ease-out pt-14 lg:pt-0 ${isSidebarHovered ? 'lg:ml-60' : 'lg:ml-16'} ml-0 min-h-screen`}>
        <div className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto overflow-x-hidden page-enter">
          {activePage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {activePage === 'accounting' && <Accounting />}
          {activePage === 'budgets' && <Budgets />}

          {activePage === 'profile' && <Profile />}
          {activePage === 'agenda' && <Agenda />}
          {activePage === 'shopping' && <ShoppingList />}
          {activePage === 'tasks' && <FamilyTasks />}
          {activePage === 'notes' && <Notes />}
          {activePage === 'meals' && <MealPlanning />}
          {activePage === 'birthdays' && <Birthdays />}
          {activePage === 'anniversaries' && <Anniversaries />}
          {activePage === 'books_movies' && <BooksMovies />}
          {activePage === 'admin' && isAdmin && <AdminPage />}
          {activePage === 'about' && <About />}
          {activePage === 'howitworks' && <HowItWorks />}
          {activePage === 'restaurants' && <FavoriteRestaurants />}
          {activePage === 'gallery' && <FamilyGallery />}
          {activePage === 'contacts' && <Premium />}
          {activePage === 'chatbot' && <ChatBotPage />}
          {activePage === 'gifts' && <Gifts />}
          {activePage === 'habits' && <HabitTracker />}
          {activePage === 'sales' && <SalesContact />}
          {activePage === 'terms' && <Terms />}
          {activePage === 'privacy' && <Privacy />}
          {activePage === 'contact' && <Contact />}
          {activePage === 'home_inventory' && <HomeInventory />}
          {activePage === 'home_maintenance' && <HomeMaintenance />}
          {activePage === 'subscriptions' && <SubscriptionManager />}
          {activePage === 'pet_tracker' && <PetTracker />}
          {activePage === 'travel_manager' && <TravelManager />}
          {activePage === 'savings_goals' && <SavingsGoals />}
          {activePage === 'internal_debts' && <InternalDebts />}
          {activePage === 'utility_bills' && <UtilityBills />}
          {activePage === 'family_library' && <FamilyLibrary />}
          {activePage === 'extra_school' && <ExtraSchoolManager />}
          {activePage === 'modules' && <ModuleManager />}
          {activePage === 'work_hours' && <WorkHours />}
          {activePage === 'interesting_places' && <SitesOfInterest />}
          {activePage === 'family_organization' && <FamilyOrganization />}
          {activePage === 'indulgences' && <Indulgences />}
        </div>
      </main>

      <ChatWidget hidden={activePage === 'contacts'} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
