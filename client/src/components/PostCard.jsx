import React, { useState } from 'react';
import { usePostStore } from '../store/postStore';
import { Heart, MessageCircle, Share2, Bookmark, Building, Briefcase, FileText, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PostCard = ({ post }) => {
  const { toggleLike } = usePostStore();
  const { currentUser } = useApp();
  // Simplified check for demo. In prod, post.likes should be array of IDs.
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);

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

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all p-5 mb-5 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm text-white font-bold text-lg">
            {post.userId?.profilePicture ? (
              <img src={post.userId.profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              getInitials(post.userId?.fullname || post.userId?.name)
            )}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-[15px] hover:text-indigo-600 transition-colors cursor-pointer">
              {post.userId?.fullname || post.userId?.name || 'Unknown User'}
            </h4>
            <p className="text-[13px] text-slate-500 font-medium">
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
            </p>
          </div>
        </div>
        
        {/* Post Type Badge */}
        {post.isPYQ && (
          <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-100">
            <FileText size={12} />
            PYQ
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-slate-700 text-[15px] whitespace-pre-wrap leading-relaxed">{post.caption}</p>
        
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

      {/* Media */}
      {post.media?.length > 0 && (
        <div className="rounded-xl overflow-hidden mb-4 bg-slate-50 border border-slate-100">
          {post.media[0].type === 'video' ? (
            <video src={post.media[0].url} controls className="w-full h-auto max-h-[400px] object-contain" />
          ) : (
            <img src={post.media[0].url} alt="Post media" className="w-full h-auto max-h-[400px] object-cover" />
          )}
        </div>
      )}

      {/* Action Stats */}
      {(likesCount > 0 || post.commentsCount > 0) && (
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
            {post.commentsCount > 0 && <span>{post.commentsCount} comments</span>}
          </div>
        </div>
      )}

      {/* Actions */}
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
          
          <button className="flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium text-[13px]">
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
    </div>
  );
};
