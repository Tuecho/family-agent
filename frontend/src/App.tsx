import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Accounting } from './pages/Accounting';
import { ChatBotPage } from './pages/ChatBotPage';
import { Budgets } from './pages/Budgets';
import { Profile } from './pages/Profile';
import { Agenda } from './pages/Agenda';
import { Tasks } from './pages/Tasks';
import { AdminPage } from './pages/AdminPage';
import { FAQ } from './pages/FAQ';
import { About } from './pages/About';
import { ChatWidget } from './components/ChatWidget';
import { Login, useAuth, AuthProvider } from './components/Auth';
import { Menu, X } from 'lucide-react';

function AppContent() {
  const [activePage, setActivePage] = useState<'dashboard' | 'accounting' | 'chatbot' | 'budgets' | 'profile' | 'agenda' | 'tasks' | 'admin' | 'faq' | 'about'>('dashboard');
  const { isAuthenticated, isAdmin, login, logout } = useAuth();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(false);
    }
  }, [activePage]);

  const handleNavigate = (page: typeof activePage) => {
    setActivePage(page);
    setIsMobileMenuOpen(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return (
    <div className="min-h-screen">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white p-3 rounded-lg shadow-lg"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        className={`${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 hidden lg:block fixed inset-y-0 left-0 transition-transform duration-200 z-50`}
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

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-64">
          <Sidebar 
            activePage={activePage} 
            onNavigate={handleNavigate} 
            onLogout={logout} 
            isAdmin={isAdmin}
            isMobile={true}
          />
        </div>
      )}
      
      <main className={`transition-all duration-200 pt-16 lg:pt-0 ${isSidebarHovered ? 'lg:ml-60' : 'lg:ml-16'} ml-0`}>
        <div className="p-4 md:p-6">
          {activePage === 'dashboard' && <Dashboard />}
          {activePage === 'accounting' && <Accounting />}
          {activePage === 'budgets' && <Budgets />}
          {activePage === 'chatbot' && <ChatBotPage />}
          {activePage === 'profile' && <Profile />}
          {activePage === 'agenda' && <Agenda />}
          {activePage === 'tasks' && <Tasks />}
          {activePage === 'admin' && isAdmin && <AdminPage />}
          {activePage === 'faq' && <FAQ />}
          {activePage === 'about' && <About />}
        </div>
      </main>

      <ChatWidget />
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
