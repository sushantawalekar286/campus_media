import express from 'express';
import { userController } from '../controllers/userController.js';
import { userValidator } from '../validators/userValidator.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { upload } from '../utils/cloudinary.js';

const router = express.Router();

// Admin endpoints (must be placed before other parameterized routes if any overlap exists)
router.get('/', authMiddleware, userController.getAllUsers);
router.patch('/:id/status', authMiddleware, userController.updateUserStatus);
router.delete('/:id', authMiddleware, userController.deleteUser);

// Profile endpoints
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userValidator.validateProfileUpdate, userController.updateProfile);
router.put('/settings', authMiddleware, userValidator.validatePrivacySettings, userController.updateSettings);

// Specialized profile sub-resource endpoints
router.put('/profile-picture', authMiddleware, upload.single('profilePicture'), userController.updateProfilePicture);
router.put('/cover-picture', authMiddleware, upload.single('coverPicture'), userController.updateCoverPicture);
router.put('/skills', authMiddleware, userController.updateSkills);
router.put('/education', authMiddleware, userController.updateEducation);
router.put('/projects', authMiddleware, userController.updateProjects);
router.put('/achievements', authMiddleware, userController.updateAchievements);

// Online/offline status toggle
router.put('/status', authMiddleware, userController.updateStatus);

// Session endpoints for device tracking
router.get('/sessions', authMiddleware, userController.getSessions);
router.delete('/sessions/:sessionId', authMiddleware, userController.deleteSession);
router.delete('/sessions', authMiddleware, userController.deleteAllSessions);

// Follow system
router.get('/connections/pending', authMiddleware, userController.getPendingRequests);
router.post('/connections/accept/:id', authMiddleware, userController.acceptFollowRequest);
router.post('/connections/reject/:id', authMiddleware, userController.rejectFollowRequest);
router.post('/follow/:id', authMiddleware, userController.followUser);
router.delete('/unfollow/:id', authMiddleware, userController.unfollowUser);
router.get('/followers/:id', authMiddleware, userController.getFollowers);
router.get('/following/:id', authMiddleware, userController.getFollowing);

// Search system
router.get('/search', authMiddleware, userController.searchUsers);
router.get('/suggestions', authMiddleware, userController.getSuggestions);

// Public profile retrieval by username (placed at end to avoid conflicts)
router.get('/:username', authMiddleware, userController.getByUsername);

export default router;
