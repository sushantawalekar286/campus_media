import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Mic,
  Briefcase, 
  BookOpen, 
  LogOut, 
  Menu, 
  X,
  ShieldCheck,
  Users,
  Map
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

export const Layout = () => {
  const { currentUser, logout } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NAV_ITEMS = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Resume AI', path: '/resume', icon: FileText },
    { label: 'Voice Interview', path: '/interview', icon: Mic },
    { label: 'Career Roadmap', path: '/roadmap', icon: Map },
    { label: 'Mentorship Chat', path: '/chat', icon: Users },
    { label: 'Question Bank', path: '/questions', icon: BookOpen },
    { label: 'Job Board', path: '/jobs', icon: Briefcase },
  ];

  if (currentUser?.role === UserRole.ADMIN) {
    NAV_ITEMS.push({ label: 'Admin Panel', path: '/admin', icon: ShieldCheck });
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-indigo-900 text-white shadow-lg">
        <div className="p-6 border-b border-indigo-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-indigo-900 font-bold text-lg">C</span>
          </div>
          <span className="font-bold text-xl tracking-tight">Campus Media</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-700 text-white shadow-md'
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-sm font-medium truncate">{currentUser?.name}</p>
               <p className="text-xs text-indigo-300 truncate">
                 {currentUser?.role === UserRole.STUDENT && currentUser.year ? currentUser.year : currentUser?.role}
               </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2 text-indigo-200 hover:text-white hover:bg-indigo-800 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header & Overlay */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="md:hidden bg-indigo-900 text-white p-4 flex items-center justify-between shadow-md z-20">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                 <span className="text-indigo-900 font-bold">C</span>
             </div>
             <span className="font-bold text-lg">Campus Media</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="absolute top-16 right-0 w-64 bg-white h-full shadow-xl p-4 flex flex-col" onClick={e => e.stopPropagation()}>
              <nav className="space-y-2">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive ? 'bg-indigo-100 text-indigo-900' : 'text-slate-600 hover:bg-slate-50'
                      }`
                    }
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg mt-4"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Sign Out</span>
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
