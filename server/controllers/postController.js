// Models are imported directly below
import { dbHelper } from '../services/dbHelper.js';

// Since models are exported directly, we might need to import them directly from models instead of index
import { Post as PostModel } from '../models/Post.js';
import { User as UserModel } from '../models/User.js';
import { Follow as FollowModel } from '../models/Follow.js';
import { Comment as CommentModel } from '../models/Comment.js';
import { Like as LikeModel } from '../models/Like.js';
import { SavedPost as SavedPostModel } from '../models/SavedPost.js';

export const postController = {
  createPost: async (req, res) => {
    try {
      const { caption, media, hashtags, visibility, postType } = req.body;
      const newPost = await PostModel.create({
        userId: req.user._id,
        caption,
        media,
        hashtags,
        visibility,
        postType
      });
      
      await UserModel.findByIdAndUpdate(req.user.id, { $inc: { postsCount: 1 } });
      
      const populatedPost = await PostModel.findById(newPost._id).populate('userId', 'fullname username profilePicture');
      res.status(201).json(populatedPost);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getFeed: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const following = await FollowModel.find({ followerId: req.user._id }).select('followingId');
      const followingIds = following.map(f => f.followingId);
      followingIds.push(req.user._id);

      const posts = await PostModel.find({ userId: { $in: followingIds } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'fullname username profilePicture');

      const total = await PostModel.countDocuments({ userId: { $in: followingIds } });

      res.json({ posts, totalPages: Math.ceil(total / limit), currentPage: page });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getUserPosts: async (req, res) => {
    try {
      const posts = await PostModel.find({ userId: req.params.userId })
        .sort({ createdAt: -1 })
        .populate('userId', 'fullname username profilePicture');
      res.json(posts);
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
        .populate('userId', 'fullname username profilePicture');

      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getTrending: async (req, res) => {
    try {
      const posts = await PostModel.find({ visibility: 'public' })
        .sort({ likesCount: -1, commentsCount: -1 })
        .limit(20)
        .populate('userId', 'fullname username profilePicture');
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getPostById: async (req, res) => {
    try {
      const post = await PostModel.findById(req.params.id)
        .populate('userId', 'fullname username profilePicture');
      if (!post) return res.status(404).json({ error: 'Post not found' });
      res.json(post);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  toggleLike: async (req, res) => {
    try {
      const existingLike = await LikeModel.findOne({ userId: req.user._id, postId: req.params.id });
      
      if (existingLike) {
        await LikeModel.findByIdAndDelete(existingLike._id);
        await PostModel.findByIdAndUpdate(req.params.id, { $inc: { likesCount: -1 } });
        res.json({ liked: false });
      } else {
        await LikeModel.create({ userId: req.user._id, postId: req.params.id });
        await PostModel.findByIdAndUpdate(req.params.id, { $inc: { likesCount: 1 } });
        res.json({ liked: true });
      }
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
      res.status(201).json(populated);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deletePost: async (req, res) => {
    try {
      const post = await PostModel.findById(req.params.id);
      if (!post) return res.status(404).json({ error: 'Post not found' });
      
      if (post.userId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      await PostModel.findByIdAndDelete(req.params.id);
      await UserModel.findByIdAndUpdate(post.userId, { $inc: { postsCount: -1 } });
      await CommentModel.deleteMany({ postId: req.params.id });
      await LikeModel.deleteMany({ postId: req.params.id });
      await SavedPostModel.deleteMany({ postId: req.params.id });
      
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
