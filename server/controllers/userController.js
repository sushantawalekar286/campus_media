import mongoose from 'mongoose';
import { dbHelper } from '../services/dbHelper.js';
import { uploadImage, deleteImage } from '../utils/cloudinary.js';

const toObjectId = (val) => mongoose.Types.ObjectId.isValid(val) ? new mongoose.Types.ObjectId(val) : val;

const getMutualCount = async (userA, userB) => {
  try {
    const { Connection } = await import('../models/Connection.js');
    const connsA = await Connection.find({
      $or: [{ requester: userA }, { recipient: userA }],
      status: 'accepted'
    });
    const friendsA = connsA.map(c => 
      c.requester.toString() === userA.toString() ? c.recipient.toString() : c.requester.toString()
    );

    const connsB = await Connection.find({
      $or: [{ requester: userB }, { recipient: userB }],
      status: 'accepted'
    });
    const friendsB = connsB.map(c => 
      c.requester.toString() === userB.toString() ? c.recipient.toString() : c.requester.toString()
    );

    const setA = new Set(friendsA);
    const mutuals = friendsB.filter(id => setA.has(id));
    return mutuals.length;
  } catch (e) {
    console.error("Error in getMutualCount:", e);
    return 0;
  }
};

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

      const { Project } = await import('../models/Project.js');
      const { Achievement } = await import('../models/Achievement.js');
      const { Resource } = await import('../models/Resource.js');

      const projects = await Project.find({ userId: user._id });
      const achievements = await Achievement.find({ userId: user._id });
      const resources = await Resource.find({ uploaderId: user._id });

      const userObj = (typeof user.toObject === 'function') ? user.toObject() : { ...user };
      delete userObj.password;
      userObj.projects = projects;
      userObj.achievements = achievements;
      userObj.resources = resources;

      res.status(200).json(userObj);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async updateProfile(req, res, next) {
    try {
      const userId = req.user._id;
      const { 
        fullname, username, bio, headline, location, website, skills, education, 
        projects, achievements, socialLinks, profilePicture, coverPicture,
        phone, college, department, course, year, semester, cgpa, graduationYear,
        careerObjective, careerGoal, interestedDomains, preferredRoles, codingProfiles,
        experience, programmingLanguages, frameworks, libraries, databases,
        cloudPlatforms, devopsTools, versionControl, developmentTools, testingTools,
        aiMlTechnologies, softSkills
      } = req.body;

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

      // Expanded profile fields
      if (phone !== undefined) updateFields.phone = phone;
      if (college !== undefined) updateFields.college = college;
      if (department !== undefined) updateFields.department = department;
      if (course !== undefined) updateFields.course = course;
      if (year !== undefined) updateFields.year = year;
      if (semester !== undefined) updateFields.semester = semester;
      if (cgpa !== undefined) updateFields.cgpa = cgpa;
      if (graduationYear !== undefined) updateFields.graduationYear = graduationYear;
      if (careerObjective !== undefined) updateFields.careerObjective = careerObjective;
      if (careerGoal !== undefined) updateFields.careerGoal = careerGoal;
      if (interestedDomains !== undefined) updateFields.interestedDomains = interestedDomains;
      if (preferredRoles !== undefined) updateFields.preferredRoles = preferredRoles;
      if (codingProfiles !== undefined) updateFields.codingProfiles = codingProfiles;
      if (experience !== undefined) updateFields.experience = experience;
      
      if (programmingLanguages !== undefined) updateFields.programmingLanguages = programmingLanguages;
      if (frameworks !== undefined) updateFields.frameworks = frameworks;
      if (libraries !== undefined) updateFields.libraries = libraries;
      if (databases !== undefined) updateFields.databases = databases;
      if (cloudPlatforms !== undefined) updateFields.cloudPlatforms = cloudPlatforms;
      if (devopsTools !== undefined) updateFields.devopsTools = devopsTools;
      if (versionControl !== undefined) updateFields.versionControl = versionControl;
      if (developmentTools !== undefined) updateFields.developmentTools = developmentTools;
      if (testingTools !== undefined) updateFields.testingTools = testingTools;
      if (aiMlTechnologies !== undefined) updateFields.aiMlTechnologies = aiMlTechnologies;
      if (softSkills !== undefined) updateFields.softSkills = softSkills;

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
      console.log('=== MATCHED getByUsername with params.username:', username, 'on path:', req.path);
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

      const { Connection: Follow } = await import('../models/Connection.js');
      let connectionStatus = 'none';
      let incomingStatus = 'none';

      if (req.user) {
        const doc = await Follow.findOne({
          $or: [
            { requester: req.user._id, recipient: user._id },
            { requester: user._id, recipient: req.user._id }
          ]
        });

        if (doc) {
          if (doc.status === 'accepted') {
            connectionStatus = 'accepted';
            incomingStatus = 'accepted';
          } else if (doc.status === 'pending') {
            if (doc.requester.toString() === req.user._id.toString()) {
              connectionStatus = 'pending';
              incomingStatus = 'none';
            } else {
              connectionStatus = 'none';
              incomingStatus = 'pending';
            }
          }
        }
      }

      const isConnected = connectionStatus === 'accepted';
      const isPrivateAndRestricted = isPrivate && !isOwner && !isAdmin && !isConnected;

      let mutualConnectionCount = 0;
      if (req.user) {
        mutualConnectionCount = await getMutualCount(req.user._id, user._id);
      }

      const userObj = (typeof user.toObject === 'function') ? user.toObject() : { ...user };
      delete userObj.password;
      userObj.connectionStatus = connectionStatus;
      userObj.incomingStatus = incomingStatus;
      userObj.mutualConnectionCount = mutualConnectionCount;
      userObj.isPrivateAndRestricted = isPrivateAndRestricted;

      if (isPrivateAndRestricted) {
        // Strip/clean private information from payload
        userObj.education = [];
        userObj.skills = [];
        userObj.programmingLanguages = [];
        userObj.certificates = [];
        userObj.projects = [];
        userObj.achievements = [];
        userObj.socialLinks = {};
        userObj.experience = [];
        
        // Hide scores if chosen
        if (user.privacySettings?.hideResumeScore) userObj.resumeScore = 0;
        if (user.privacySettings?.hideInterviewScore) userObj.interviewScore = 0;
        if (user.privacySettings?.hideFollowers) userObj.followersCount = 0;
        if (user.privacySettings?.hideFollowing) userObj.followingCount = 0;
      } else {
        // Dynamic sub-collections loading
        const { Project } = await import('../models/Project.js');
        const { Achievement } = await import('../models/Achievement.js');
        const { Resource } = await import('../models/Resource.js');

        const projects = await Project.find({ userId: user._id });
        const achievements = await Achievement.find({ userId: user._id });
        
        // Fetch only approved resources for others, or all for the owner
        const resourceQuery = { uploaderId: user._id };
        if (!isOwner && !isAdmin) {
          resourceQuery.approvalStatus = 'approved';
        }
        const resources = await Resource.find(resourceQuery);

        userObj.projects = projects;
        userObj.achievements = achievements;
        userObj.resources = resources;

        // Apply owner privacy filter constraints for general viewer
        if (!isOwner && !isAdmin) {
          if (user.privacySettings?.hideAchievements) userObj.achievements = [];
          if (user.privacySettings?.hideProjects) userObj.projects = [];
          if (user.privacySettings?.hideResumeScore) userObj.resumeScore = 0;
          if (user.privacySettings?.hideInterviewScore) userObj.interviewScore = 0;
          if (user.privacySettings?.hideFollowers) userObj.followersCount = 0;
          if (user.privacySettings?.hideFollowing) userObj.followingCount = 0;
        }
      }

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

      const { Project } = await import('../models/Project.js');

      // 1. Get existing project IDs for this user
      const existingProjects = await Project.find({ userId });
      const existingIds = existingProjects.map(p => p._id.toString());

      const inputIds = [];
      const updatedList = [];

      for (const proj of projects) {
        if (proj._id || proj.id) {
          const pid = proj._id || proj.id;
          inputIds.push(pid.toString());
          const updatedProj = await Project.findByIdAndUpdate(
            pid,
            {
              name: proj.name || proj.title,
              description: proj.description,
              techStack: proj.techStack,
              githubUrl: proj.githubUrl,
              demoUrl: proj.demoUrl,
              media: proj.media,
              teamMembers: proj.teamMembers,
              role: proj.role,
              status: proj.status || 'completed'
            },
            { new: true }
          );
          if (updatedProj) updatedList.push(updatedProj);
        } else {
          const newProj = await Project.create({
            userId,
            name: proj.name || proj.title,
            description: proj.description,
            techStack: proj.techStack,
            githubUrl: proj.githubUrl,
            demoUrl: proj.demoUrl,
            media: proj.media,
            teamMembers: proj.teamMembers,
            role: proj.role,
            status: proj.status || 'completed'
          });
          updatedList.push(newProj);
        }
      }

      // 2. Delete projects that are no longer present in the input list
      const toDelete = existingIds.filter(id => !inputIds.includes(id));
      if (toDelete.length > 0) {
        await Project.deleteMany({ _id: { $in: toDelete } });
      }

      // 3. Update the user statistics projectCount
      const projectCount = await Project.countDocuments({ userId });
      await dbHelper.User.findByIdAndUpdate(userId, { projectCount, projects });

      res.status(200).json({ success: true, projects: updatedList });
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

      const { Achievement } = await import('../models/Achievement.js');

      const existingAchievements = await Achievement.find({ userId });
      const existingIds = existingAchievements.map(a => a._id.toString());

      const inputIds = [];
      const updatedList = [];

      for (const ach of achievements) {
        if (ach._id || ach.id) {
          const aid = ach._id || ach.id;
          inputIds.push(aid.toString());
          const updatedAch = await Achievement.findByIdAndUpdate(
            aid,
            {
              type: ach.type || 'award',
              title: ach.title,
              description: ach.description,
              mediaUrl: ach.mediaUrl || ach.certificate || '',
              isVerified: ach.isVerified || false
            },
            { new: true }
          );
          if (updatedAch) updatedList.push(updatedAch);
        } else {
          const newAch = await Achievement.create({
            userId,
            type: ach.type || 'award',
            title: ach.title,
            description: ach.description,
            mediaUrl: ach.mediaUrl || ach.certificate || '',
            isVerified: ach.isVerified || false
          });
          updatedList.push(newAch);
        }
      }

      const toDelete = existingIds.filter(id => !inputIds.includes(id));
      if (toDelete.length > 0) {
        await Achievement.deleteMany({ _id: { $in: toDelete } });
      }

      const achievementCount = await Achievement.countDocuments({ userId });
      await dbHelper.User.findByIdAndUpdate(userId, { achievementCount, achievements });

      res.status(200).json({ success: true, achievements: updatedList });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async followUser(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      if (id === userId.toString()) return res.status(400).json({ error: "Cannot connect with yourself" });

      const { Connection: Follow } = await import('../models/Connection.js');
      const { User } = await import('../models/User.js');
      
      const existingFollow = await Follow.findOne({
        $or: [
          { requester: userId, recipient: id },
          { requester: id, recipient: userId }
        ]
      });

      let follow;
      if (existingFollow) {
        if (existingFollow.status === 'pending' || existingFollow.status === 'accepted') {
          return res.status(400).json({ error: "Already connected or connection request pending" });
        }
        
        // Reactivate connection request
        existingFollow.requester = userId;
        existingFollow.recipient = id;
        existingFollow.followerId = userId;
        existingFollow.followingId = id;
        existingFollow.status = 'pending';
        existingFollow.connectionDate = undefined;
        await existingFollow.save();
        follow = existingFollow;
      } else {
        // Create pending follow request
        follow = await Follow.create({ 
          requester: userId, 
          recipient: id, 
          followerId: userId, 
          followingId: id, 
          status: 'pending' 
        });
      }

      // Dispatch notification
      try {
        const { Notification } = await import('../models/Notification.js');
        await Notification.create({
          type: 'connection',
          senderId: userId,
          receiverId: id,
          targetId: follow._id,
          title: 'New Connection Request',
          message: `${req.user.fullname || req.user.name} wants to connect with you.`,
          userId: id,
          isRead: false
        });
      } catch (notifErr) {
        console.error("Failed to send connection notification:", notifErr);
      }

      res.status(200).json({ success: true, status: 'pending', follow });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async unfollowUser(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      
      const { Connection: Follow } = await import('../models/Connection.js');
      const { User } = await import('../models/User.js');

      const existingFollow = await Follow.findOne({
        $or: [
          { requester: userId, recipient: id },
          { requester: id, recipient: userId }
        ]
      });
      if (!existingFollow) return res.status(400).json({ error: "Not connected" });

      const wasAccepted = existingFollow.status === 'accepted';
      await Follow.deleteOne({ _id: existingFollow._id });

      if (wasAccepted) {
        await User.findByIdAndUpdate(userId, { $inc: { followingCount: -1, connectionCount: -1 } });
        await User.findByIdAndUpdate(id, { $inc: { followersCount: -1, connectionCount: -1 } });
      }
      res.status(200).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async getFollowers(req, res, next) {
    try {
      const { id } = req.params;
      const { Connection: Follow } = await import('../models/Connection.js');
      const followers = await Follow.find({
        $or: [
          { followingId: id, status: 'accepted' },
          { followingId: toObjectId(id), status: 'accepted' }
        ]
      }).populate('followerId', 'fullname username profilePicture headline');
      res.status(200).json(followers.map(f => f.followerId).filter(Boolean));
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async getFollowing(req, res, next) {
    try {
      const { id } = req.params;
      const { Connection: Follow } = await import('../models/Connection.js');
      const following = await Follow.find({
        $or: [
          { followerId: id, status: 'accepted' },
          { followerId: toObjectId(id), status: 'accepted' }
        ]
      }).populate('followingId', 'fullname username profilePicture headline');
      res.status(200).json(following.map(f => f.followingId).filter(Boolean));
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async getPendingRequests(req, res, next) {
    try {
      const userId = req.user._id;
      const { Connection: Follow } = await import('../models/Connection.js');
      const pending = await Follow.find({
        $or: [
          { followingId: userId, status: 'pending' },
          { followingId: userId.toString(), status: 'pending' }
        ]
      }).populate('followerId', 'fullname username profilePicture headline');
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
      const { Connection: Follow } = await import('../models/Connection.js');
      const { User } = await import('../models/User.js');

      // Find by _id (requestId) or by requester and recipient
      let follow = await Follow.findOne({
        $or: [
          { _id: id, recipient: userId, status: 'pending' },
          { requester: id, recipient: userId, status: 'pending' },
          { requester: toObjectId(id), recipient: userId, status: 'pending' }
        ]
      });

      if (!follow) {
        return res.status(404).json({ error: 'Pending connection request not found' });
      }

      follow.status = 'accepted';
      follow.connectionDate = new Date();
      await follow.save();

      // Update counters
      await User.findByIdAndUpdate(follow.requester, { $inc: { followingCount: 1, connectionCount: 1 } });
      await User.findByIdAndUpdate(userId, { $inc: { followersCount: 1, connectionCount: 1 } });

      // Dispatch acceptance notification
      try {
        const { Notification } = await import('../models/Notification.js');
        await Notification.create({
          type: 'connection',
          senderId: userId,
          receiverId: follow.requester,
          targetId: follow._id,
          title: 'Connection Accepted',
          message: `${req.user.fullname || req.user.name} accepted your connection request.`,
          userId: follow.requester,
          isRead: false
        });
      } catch (notifErr) {
        console.error("Failed to send notification:", notifErr);
      }

      res.status(200).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async rejectFollowRequest(req, res, next) {
    try {
      const { id } = req.params; // followerId or requestId
      const userId = req.user._id;
      const { Connection: Follow } = await import('../models/Connection.js');

      let follow = await Follow.findOne({
        $or: [
          { _id: id, recipient: userId, status: 'pending' },
          { requester: id, recipient: userId, status: 'pending' },
          { requester: toObjectId(id), recipient: userId, status: 'pending' }
        ]
      });

      if (!follow) {
        return res.status(404).json({ error: 'Pending connection request not found' });
      }

      const requesterId = follow.requester;
      await Follow.deleteOne({ _id: follow._id });

      // Dispatch decline notification
      try {
        const { Notification } = await import('../models/Notification.js');
        await Notification.create({
          type: 'connection',
          senderId: userId,
          receiverId: requesterId,
          targetId: userId,
          title: 'Connection Request Declined',
          message: `${req.user.fullname || req.user.name} declined your connection request.`,
          userId: requesterId,
          isRead: false
        });
      } catch (notifErr) {
        console.error("Failed to send decline notification:", notifErr);
      }

      res.status(200).json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async searchUsers(req, res, next) {
    try {
      const { query } = req.query;
      const { User } = await import('../models/User.js');
      const escapedQuery = (query || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const users = await User.find({
        $or: [
          { fullname: { $regex: escapedQuery, $options: 'i' } },
          { username: { $regex: escapedQuery, $options: 'i' } },
          { skills: { $in: [new RegExp(escapedQuery, 'i')] } }
        ]
      }).limit(10).select('fullname username profilePicture headline skills');
      res.status(200).json(users);
    } catch (err) { res.status(500).json({ error: err.message }); }
  },

  async getSuggestions(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const { User } = await import('../models/User.js');
      const currentUser = await User.findById(userId);
      if (!currentUser) return res.status(404).json({ error: 'User not found' });

      // Get existing connections (accepted or pending) to exclude
      const { Connection } = await import('../models/Connection.js');
      const existingConnections = await Connection.find({
        $or: [{ requester: userId }, { recipient: userId }]
      });

      const connectedUserIds = new Set(
        existingConnections.map(c => 
          c.requester.toString() === userId.toString() ? c.recipient.toString() : c.requester.toString()
        )
      );
      connectedUserIds.add(userId.toString()); // exclude self

      // Query potential users
      const potentialUsers = await User.find({
        _id: { $nin: Array.from(connectedUserIds) }
      }).limit(50); // Fetch a pool of candidate users

      // Score each candidate user based on matching fields
      const scoredUsers = potentialUsers.map(user => {
        let score = 0;
        
        // Match Department (high weight)
        if (currentUser.department && user.department && currentUser.department.toLowerCase() === user.department.toLowerCase()) {
          score += 15;
        }
        
        // Match Course (high weight)
        if (currentUser.course && user.course && currentUser.course.toLowerCase() === user.course.toLowerCase()) {
          score += 10;
        }
        
        // Match Year
        if (currentUser.year && user.year && currentUser.year === user.year) {
          score += 5;
        }

        // Match Skills (common elements)
        const commonSkills = (currentUser.skills || []).filter(skill => 
          (user.skills || []).map(s => s.toLowerCase()).includes(skill.toLowerCase())
        );
        score += commonSkills.length * 5;

        // Match Interests (common elements)
        const commonInterests = (currentUser.interestedDomains || []).filter(domain => 
          (user.interestedDomains || []).map(d => d.toLowerCase()).includes(domain.toLowerCase())
        );
        score += commonInterests.length * 5;

        return { user, score };
      });

      // Sort by score descending and take the top 10
      const sortedSuggestions = scoredUsers
        .filter(item => item.score > 0 || potentialUsers.length < 10)
        .sort((a, b) => b.score - a.score)
        .map(item => item.user)
        .slice(0, 10);

      const enrichedSuggestions = [];
      for (const u of sortedSuggestions) {
        const mutualCount = await getMutualCount(userId, u._id);
        const uObj = u.toObject ? u.toObject() : u;
        uObj.mutualConnectionCount = mutualCount;
        uObj.connectionStatus = 'none';
        uObj.incomingStatus = 'none';
        enrichedSuggestions.push(uObj);
      }

      res.status(200).json(enrichedSuggestions);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  async getDiscoverUsers(req, res, next) {
    try {
      console.log('=== MATCHED getDiscoverUsers with query:', req.query);
      const userId = req.user._id || req.user.id;
      const { search, department, year, skill, recentlyJoined, page = 1, limit = 12 } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skipNum = (pageNum - 1) * limitNum;

      const queryObj = { _id: { $ne: userId } };

      if (search) {
        const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const searchRegex = new RegExp(escapedSearch, 'i');
        queryObj.$or = [
          { fullname: searchRegex },
          { username: searchRegex },
          { department: searchRegex },
          { course: searchRegex },
          { skills: { $in: [searchRegex] } }
        ];
      }

      if (department) {
        const escapedDept = department.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        queryObj.department = { $regex: new RegExp(`^${escapedDept}$`, 'i') };
      }
      if (year) {
        queryObj.year = year;
      }
      if (skill) {
        const escapedSkill = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        queryObj.skills = { $in: [new RegExp(escapedSkill, 'i')] };
      }

      let sortObj = { lastSeen: -1 };
      if (recentlyJoined === 'true' || recentlyJoined === true) {
        sortObj = { createdAt: -1 };
      }

      const { User } = await import('../models/User.js');
      const totalUsers = await User.countDocuments(queryObj);
      const users = await User.find(queryObj)
        .sort(sortObj)
        .skip(skipNum)
        .limit(limitNum);

      const { Connection } = await import('../models/Connection.js');
      const connections = await Connection.find({
        $or: [{ requester: userId }, { recipient: userId }]
      });

      const connMap = new Map();
      connections.forEach(c => {
        const otherId = c.requester.toString() === userId.toString()
          ? c.recipient.toString()
          : c.requester.toString();
        connMap.set(otherId, c);
      });

      const enrichedUsers = [];
      for (const u of users) {
        const uObj = u.toObject ? u.toObject() : u;
        delete uObj.password;
        
        let connectionStatus = 'none';
        let incomingStatus = 'none';

        const conn = connMap.get(u._id.toString());
        if (conn) {
          if (conn.status === 'accepted') {
            connectionStatus = 'accepted';
            incomingStatus = 'accepted';
          } else if (conn.status === 'pending') {
            if (conn.requester.toString() === userId.toString()) {
              connectionStatus = 'pending';
            } else {
              incomingStatus = 'pending';
              connectionStatus = 'incoming_pending';
            }
          }
        }

        const mutualCount = await getMutualCount(userId, u._id);

        uObj.connectionStatus = connectionStatus;
        uObj.incomingStatus = incomingStatus;
        uObj.mutualConnectionCount = mutualCount;
        enrichedUsers.push(uObj);
      }

      res.status(200).json({
        users: enrichedUsers,
        total: totalUsers,
        page: pageNum,
        totalPages: Math.ceil(totalUsers / limitNum)
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  async getIncomingRequests(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const { Connection } = await import('../models/Connection.js');
      const requests = await Connection.find({
        recipient: userId,
        status: 'pending'
      }).populate('requester', 'fullname username profilePicture headline department course year bio skills');

      const formatted = requests.map(r => {
        const requesterObj = r.requester.toObject ? r.requester.toObject() : r.requester;
        return {
          requestId: r._id,
          status: r.status,
          createdAt: r.createdAt,
          user: requesterObj
        };
      });

      res.status(200).json(formatted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getSentRequests(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const { Connection } = await import('../models/Connection.js');
      const requests = await Connection.find({
        requester: userId,
        status: 'pending'
      }).populate('recipient', 'fullname username profilePicture headline department course year bio skills');

      const formatted = requests.map(r => {
        const recipientObj = r.recipient.toObject ? r.recipient.toObject() : r.recipient;
        return {
          requestId: r._id,
          status: r.status,
          createdAt: r.createdAt,
          user: recipientObj
        };
      });

      res.status(200).json(formatted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getConnectionsList(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const { Connection } = await import('../models/Connection.js');
      const connections = await Connection.find({
        $or: [{ requester: userId }, { recipient: userId }],
        status: 'accepted'
      })
      .populate('requester', 'fullname username profilePicture headline department course year bio skills onlineStatus lastSeen')
      .populate('recipient', 'fullname username profilePicture headline department course year bio skills onlineStatus lastSeen');

      const list = connections.map(c => {
        const otherUser = c.requester._id.toString() === userId.toString() ? c.recipient : c.requester;
        const otherUserObj = otherUser.toObject ? otherUser.toObject() : otherUser;
        return {
          connectionId: c._id,
          connectedAt: c.connectionDate || c.updatedAt,
          ...otherUserObj,
          connectionStatus: 'accepted',
          incomingStatus: 'accepted'
        };
      });

      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
