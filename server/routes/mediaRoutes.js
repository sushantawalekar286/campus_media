import express from 'express';
import { mediaController } from '../controllers/mediaController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { upload } from '../utils/cloudinary.js';

const router = express.Router();

router.post('/upload', authMiddleware, upload.single('file'), mediaController.upload);
router.delete('/:id', authMiddleware, mediaController.delete);
router.get('/my-media', authMiddleware, mediaController.getMyMedia);

export default router;
