import mongoose from 'mongoose';
import { dbHelper } from '../services/dbHelper.js';
import { uploadImage, deleteImage } from '../utils/cloudinary.js';

const toObjectId = (val) => mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : val;

export const userController = {
  // Get all users (Admin only)
  async getAllUsers(req, res, next) {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized. Admin only.' });
      }
      const users = await dbHelper.User.find({}, '-password');
      
      const formatted = (users || []).map(u => {
        if (!u) return {};
        const plain = (typeof u.toObject === 'function') ? u.toObject() : u;
        return { ...plain, id: plain.id || plain._id?.toString() || '' };
      });
      res.status(200).json(formatted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Toggle user status (Admin only)
  async updateUserStatus(req, res, next) {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized. Admin only.' });
      }
      const { id } = req.params;
      const { status } = req.body; // 'ACTIVE' or 'BLOCKED'

      if (!['ACTIVE', 'BLOCKED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid user status' });
      }

      const user = await dbHelper.User.findByIdAndUpdate(id, { status }, { new: true });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({ ...user, id: user.id || user._id?.toString() || '' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Delete user (Admin only)
  async deleteUser(req, res, next) {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized. Admin only.' });
      }
      const { id } = req.params;

      if (id === req.user.id || id === req.user._id?.toString()) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
      }

      await dbHelper.User.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Profile endpoints
  async getProfile(req, res, next) {
    try {
      const user = await dbHelper.User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const userObj = { ...user };
      delete userObj.password;
      res.status(200).json(userObj);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateProfile(req, res, next) {
    try {
      const userId = req.user._id;
      const { fullname, username, bio, headline, location, website, skills, education, projects, achievements, socialLinks, profilePicture, coverPicture } = req.body;

      const updateFields = {};
      if (fullname !== undefined) updateFields.fullname = fullname;
      if (username !== undefined) {
        if (username.trim() !== '') {
          const existing = await dbHelper.User.findOne({ username });
          if (existing && existing._id?.toString() !== userId.toString() && existing.id?.toString() !== userId.toString()) {
            return res.status(400).json({ error: 'Username is already taken' });
          }
        }
        updateFields.username = username;
      }
      if (bio !== undefined) updateFields.bio = bio;
      if (headline !== undefined) updateFields.headline = headline;
      if (location !== undefined) updateFields.location = location;
      if (website !== undefined) updateFields.website = website;
      if (skills !== undefined) updateFields.skills = skills;
      if (education !== undefined) updateFields.education = education;
      if (projects !== undefined) updateFields.projects = projects;
      if (achievements !== undefined) updateFields.achievements = achievements;
      if (socialLinks !== undefined) updateFields.socialLinks = socialLinks;
      if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;
      if (coverPicture !== undefined) updateFields.coverPicture = coverPicture;

      const updatedUser = await dbHelper.User.findByIdAndUpdate(userId, updateFields, { new: true });
      const userObj = { ...updatedUser };
      delete userObj.password;

      res.status(200).json(userObj);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateSettings(req, res, next) {
    try {
      const userId = req.user._id;
      const { privacySettings, notificationSettings } = req.body;

      const updateFields = {};
      if (privacySettings !== undefined) updateFields.privacySettings = privacySettings;
      if (notificationSettings !== undefined) updateFields.notificationSettings = notificationSettings;

      const updatedUser = await dbHelper.User.findByIdAndUpdate(userId, updateFields, { new: true });
      const userObj = { ...updatedUser };
      delete userObj.password;

      res.status(200).json(userObj);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getSessions(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const sessions = await dbHelper.Session.find({ userId });
      
      const formattedSessions = sessions.map(s => {
        const plain = (typeof s.toObject === 'function') ? s.toObject() : s;
        return {
          ...plain,
          isCurrent: plain.refreshToken === req.token
        };
      });

      res.status(200).json(formattedSessions);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async deleteSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id || req.user._id;

      const session = await dbHelper.Session.findOne({ _id: sessionId });
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.userId.toString() !== userId.toString()) {
        return res.status(403).json({ error: 'Unauthorized to close this session' });
      }

      await dbHelper.Session.deleteOne({ _id: sessionId });
      res.status(200).json({ success: true, message: 'Session closed successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async deleteAllSessions(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      await dbHelper.Session.deleteMany({ userId });
      res.status(200).json({ success: true, message: 'All other sessions revoked successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateStatus(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const { onlineStatus } = req.body;

      if (!['online', 'offline'].includes(onlineStatus)) {
        return res.status(400).json({ error: 'Invalid online status' });
      }

      await dbHelper.User.findByIdAndUpdate(userId, {
        onlineStatus,
        lastSeen: new Date()
      });

      res.status(200).json({ success: true, onlineStatus });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getByUsername(req, res, next) {
    try {
      const { username } = req.params;
      let user = await dbHelper.User.findOne({ username });
      if (!user) {
        if (mongoose.Types.ObjectId.isValid(username) || username.length > 10) {
          user = await dbHelper.User.findById(username);
        }
        if (!user) {
          user = await dbHelper.User.findOne({ _id: username });
        }
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const isOwner = req.user && (req.user.id === user._id?.toString() || req.user.id === user.id || req.user._id?.toString() === user._id?.toString());
      const isAdmin = req.user && req.user.role === 'ADMIN';
      const isPrivate = user.privacySettings?.profileVisibility === 'private';

      if (isPrivate && !isOwner && !isAdmin) {
        return res.status(403).json({ error: 'This profile is private' });
      }

      const { Follow } = await import('../models/Follow.js');
      let connectionStatus = 'none';
      let incomingStatus = 'none';

      if (req.user) {
        const followDoc = await Follow.findOne({
          $or: [
            { followerId: req.user._id, followingId: user._id },
            { followerId: req.user._id.toString(), followingId: user._id.toString() },
            { followerId: req.user._id, followingId: user._id.toString() },
            { followerId: req.user._id.toString(), followingId: user._id }
          ]
        });
        if (followDoc) {
          connectionStatus = followDoc.status;
        }
        const incomingFollowDoc = await Follow.findOne({
          $or: [
            { followerId: user._id, followingId: req.user._id },
            { followerId: user._id.toString(), followingId: req.user._id.toString() },
            { followerId: user._id, followingId: req.user._id.toString() },
            { followerId: user._id.toString(), followingId: req.user._id }
          ]
        });
        if (incomingFollowDoc) {
          incomingStatus = incomingFollowDoc.status;
        }
      }

      const userObj = (typeof user.toObject === 'function') ? user.toObject() : { ...user };
      delete userObj.password;
      userObj.connectionStatus = connectionStatus;
      userObj.incomingStatus = incomingStatus;

      res.status(200).json(userObj);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateProfilePicture(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      if (!req.file) {
        return res.status(400).json({ error: 'No profile image file uploaded' });
      }

      const user = await dbHelper.User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.profilePicture) {
        await deleteImage(user.profilePicture);
      }

      const imageUrl = await uploadImage(req.file, 'profile_pictures');
      const updatedUser = await dbHelper.User.findByIdAndUpdate(userId, { profilePicture: imageUrl }, { new: true });
      
      const userObj = { ...updatedUser };
      delete userObj.password;
      res.status(200).json(userObj);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateCoverPicture(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      if (!req.file) {
        return res.status(400).json({ error: 'No cover image file uploaded' });
      }

      const user = await dbHelper.User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.coverPicture) {
        await deleteImage(user.coverPicture);
      }

      const imageUrl = await uploadImage(req.file, 'cover_pictures');
      const updatedUser = await dbHelper.User.findByIdAndUpdate(userId, { coverPicture: imageUrl }, { new: true });
      
      const userObj = { ...updatedUser };
      delete userObj.password;
      res.status(200).json(userObj);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateSkills(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const { skills } = req.body;

      if (!Array.isArray(skills)) {
        return res.status(400).json({ error: 'Skills must be an array' });
      }

      const updatedUser = await dbHelper.User.findByIdAndUpdate(userId, { skills }, { new: true });
      const userObj = { ...updatedUser };
      delete userObj.password;
      res.status(200).json(userObj);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateEducation(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const { education } = req.body;

      if (!Array.isArray(education)) {
        return res.status(400).json({ error: 'Education must be an array' });
      }

      const updatedUser = await dbHelper.User.findByIdAndUpdate(userId, { education }, { new: true });
      const userObj = { ...updatedUser };
      delete userObj.password;
      res.status(200).json(userObj);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateProjects(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const { projects } = req.body;

      if (!Array.isArray(projects)) {
        return res.status(400).json({ error: 'Projects must be an array' });
      }

      const updatedUser = await dbHelper.User.findByIdAndUpdate(userId, { projects }, { new: true });
      const userObj = { ...updatedUser };
      delete userObj.password;
      res.status(200).json(userObj);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateAchievements(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const { achievements } = req.body;

      if (!Array.isArray(achievements)) {
        return res.status(400).json({ error: 'Achievements must be an array' });
      }

      const updatedUser = await dbHelper.User.findByIdAndUpdate(userId, { achievements }, { new: true });
      const userObj = { ...updatedUser };
      delete userObj.password;
      res.status(200).json(userObj);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async followUser(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      if (id === userId) return res.status(400).json({ error: "Cannot follow yourself" });

      const { Follow } = await import('../models/Follow.js');
      const { User } = await import('../models/User.js');
      
      const existingFollow = await Follow.findOne({
        $or: [
          { followerId: userId, followingId: id },
          { followerId: userId.toString(), followingId: id },
          { followerId: userId, followingId: toObjectId(id) },
          { followerId: userId.toString(), followingId: toObjectId(id) }
        ]
      });
      if (existingFollow) return res.status(400).json({ error: "Already following or follow request pending" });

      // Create pending follow request
      const follow = await Follow.create({ followerId: userId, followingId: id, status: 'pending' });

      res.status(200).json({ success: true, status: 'pending', follow });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async unfollowUser(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      
      const { Follow } = await import('../models/Follow.js');
      const { User } = await import('../models/User.js');

      const existingFollow = await Follow.findOne({
        $or: [
          { followerId: userId, followingId: id },
          { followerId: userId.toString(), followingId: id },
          { followerId: userId, followingId: toObjectId(id) },
          { followerId: userId.toString(), followingId: toObjectId(id) }
        ]
      });
      if (!existingFollow) return res.status(400).json({ error: "Not following" });

      const wasAccepted = existingFollow.status === 'accepted';
      await Follow.deleteOne({ _id: existingFollow._id });

      if (wasAccepted) {
        await User.findByIdAndUpdate(userId, { $inc: { followingCount: -1 } });
        await User.findByIdAndUpdate(id, { $inc: { followersCount: -1 } });
      }
      res.status(200).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async getFollowers(req, res, next) {
    try {
      const { Follow } = await import('../models/Follow.js');
      const followers = await Follow.find({ followingId: req.params.id, status: 'accepted' }).populate('followerId', 'fullname username profilePicture headline');
      res.status(200).json(followers.map(f => f.followerId).filter(Boolean));
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async getFollowing(req, res, next) {
    try {
      const { Follow } = await import('../models/Follow.js');
      const following = await Follow.find({ followerId: req.params.id, status: 'accepted' }).populate('followingId', 'fullname username profilePicture headline');
      res.status(200).json(following.map(f => f.followingId).filter(Boolean));
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async getPendingRequests(req, res, next) {
    try {
      const userId = req.user._id;
      const { Follow } = await import('../models/Follow.js');
      const pending = await Follow.find({ followingId: userId, status: 'pending' }).populate('followerId', 'fullname username profilePicture headline');
      res.status(200).json(pending.map(f => ({
        requestId: f._id,
        user: f.followerId
      })).filter(item => item.user));
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async acceptFollowRequest(req, res, next) {
    try {
      const { id } = req.params; // followerId or requestId
      const userId = req.user._id;
      const { Follow } = await import('../models/Follow.js');
      const { User } = await import('../models/User.js');

      // Find by _id (requestId) or by followerId and followingId
      let follow = await Follow.findOne({
        $or: [
          { _id: id, followingId: userId, status: 'pending' },
          { _id: id, followingId: userId.toString(), status: 'pending' },
          { followerId: id, followingId: userId, status: 'pending' },
          { followerId: id, followingId: userId.toString(), status: 'pending' },
          { followerId: toObjectId(id), followingId: userId, status: 'pending' },
          { followerId: toObjectId(id), followingId: userId.toString(), status: 'pending' }
        ]
      });

      if (!follow) {
        return res.status(404).json({ error: 'Pending follow request not found' });
      }

      follow.status = 'accepted';
      await follow.save();

      // Update counters
      await User.findByIdAndUpdate(follow.followerId, { $inc: { followingCount: 1 } });
      await User.findByIdAndUpdate(userId, { $inc: { followersCount: 1 } });

      res.status(200).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async rejectFollowRequest(req, res, next) {
    try {
      const { id } = req.params; // followerId or requestId
      const userId = req.user._id;
      const { Follow } = await import('../models/Follow.js');

      let follow = await Follow.findOne({
        $or: [
          { _id: id, followingId: userId, status: 'pending' },
          { _id: id, followingId: userId.toString(), status: 'pending' },
          { followerId: id, followingId: userId, status: 'pending' },
          { followerId: id, followingId: userId.toString(), status: 'pending' },
          { followerId: toObjectId(id), followingId: userId, status: 'pending' },
          { followerId: toObjectId(id), followingId: userId.toString(), status: 'pending' }
        ]
      });

      if (!follow) {
        return res.status(404).json({ error: 'Pending follow request not found' });
      }

      await Follow.deleteOne({ _id: follow._id });
      res.status(200).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async searchUsers(req, res, next) {
    try {
      const { query } = req.query;
      const { User } = await import('../models/User.js');
      const users = await User.find({
        $or: [
          { fullname: { $regex: query || '', $options: 'i' } },
          { username: { $regex: query || '', $options: 'i' } },
          { skills: { $in: [new RegExp(query || '', 'i')] } }
        ]
      }).limit(10).select('fullname username profilePicture headline skills');
      res.status(200).json(users);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async getSuggestions(req, res, next) {
    try {
      const { User } = await import('../models/User.js');
      const users = await User.find({ _id: { $ne: req.user.id } })
        .sort({ lastSeen: -1 })
        .limit(5)
        .select('fullname username profilePicture headline');
      res.status(200).json(users);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
};
