import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, User, MapPin, Sparkles, UserCheck, UserPlus, GraduationCap } from 'lucide-react';
import apiClient from '../api/apiClient';

export const ExplorePage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await apiClient.get('/users/suggestions');
        setSuggestions(res.data || []);
      } catch (err) {
        console.error('Failed to load suggestions:', err);
      }
    };
    fetchSuggestions();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/users/search?query=${encodeURIComponent(query)}`);
      setResults(res.data || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
          <Compass size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Discover Campus Students</h1>
          <p className="text-slate-500 text-sm">Search and connect with classmates, alumni, and peers.</p>
        </div>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="relative mb-8 max-w-2xl">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, username, department, or skill (e.g. React)..."
            className="w-full pl-12 pr-24 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </form>

      {/* Search Results */}
      {query.trim() && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>Search Results ({results.length})</span>
          </h2>
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((user) => (
                <StudentCard key={user._id || user.id} user={user} navigate={navigate} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto">
              <User size={40} className="mx-auto text-slate-300 mb-2" />
              <h3 className="font-bold text-slate-700">No users found</h3>
              <p className="text-slate-500 text-xs mt-1">Try expanding your query parameters or look at different skills.</p>
            </div>
          )}
        </div>
      )}

      {/* Suggested Students */}
      {!query.trim() && (
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600" />
            <span>Recommended Connections</span>
          </h2>
          {suggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((user) => (
                <StudentCard key={user._id || user.id} user={user} navigate={navigate} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto">
              <User size={40} className="mx-auto text-slate-300 mb-2" />
              <h3 className="font-bold text-slate-700">No suggestions available</h3>
              <p className="text-slate-500 text-xs mt-1">Suggestions will populate as more users register on the campus media hub.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StudentCard = ({ user, navigate }) => {
  const profileId = user.username || user._id || user.id;
  return (
    <div 
      onClick={() => navigate(`/profile/${profileId}`)}
      className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group h-full relative"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-indigo-50 border border-slate-100 flex-shrink-0 flex items-center justify-center shadow-sm">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={user.fullname} className="w-full h-full object-cover" />
          ) : (
            <div className="text-indigo-600 font-bold text-xl">
              {(user.fullname || user.username || 'U').charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800 text-base truncate group-hover:text-indigo-600 transition-colors">
            {user.fullname || user.username}
          </h3>
          <p className="text-xs font-semibold text-slate-500 truncate mt-0.5">
            @{user.username || 'user'}
          </p>
          <p className="text-xs text-slate-600 mt-1 font-medium line-clamp-2">
            {user.headline || 'Student at University'}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
          {user.department || 'General'}
        </span>
        <button 
          className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors flex items-center gap-0.5"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/profile/${profileId}`);
          }}
        >
          View Profile
        </button>
      </div>
    </div>
  );
};
