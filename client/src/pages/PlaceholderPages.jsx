import React from 'react';
import { Compass, Users, Bell, MessageSquare } from 'lucide-react';

export const ExplorePage = () => (
  <div className="flex flex-col items-center justify-center h-[80vh] text-center max-w-md mx-auto">
    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
      <Compass size={40} className="text-indigo-600" />
    </div>
    <h2 className="text-2xl font-bold text-slate-800 mb-2">Explore Campus Media</h2>
    <p className="text-slate-500">Discover trending companies, upcoming events, and popular PYQs shared by the community.</p>
  </div>
);

export const MessagesPage = () => (
  <div className="flex flex-col items-center justify-center h-[80vh] text-center max-w-md mx-auto">
    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
      <MessageSquare size={40} className="text-blue-600" />
    </div>
    <h2 className="text-2xl font-bold text-slate-800 mb-2">Real-time Messaging</h2>
    <p className="text-slate-500">Connect directly with students and alumni. Our new Socket.io messaging system is rolling out soon.</p>
  </div>
);

export const NotificationsPage = () => (
  <div className="flex flex-col items-center justify-center h-[80vh] text-center max-w-md mx-auto">
    <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
      <Bell size={40} className="text-orange-600" />
    </div>
    <h2 className="text-2xl font-bold text-slate-800 mb-2">Notifications</h2>
    <p className="text-slate-500">Stay updated on likes, comments, and connection requests from your network.</p>
  </div>
);

export const ConnectionsPage = () => (
  <div className="flex flex-col items-center justify-center h-[80vh] text-center max-w-md mx-auto">
    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
      <Users size={40} className="text-green-600" />
    </div>
    <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Network</h2>
    <p className="text-slate-500">Manage connection requests, find alumni, and grow your professional network.</p>
  </div>
);
