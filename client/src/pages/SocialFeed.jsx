import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Heart, MessageCircle, Share2, Send, MoreHorizontal } from 'lucide-react';
import api from '../api/apiClient';

export const SocialFeed = () => {
  const { currentUser } = useApp();
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/posts', {
        content: newPostContent,
        visibility: 'public'
      });
      setPosts([res.data, ...posts]);
      setNewPostContent('');
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPosts(posts.map(p => p.id === postId || p._id === postId ? res.data : p));
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 flex-shrink-0">
            {currentUser?.fullname?.charAt(0) || currentUser?.name?.charAt(0) || 'U'}
          </div>
          <form onSubmit={handlePostSubmit} className="flex-1 space-y-3">
            <textarea
              placeholder="What's on your mind?"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <div className="text-slate-400"></div>
              <button
                type="submit"
                disabled={isSubmitting || !newPostContent.trim()}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? 'Posting...' : <><Send size={16} /> Post</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center p-8 text-slate-500 bg-white rounded-xl border border-slate-100">
            No posts yet. Be the first to share something!
          </div>
        ) : (
          posts.map(post => {
            const isLiked = post.likes?.includes(currentUser?.id || currentUser?._id);
            return (
              <div key={post.id || post._id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                      {post.authorName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{post.authorName}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                
                <p className="text-slate-700 whitespace-pre-wrap mb-4">{post.content}</p>
                
                <div className="flex items-center gap-6 pt-3 border-t border-slate-50 text-slate-500">
                  <button 
                    onClick={() => handleLike(post.id || post._id)} 
                    className={`flex items-center gap-1.5 hover:text-indigo-600 transition-colors ${isLiked ? 'text-indigo-600' : ''}`}
                  >
                    <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                    <span className="text-sm font-medium">{post.likes?.length || 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                    <MessageCircle size={18} />
                    <span className="text-sm font-medium">{post.comments?.length || 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors ml-auto">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
