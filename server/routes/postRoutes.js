import express from 'express';
import { postController } from '../controllers/postController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', authMiddleware, postController.createPost);
router.get('/feed', authMiddleware, postController.getFeed);
router.get('/explore', authMiddleware, postController.getExplore);
router.get('/trending', authMiddleware, postController.getTrending);
router.get('/user/:userId', authMiddleware, postController.getUserPosts);
router.get('/:id', authMiddleware, postController.getPostById);

router.put('/like/:id', authMiddleware, postController.toggleLike);
router.post('/comment/:id', authMiddleware, postController.addComment);
router.delete('/:id', authMiddleware, postController.deletePost);

router.post('/save/:id', authMiddleware, postController.toggleSavePost);
router.delete('/save/:id', authMiddleware, postController.toggleSavePost);

export default router;
