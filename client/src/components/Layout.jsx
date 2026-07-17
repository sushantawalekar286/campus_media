import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import logo from '../../../logo.png';
import { 
  Home, 
  Compass, 
  Briefcase, 
  MessageSquare, 
  Bell, 
  Users, 
  User, 
  Bot,
  LogOut, 
  Menu, 
  X,
  ShieldCheck,
  FileText,
  Mic,
  Map,
  Sparkles,
  Plus,
  BookOpen,
  Settings
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { useSocketStore } from '../store/socketStore';
import { usePostStore } from '../store/postStore';

export const Layout = () => {
  const { currentUser, logout } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const connectSocket = useSocketStore(state => state.connectSocket);
  const disconnectSocket = useSocketStore(state => state.disconnectSocket);

  useEffect(() => {
    if (!currentUser) return;
    const socket = connectSocket();

    if (socket) {
      // 1. Post Created Listener
      socket.on('post_created', (post) => {
        console.log('⚡ Real-time post_created received:', post);
        usePostStore.setState(state => {
          if (state.feed.some(p => p._id === post._id)) return state;
          return { feed: [post, ...state.feed] };
        });
      });

      // 2. Post Deleted Listener
      socket.on('post_deleted', (postId) => {
        console.log('⚡ Real-time post_deleted received:', postId);
        usePostStore.setState(state => ({
          feed: state.feed.filter(p => p._id !== postId),
          explore: state.explore.filter(p => p._id !== postId),
          trending: state.trending.filter(p => p._id !== postId)
        }));
      });

      // 3. Post Updated Listener (Likes, Comments, Edits)
      socket.on('post_updated', (updatedPost) => {
        console.log('⚡ Real-time post_updated received:', updatedPost);
        usePostStore.setState(state => ({
          feed: state.feed.map(p => p._id === updatedPost._id ? updatedPost : p),
          explore: state.explore.map(p => p._id === updatedPost._id ? updatedPost : p),
          trending: state.trending.map(p => p._id === updatedPost._id ? updatedPost : p)
        }));
      });
    }

    return () => {
      if (socket) {
        socket.off('post_created');
        socket.off('post_deleted');
        socket.off('post_updated');
      }
    };
  }, [currentUser, connectSocket]);

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/');
  };

  const MAIN_ITEMS = [
    { label: 'Home', path: '/feed', icon: Home },
    { label: 'Network', path: '/network', icon: Users },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Resources', path: '/resources', icon: BookOpen },
    { label: 'Jobs', path: '/jobs', icon: Briefcase },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Profile', path: '/profile', icon: User },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const AI_ITEMS = [
    { label: 'AI Mentor', path: '/ai-mentor', icon: Bot },
    { label: 'Resume Analyzer', path: '/resume', icon: FileText },
    { label: 'Mock Interview', path: '/interview', icon: Mic },
    { label: 'Roadmap Generator', path: '/roadmap', icon: Map },
  ];

  if (currentUser?.role === UserRole.ADMIN) {
    MAIN_ITEMS.push({ label: 'Admin Panel', path: '/admin', icon: ShieldCheck });
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-indigo-900 text-white shadow-lg">
        <div className="p-6 border-b border-indigo-800 flex items-center gap-2">
          <img src={logo} alt="Campus Media Logo" className="w-8 h-8 object-contain rounded-lg bg-white p-0.5" />
          <span className="font-bold text-xl tracking-tight">Campus Media</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="mb-2 text-xs font-bold text-indigo-300/50 uppercase tracking-wider px-4">Menu</div>
          {MAIN_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-indigo-700 text-white shadow-md'
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}

          <div className="mt-6 mb-2 text-xs font-bold text-indigo-300/50 uppercase tracking-wider px-4 flex items-center gap-2">
            <Sparkles size={12} className="text-purple-400" /> AI Tools
          </div>
          <div className="space-y-1 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl pointer-events-none" />
            {AI_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group overflow-hidden border border-transparent ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border-indigo-400/30'
                      : 'text-indigo-100 hover:bg-white/5 hover:border-white/10'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <item.icon size={20} className={isActive ? 'text-white' : 'text-purple-300 group-hover:text-purple-200'} />
                    <span className="font-semibold text-sm z-10">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <Link
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 mb-2 hover:bg-indigo-800/50 rounded-xl transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold group-hover:scale-110 transition-transform">
              {(currentUser?.fullname || currentUser?.name || 'U').charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-sm font-medium truncate group-hover:text-indigo-200 transition-colors">
                 {currentUser?.fullname || currentUser?.name}
               </p>
               <p className="text-xs text-indigo-300 truncate">
                 {currentUser?.role === UserRole.STUDENT && currentUser.year ? currentUser.year : currentUser?.role}
               </p>
            </div>
          </Link>
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
             <img src={logo} alt="Campus Media Logo" className="w-8 h-8 object-contain rounded-lg bg-white p-0.5" />
             <span className="font-bold text-lg">Campus Media</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-10 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="absolute top-16 right-0 w-64 bg-white h-full shadow-xl p-4 flex flex-col" onClick={e => e.stopPropagation()}>
              <nav className="space-y-2 overflow-y-auto custom-scrollbar">
                <div className="mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider px-4">Menu</div>
                {MAIN_ITEMS.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isActive ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`
                    }
                  >
                    <item.icon size={20} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </NavLink>
                ))}
                
                <div className="mt-4 mb-2 text-xs font-bold text-purple-500 uppercase tracking-wider px-4 flex items-center gap-2">
                  <Sparkles size={12} /> AI Tools
                </div>
                {AI_ITEMS.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive 
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 font-bold border border-indigo-100 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon size={20} className={isActive ? 'text-purple-600' : 'text-purple-500'} />
                        <span className="font-medium text-sm">{item.label}</span>
                      </>
                    )}
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
