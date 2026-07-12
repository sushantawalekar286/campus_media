import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostStore } from '../store/postStore';
import { 
  Heart, MessageCircle, Share2, Bookmark, Building, 
  Briefcase, FileText, CheckCircle2, MoreVertical, 
  Trash2, Edit3, Send, Download, ExternalLink, Globe 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../api/apiClient';

export const PostCard = ({ post, onDelete, onUpdate }) => {
  const navigate = useNavigate();
  const { toggleLike, addComment, fetchComments, deletePost, updatePost } = usePostStore();
  const { currentUser } = useApp();

  const navigateToProfile = (userObjOrId) => {
    if (!userObjOrId) return;
    const identifier = typeof userObjOrId === 'object'
      ? (userObjOrId.username || userObjOrId._id || userObjOrId.id)
      : userObjOrId;
    if (identifier) {
      navigate(`/profile/${identifier}`);
    }
  };

  const [liked, setLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  // Options menu (edit/delete)
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Connection State & Handlers
  const [connState, setConnState] = useState(post.userId?.connectionStatus || 'none');
  const [isConnLoading, setIsConnLoading] = useState(false);

  useEffect(() => {
    setConnState(post.userId?.connectionStatus || 'none');
  }, [post]);

  const authorId = post.userId?._id || post.userId?.id || post.userId;
  const isSelf = currentUser && (currentUser._id === authorId || currentUser.id === authorId);

  const handleConnect = async () => {
    if (isConnLoading) return;
    setIsConnLoading(true);
    try {
      if (connState === 'none') {
        await api.post(`/users/follow/${authorId}`);
        setConnState('pending');
      } else if (connState === 'pending') {
        await api.delete(`/users/unfollow/${authorId}`);
        setConnState('none');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsConnLoading(false);
    }
  };

  const handleAccept = async () => {
    if (isConnLoading) return;
    setIsConnLoading(true);
    try {
      await api.post(`/users/connections/accept/${authorId}`);
      setConnState('accepted');
    } catch (e) {
      console.error(e);
    } finally {
      setIsConnLoading(false);
    }
  };

  const handleReject = async () => {
    if (isConnLoading) return;
    setIsConnLoading(true);
    try {
      await api.post(`/users/connections/reject/${authorId}`);
      setConnState('none');
    } catch (e) {
      console.error(e);
    } finally {
      setIsConnLoading(false);
    }
  };

  useEffect(() => {
    setLiked(post.isLiked || false);
    setLikesCount(post.likesCount || 0);
    setCommentsCount(post.commentsCount || 0);
    setEditCaption(post.caption || '');
  }, [post]);

  const handleLike = async () => {
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
    try {
      await toggleLike(post._id);
    } catch (e) {
      setLiked(liked);
      setLikesCount(prev => liked ? prev + 1 : prev - 1);
    }
  };

  const handleToggleComments = async () => {
    const nextShow = !showComments;
    setShowComments(nextShow);
    if (nextShow && comments.length === 0) {
      setLoadingComments(true);
      try {
        const list = await fetchComments(post._id);
        setComments(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const tempText = newComment;
    setNewComment('');
    try {
      const added = await addComment(post._id, tempText);
      setComments(prev => [...prev, added]);
      setCommentsCount(prev => prev + 1);
    } catch (err) {
      console.error(err);
      alert('Failed to send comment. Please try again.');
      setNewComment(tempText);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost(post._id);
      if (onDelete) onDelete(post._id);
    } catch (err) {
      console.error(err);
      alert('Failed to delete post.');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editCaption.trim()) return;
    setIsUpdating(true);
    try {
      const updated = await updatePost(post._id, { caption: editCaption });
      setIsEditing(false);
      if (onUpdate) onUpdate(updated);
    } catch (err) {
      console.error(err);
      alert('Failed to update post.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const isAuthor = currentUser && (
    currentUser._id === post.userId?._id || 
    currentUser.id === post.userId?._id || 
    currentUser._id === post.userId || 
    currentUser.id === post.userId
  );
  
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all p-5 mb-5 group relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div 
            onClick={() => navigateToProfile(post.userId)}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-50 to-purple-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm text-indigo-600 font-bold text-lg cursor-pointer hover:scale-105 transition-transform"
          >
            {post.userId?.profilePicture ? (
              <img src={post.userId.profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              getInitials(post.userId?.fullname || post.userId?.name)
            )}
          </div>
          <div>
            <h4 
              onClick={() => navigateToProfile(post.userId)}
              className="font-bold text-slate-800 text-[15px] hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {post.userId?.fullname || post.userId?.name || 'Unknown User'}
              {post.userId?.isVerified && <CheckCircle2 size={14} className="fill-blue-500 text-white" />}
            </h4>
            <div className="flex flex-wrap items-center gap-1 text-[12px] text-slate-500 font-medium mt-0.5">
              <span>{post.userId?.department || 'Student'}</span>
              <span>•</span>
              <span>{post.userId?.year || '1st Year'}</span>
              <span>•</span>
              <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
              {post.userId?.mutualConnectionCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-indigo-600 font-semibold">{post.userId.mutualConnectionCount} mutual connections</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Connection Actions */}
          {!isSelf && (
            <div className="flex items-center gap-1.5 mr-2">
              {connState === 'none' && (
                <button
                  onClick={handleConnect}
                  disabled={isConnLoading}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-indigo-600/10"
                >
                  Connect
                </button>
              )}
              {connState === 'pending' && (
                <button
                  onClick={handleConnect}
                  disabled={isConnLoading}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all"
                >
                  Pending
                </button>
              )}
              {connState === 'incoming_pending' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleAccept}
                    disabled={isConnLoading}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isConnLoading}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all"
                  >
                    Reject
                  </button>
                </div>
              )}
              {connState === 'accepted' && (
                <button
                  onClick={() => navigate('/messages')}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                >
                  Message
                </button>
              )}
            </div>
          )}

          {/* Post Type Badge */}
          {post.isPYQ || post.postType === 'pyq' ? (
            <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-100">
              <FileText size={12} />
              PYQ
            </div>
          ) : post.postType === 'achievement' ? (
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
              🏆 Achievement
            </div>
          ) : post.postType === 'project' ? (
            <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
              💻 Project
            </div>
          ) : post.postType === 'resource' ? (
            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
              📄 Resource
            </div>
          ) : null}

          {/* Edit/Delete Options dropdown trigger */}
          {(isAuthor || isAdmin) && (
            <div className="relative">
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <MoreVertical size={18} />
              </button>
              
              {showOptions && (
                <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-10">
                  <button 
                    onClick={() => { setIsEditing(true); setShowOptions(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Edit3 size={14} /> Edit Post
                  </button>
                  <button 
                    onClick={() => { handleDelete(); setShowOptions(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-2 mt-2">
            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-[15px]"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button 
                type="button" 
                onClick={() => { setIsEditing(false); setEditCaption(post.caption); }}
                className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isUpdating || !editCaption.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-slate-700 text-[15px] whitespace-pre-wrap leading-relaxed">{post.caption}</p>
        )}
        
        {/* Tags Section */}
        {(post.companyTags?.length > 0 || post.roleTags?.length > 0 || post.skills?.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.companyTags?.map((tag, i) => (
              <span key={`company-${i}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                <Building size={10} /> {tag}
              </span>
            ))}
            {post.roleTags?.map((tag, i) => (
              <span key={`role-${i}`} className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
                <Briefcase size={10} /> {tag}
              </span>
            ))}
            {post.skills?.map((tag, i) => (
              <span key={`skill-${i}`} className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                {tag}
              </span>
            ))}
            {post.difficulty && (
              <span className={`text-[11px] font-bold capitalize px-2 py-1 rounded-md ${
                post.difficulty === 'easy' ? 'text-green-700 bg-green-50 border border-green-100' :
                post.difficulty === 'medium' ? 'text-yellow-700 bg-yellow-50 border border-yellow-100' :
                'text-red-700 bg-red-50 border border-red-100'
              }`}>
                {post.difficulty}
              </span>
            )}
          </div>
        )}

        {/* Generic Hashtags */}
        {post.hashtags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.hashtags.map((tag, i) => (
              <span key={i} className="text-indigo-500 text-[13px] hover:underline cursor-pointer font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media Rendering */}
      {post.media?.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-4 bg-slate-50 border border-slate-100">
          {post.media[0].type === 'video' ? (
            <video src={post.media[0].url} controls className="w-full h-auto max-h-[400px] object-contain" />
          ) : post.media[0].type === 'document' ? (
            <div className="p-4 flex items-center justify-between gap-4 bg-slate-50 hover:bg-slate-100/80 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <FileText size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{post.media[0].fileName || 'Shared Document'}</p>
                  <p className="text-xs text-slate-500 font-medium">{formatFileSize(post.media[0].fileSize)}</p>
                </div>
              </div>
              
              <div className="flex gap-2 flex-shrink-0">
                <a 
                  href={post.media[0].url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center justify-center"
                  title="View file"
                >
                  <ExternalLink size={16} />
                </a>
                <a 
                  href={post.media[0].url} 
                  download={post.media[0].fileName || 'document'}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                  title="Download file"
                >
                  <Download size={16} />
                </a>
              </div>
            </div>
          ) : (
            <img src={post.media[0].url} alt="Post media" className="w-full h-auto max-h-[400px] object-cover" />
          )}
        </div>
      )}

      {/* Action Stats */}
      {(likesCount > 0 || commentsCount > 0) && (
        <div className="flex items-center justify-between text-[13px] text-slate-500 mb-2 px-1">
          <div className="flex items-center gap-1">
            {likesCount > 0 && (
              <>
                <div className="w-4 h-4 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Heart size={10} className="fill-indigo-500 text-indigo-500" />
                </div>
                <span>{likesCount} likes</span>
              </>
            )}
          </div>
          <div>
            {commentsCount > 0 && <span>{commentsCount} comments</span>}
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2 px-1">
        <div className="flex space-x-1 flex-1">
          <button 
            onClick={handleLike}
            className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg transition-all font-medium text-[13px] ${
              liked 
              ? 'text-indigo-600 bg-indigo-50' 
              : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Heart className={liked ? 'fill-current text-indigo-600' : 'text-slate-500'} size={18} />
            <span className="hidden sm:inline">Like</span>
          </button>
          
          <button 
            onClick={handleToggleComments}
            className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg transition-all font-medium text-[13px] ${
              showComments
              ? 'text-indigo-600 bg-indigo-50'
              : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MessageCircle size={18} className="text-slate-500" />
            <span className="hidden sm:inline">Comment</span>
          </button>
          
          <button className="flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium text-[13px]">
            <Share2 size={18} className="text-slate-500" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
        
        <div className="ml-2 pl-2 border-l border-slate-100">
          <button className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors tooltip" title="Save post">
            <Bookmark size={18} />
          </button>
        </div>
      </div>

      {/* Slide-down Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <button 
              type="submit"
              disabled={!newComment.trim()}
              className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>

          {loadingComments ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-indigo-600 border-b-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
              {comments.length > 0 ? (
                comments.map(c => (
                  <div key={c._id} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50/50 transition-colors">
                    <div 
                      onClick={() => navigateToProfile(c.userId)}
                      className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-50 to-purple-50 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 text-indigo-600 font-bold text-xs cursor-pointer hover:scale-105 transition-transform"
                    >
                      {c.userId?.profilePicture ? (
                        <img src={c.userId.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        getInitials(c.userId?.fullname || c.userId?.name)
                      )}
                    </div>
                    
                    <div className="flex-1 bg-slate-50 px-3 py-2 rounded-2xl">
                      <div className="flex items-center justify-between mb-0.5">
                        <span 
                          onClick={() => navigateToProfile(c.userId)}
                          className="font-bold text-slate-800 text-[13px] hover:text-indigo-600 cursor-pointer"
                        >
                          {c.userId?.fullname || c.userId?.name || 'Unknown User'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{c.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-xs text-center py-2">No comments yet. Be the first to comment!</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
