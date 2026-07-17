// Models are imported directly below
import { dbHelper } from '../services/dbHelper.js';
import { deleteMedia } from '../utils/cloudinary.js';

// Since models are exported directly, we might need to import them directly from models instead of index
import { Post as PostModel } from '../models/Post.js';
import { User as UserModel } from '../models/User.js';
import { Connection as FollowModel } from '../models/Connection.js';
import { Comment as CommentModel } from '../models/Comment.js';
import { Like as LikeModel } from '../models/Like.js';
import { SavedPost as SavedPostModel } from '../models/SavedPost.js';

const enrichPostsWithConnectionInfo = async (posts, activeUserId) => {
  if (!posts || posts.length === 0) return [];
  
  try {
    const postIds = posts.map(p => p._id);
    const userLikes = await LikeModel.find({ userId: activeUserId, postId: { $in: postIds } });
    const likedPostIds = new Set(userLikes.map(l => l.postId.toString()));

    const connections = await FollowModel.find({
      $or: [{ requester: activeUserId }, { recipient: activeUserId }]
    });

    const connMap = new Map();
    connections.forEach(c => {
      const otherId = c.requester.toString() === activeUserId.toString() 
        ? c.recipient.toString() 
        : c.requester.toString();
      connMap.set(otherId, c);
    });

    const activeFriends = connections
      .filter(c => c.status === 'accepted')
      .map(c => c.requester.toString() === activeUserId.toString() ? c.recipient.toString() : c.requester.toString());
    const activeFriendsSet = new Set(activeFriends);

    const authorIds = posts.map(p => p.userId?._id || p.userId).filter(Boolean);
    const authorConns = await FollowModel.find({
      $or: [{ requester: { $in: authorIds } }, { recipient: { $in: authorIds } }],
      status: 'accepted'
    });

    const authorConnsMap = new Map();
    authorConns.forEach(c => {
      const reqId = c.requester.toString();
      const recId = c.recipient.toString();
      
      if (!authorConnsMap.has(reqId)) authorConnsMap.set(reqId, []);
      authorConnsMap.get(reqId).push(recId);
      
      if (!authorConnsMap.has(recId)) authorConnsMap.set(recId, []);
      authorConnsMap.get(recId).push(reqId);
    });

    return posts.map(post => {
      const postObj = post.toObject ? post.toObject() : post;
      postObj.isLiked = likedPostIds.has(post._id.toString());
      
      if (postObj.userId) {
        const authorIdStr = postObj.userId._id?.toString() || postObj.userId.id || postObj.userId.toString();
        
        let connectionStatus = 'none';
        let incomingStatus = 'none';
        
        if (authorIdStr === activeUserId.toString()) {
          connectionStatus = 'self';
        } else {
          const conn = connMap.get(authorIdStr);
          if (conn) {
            if (conn.status === 'accepted') {
              connectionStatus = 'accepted';
              incomingStatus = 'accepted';
            } else if (conn.status === 'pending') {
              if (conn.requester.toString() === activeUserId.toString()) {
                connectionStatus = 'pending';
              } else {
                incomingStatus = 'pending';
                connectionStatus = 'incoming_pending';
              }
            }
          }
        }

        let mutualCount = 0;
        if (authorIdStr !== activeUserId.toString()) {
          const authorFriends = authorConnsMap.get(authorIdStr) || [];
          authorFriends.forEach(fId => {
            if (activeFriendsSet.has(fId)) {
              mutualCount++;
            }
          });
        }

        if (typeof postObj.userId === 'object') {
          postObj.userId.connectionStatus = connectionStatus;
          postObj.userId.incomingStatus = incomingStatus;
          postObj.userId.mutualConnectionCount = mutualCount;
        } else {
          postObj.connectionStatus = connectionStatus;
          postObj.incomingStatus = incomingStatus;
          postObj.mutualConnectionCount = mutualCount;
        }
      }
      
      return postObj;
    });
  } catch (err) {
    console.error("Error in enrichPostsWithConnectionInfo:", err);
    return posts;
  }
};

export const postController = {
  createPost: async (req, res) => {
    try {
      const { caption, media, hashtags, visibility, postType, companyTags, roleTags, skills, difficulty, isPYQ, projectData, achievementData, resourceData } = req.body;
      const newPost = await PostModel.create({
        userId: req.user._id,
        caption,
        media,
        hashtags,
        visibility,
        postType,
        companyTags,
        roleTags,
        skills,
        difficulty,
        isPYQ
      });
      
      await UserModel.findByIdAndUpdate(req.user.id || req.user._id, { $inc: { postsCount: 1 } });
      
      // Auto-sync profile sub-resources based on postType
      if (postType === 'project' && projectData) {
        const { Project } = await import('../models/Project.js');
        const techStackArr = typeof projectData.techStack === 'string'
          ? projectData.techStack.split(',').map(s => s.trim()).filter(Boolean)
          : projectData.techStack || [];
        await Project.create({
          userId: req.user._id,
          postId: newPost._id,
          name: projectData.name,
          description: projectData.description || caption,
          techStack: techStackArr,
          githubUrl: projectData.githubUrl || '',
          demoUrl: projectData.demoUrl || '',
          status: projectData.status || 'completed',
          media: media ? media.map(m => m.url) : []
        });
      } else if ((postType === 'achievement' || postType === 'placement' || postType === 'internship' || postType === 'certificate') && achievementData) {
        const { Achievement } = await import('../models/Achievement.js');
        await Achievement.create({
          userId: req.user._id,
          postId: newPost._id,
          type: achievementData.type || 'award',
          title: achievementData.title,
          description: achievementData.description || caption,
          mediaUrl: achievementData.mediaUrl || (media && media[0]?.url) || ''
        });
      } else if (postType === 'resource' && resourceData) {
        const { Resource } = await import('../models/Resource.js');
        await Resource.create({
          uploaderId: req.user._id,
          postId: newPost._id,
          title: resourceData.title,
          description: resourceData.description || caption,
          category: resourceData.category || 'note',
          fileUrl: resourceData.fileUrl || (media && media[0]?.url) || '',
          department: resourceData.department || '',
          course: resourceData.course || '',
          semester: resourceData.semester || '',
          subject: resourceData.subject || '',
          year: resourceData.year || '',
          approvalStatus: 'pending'
        });
      }

      const populatedPost = await PostModel.findById(newPost._id).populate('userId', 'fullname username profilePicture department year privacySettings');
      const enriched = await enrichPostsWithConnectionInfo([populatedPost], req.user._id);

      // Real-time socket event trigger
      const io = req.app.get('io');
      if (io && enriched && enriched[0]) {
        io.emit('post_created', enriched[0]);
      }

      res.status(201).json(enriched[0]);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getFeed: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const posts = await PostModel.find({ visibility: 'public' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'fullname username profilePicture department year privacySettings');

      const total = await PostModel.countDocuments({ visibility: 'public' });

      const enrichedPosts = await enrichPostsWithConnectionInfo(posts, req.user._id);

      res.json({ posts: enrichedPosts, totalPages: Math.ceil(total / limit), currentPage: page });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getUserPosts: async (req, res) => {
    try {
      const posts = await PostModel.find({ userId: req.params.userId })
        .sort({ createdAt: -1 })
        .populate('userId', 'fullname username profilePicture department year privacySettings');

      const enrichedPosts = await enrichPostsWithConnectionInfo(posts, req.user._id);

      res.json(enrichedPosts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getExplore: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const posts = await PostModel.find({ visibility: 'public' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'fullname username profilePicture department year privacySettings');

      const enrichedPosts = await enrichPostsWithConnectionInfo(posts, req.user._id);

      res.json(enrichedPosts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getTrending: async (req, res) => {
    try {
      const posts = await PostModel.find({ visibility: 'public' })
        .sort({ likesCount: -1, commentsCount: -1 })
        .limit(20)
        .populate('userId', 'fullname username profilePicture department year privacySettings');

      const enrichedPosts = await enrichPostsWithConnectionInfo(posts, req.user._id);

      res.json(enrichedPosts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPostById: async (req, res) => {
    try {
      const post = await PostModel.findById(req.params.id)
        .populate('userId', 'fullname username profilePicture department year privacySettings');
      if (!post) return res.status(404).json({ error: 'Post not found' });
      
      const enriched = await enrichPostsWithConnectionInfo([post], req.user._id);
      res.json(enriched[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  toggleLike: async (req, res) => {
    try {
      const existingLike = await LikeModel.findOne({ userId: req.user._id, postId: req.params.id });
      let likedStatus = false;
      
      if (existingLike) {
        await LikeModel.findByIdAndDelete(existingLike._id);
        await PostModel.findByIdAndUpdate(req.params.id, { $inc: { likesCount: -1 } });
      } else {
        await LikeModel.create({ userId: req.user._id, postId: req.params.id });
        await PostModel.findByIdAndUpdate(req.params.id, { $inc: { likesCount: 1 } });
        likedStatus = true;
      }

      // Emit socket event to notify others of like changes
      const updatedPost = await PostModel.findById(req.params.id).populate('userId', 'fullname username profilePicture department year privacySettings');
      if (updatedPost) {
        const enriched = await enrichPostsWithConnectionInfo([updatedPost], req.user._id);
        const io = req.app.get('io');
        if (io && enriched && enriched[0]) {
          io.emit('post_updated', enriched[0]);
        }
      }

      res.json({ liked: likedStatus });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  addComment: async (req, res) => {
    try {
      const { text, parentComment } = req.body;
      const comment = await CommentModel.create({
        userId: req.user._id,
        postId: req.params.id,
        text,
        parentComment
      });
      
      await PostModel.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: 1 } });
      const populated = await CommentModel.findById(comment._id).populate('userId', 'fullname username profilePicture');

      // Emit socket events to update post counters and add comment to clients
      const updatedPost = await PostModel.findById(req.params.id).populate('userId', 'fullname username profilePicture department year privacySettings');
      if (updatedPost) {
        const enriched = await enrichPostsWithConnectionInfo([updatedPost], req.user._id);
        const io = req.app.get('io');
        if (io) {
          if (enriched && enriched[0]) {
            io.emit('post_updated', enriched[0]);
          }
          io.emit('comment_added', { postId: req.params.id, comment: populated });
        }
      }

      res.status(201).json(populated);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getComments: async (req, res) => {
    try {
      const comments = await CommentModel.find({ postId: req.params.postId })
        .sort({ createdAt: 1 })
        .populate('userId', 'fullname username profilePicture');
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updatePost: async (req, res) => {
    try {
      const { caption, media, hashtags, visibility, postType, companyTags, roleTags, skills, difficulty } = req.body;
      const post = await PostModel.findById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      
      const postAuthorId = post.userId?.toString();
      const currentUserId = (req.user?._id || req.user?.id)?.toString();
      if (postAuthorId !== currentUserId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      const updated = await PostModel.findByIdAndUpdate(
        req.params.id,
        { caption, media, hashtags, visibility, postType, companyTags, roleTags, skills, difficulty },
        { new: true }
      ).populate('userId', 'fullname username profilePicture department year privacySettings');

      if (!updated) return res.status(404).json({ error: 'Post not found' });

      const enriched = await enrichPostsWithConnectionInfo([updated], req.user._id);

      // Emit socket event to notify other clients
      const io = req.app.get('io');
      if (io && enriched && enriched[0]) {
        io.emit('post_updated', enriched[0]);
      }
      
      res.json(enriched[0]);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deletePost: async (req, res) => {
    try {
      const post = await PostModel.findById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      
      const postAuthorId = post.userId?.toString();
      const currentUserId = (req.user?._id || req.user?.id)?.toString();
      if (postAuthorId !== currentUserId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // 1. Delete media files from Cloudinary/Local storage
      if (post.media && post.media.length > 0) {
        for (const item of post.media) {
          if (item.public_id) {
            await deleteMedia(item.public_id, item.type);
          }
        }
      }
      
      // 2. Perform DB deletions
      await PostModel.findByIdAndDelete(req.params.id);
      await UserModel.findByIdAndUpdate(post.userId, { $inc: { postsCount: -1 } });
      await CommentModel.deleteMany({ postId: req.params.id });
      await LikeModel.deleteMany({ postId: req.params.id });
      await SavedPostModel.deleteMany({ postId: req.params.id });

      // 3. Clean up linked sub-resources and notifications
      const { Project } = await import('../models/Project.js');
      const { Achievement } = await import('../models/Achievement.js');
      const { Resource } = await import('../models/Resource.js');
      const { Notification } = await import('../models/Notification.js');

      await Project.deleteMany({ postId: req.params.id });
      await Achievement.deleteMany({ postId: req.params.id });
      await Resource.deleteMany({ postId: req.params.id });
      await Notification.deleteMany({
        $or: [
          { postId: req.params.id },
          { targetId: req.params.id }
        ]
      });

      // 4. Emit socket deletion event
      const io = req.app.get('io');
      if (io) {
        io.emit('post_deleted', req.params.id);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  toggleSavePost: async (req, res) => {
    try {
      const existingSave = await SavedPostModel.findOne({ userId: req.user._id, postId: req.params.id });
      
      if (existingSave) {
        await SavedPostModel.findByIdAndDelete(existingSave._id);
        res.json({ saved: false });
      } else {
        await SavedPostModel.create({ userId: req.user._id, postId: req.params.id });
        res.json({ saved: true });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};
