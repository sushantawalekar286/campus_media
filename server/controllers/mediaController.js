import fs from 'fs';
import path from 'path';
import { dbHelper } from '../services/dbHelper.js';
import { uploadMedia, deleteMedia } from '../utils/cloudinary.js';

export const mediaController = {
  // Upload API handler
  async upload(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No media file provided' });
      }

      const { fileType } = req.body;
      const allowedTypes = ['profile_image', 'post_image', 'document', 'video'];

      if (!fileType || !allowedTypes.includes(fileType)) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: 'Invalid or missing fileType. Supported types: profile_image, post_image, document, video' });
      }

      const fileSize = req.file.size;
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      
      // Validation thresholds
      let maxSize = 5 * 1024 * 1024; // 5MB limit default
      let allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

      if (fileType === 'document') {
        maxSize = 10 * 1024 * 1024; // 10MB limit
        allowedExts = ['.pdf', '.doc', '.docx'];
      } else if (fileType === 'video') {
        maxSize = 50 * 1024 * 1024; // 50MB limit
        allowedExts = ['.mp4'];
      }

      // Check extension/format
      if (!allowedExts.includes(fileExt)) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ 
          error: `Invalid file format for ${fileType}. Supported extensions: ${allowedExts.join(', ')}` 
        });
      }

      // Check size threshold
      if (fileSize > maxSize) {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        const readableLimit = fileType === 'video' ? '50MB' : (fileType === 'document' ? '10MB' : '5MB');
        return res.status(400).json({ 
          error: `File size exceeds the limit for ${fileType}. Maximum size allowed: ${readableLimit}` 
        });
      }

      // Perform upload
      const uploadResult = await uploadMedia(req.file, fileType);
      
      console.log('--- MEDIA UPLOAD DEBUG LOGS ---');
      console.log('Upload Request (File):', {
        fieldname: req.file?.fieldname,
        originalname: req.file?.originalname,
        mimetype: req.file?.mimetype,
        size: req.file?.size,
        path: req.file?.path
      });
      console.log('Upload Request (Body):', req.body);
      console.log('Cloud Upload Response:', uploadResult);

      if (!uploadResult) {
        console.error('Upload Error: uploadResult is falsy');
        return res.status(500).json({ error: 'Failed to process media content.' });
      }

      // Save database entry
      const userId = req.user.id || req.user._id;
      const newMedia = await dbHelper.Media.create({
        userId,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        fileName: req.file.originalname,
        fileType,
        mimeType: req.file.mimetype,
        fileSize
      });

      console.log('Saved Database Record:', newMedia);
      console.log('-------------------------------');

      res.status(201).json(newMedia);
    } catch (err) {
      console.error('--- MEDIA UPLOAD EXCEPTION ---');
      console.error(err);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: err.message });
    }
  },

  // Delete API handler
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id || req.user._id;

      const media = await dbHelper.Media.findById(id);
      if (!media) {
        return res.status(404).json({ error: 'Media asset not found' });
      }

      // Ownership and Role check
      const isOwner = media.userId?.toString() === userId.toString();
      const isAdmin = req.user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Unauthorized to delete this media asset' });
      }

      // Delete from cloud or local storage
      await deleteMedia(media.publicId, media.fileType);

      // Remove from database
      await dbHelper.Media.deleteOne({ _id: media._id || media.id });

      res.status(200).json({ success: true, message: 'Media asset deleted successfully.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Fetch list of current user's media uploads
  async getMyMedia(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const mediaList = await dbHelper.Media.find({ userId });
      res.status(200).json(mediaList);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
