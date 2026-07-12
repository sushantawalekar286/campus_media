import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('☁️ Cloudinary configuration initialized.');
} else {
  console.warn('⚠️ Cloudinary environment variables missing. Falling back to local disk storage for uploads.');
}

// Multer Storage Configuration
const localUploadsDir = path.join(process.cwd(), 'server', 'uploads');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, localUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File validation filter for images, videos, and PDFs
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Supported extensions: JPG, JPEG, PNG, WEBP, MP4, PDF.'));
  }
};

// Global multer instance permitting up to 50MB (max video size limit)
export const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB absolute cap
  fileFilter: fileFilter
});

// Legacy upload helper function (for backwards compatibility)
export const uploadImage = async (file, folder = 'campus-media') => {
  if (!file) return null;

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto' }]
      });
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return result.secure_url;
    } catch (err) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new Error(`Cloudinary upload failed: ${err.message}`);
    }
  }
  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
  throw new Error('Cloudinary environment variables missing or incomplete.');
};

// Legacy delete helper function (for backwards compatibility)
export const deleteImage = async (imageUrl) => {
  if (!imageUrl) return;

  if (isCloudinaryConfigured && imageUrl.includes('res.cloudinary.com')) {
    try {
      const parts = imageUrl.split('/');
      const filename = parts.pop();
      const folder = parts.pop();
      const publicId = `${folder}/${filename.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error('Failed to delete image from Cloudinary:', err.message);
    }
  } else if (imageUrl.includes('/uploads/')) {
    try {
      const filename = imageUrl.split('/').pop();
      const filePath = path.join(localUploadsDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Failed to delete local file:', err.message);
    }
  }
};

// Production-ready media upload helper supporting images, videos, and raw document files
export const uploadMedia = async (file, fileType) => {
  if (!file) return null;

  let folder = 'general';
  let resourceType = 'image';

  if (fileType === 'profile_image') {
    folder = 'profile_images';
    resourceType = 'image';
  } else if (fileType === 'post_image') {
    folder = 'posts';
    resourceType = 'image';
  } else if (fileType === 'video') {
    folder = 'videos';
    resourceType = 'video';
  } else if (fileType === 'document') {
    folder = 'documents';
    resourceType = 'raw';
  }

  if (isCloudinaryConfigured) {
    try {
      const options = {
        folder: folder,
        resource_type: resourceType,
      };

      // Quality and format optimization for images
      if (resourceType === 'image') {
        options.transformation = [{ quality: 'auto', fetch_format: 'auto' }];
      }

      const result = await cloudinary.uploader.upload(file.path, options);

      // Remove local copy after upload completes
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        width: result.width,
        height: result.height,
        format: result.format,
        thumbnailUrl: result.resource_type === 'video'
          ? result.secure_url.replace(/\.[^/.]+$/, ".jpg")
          : result.secure_url
      };
    } catch (err) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new Error(`Cloudinary upload failed: ${err.message}`);
    }
  }

  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
  throw new Error('Cloudinary environment variables missing or incomplete.');
};

// Delete media asset from either Cloudinary CDN or local directory
export const deleteMedia = async (publicId, fileType) => {
  if (!publicId) return;

  if (isCloudinaryConfigured && !publicId.startsWith('local_')) {
    try {
      let resourceType = 'image';
      if (fileType === 'video') {
        resourceType = 'video';
      } else if (fileType === 'document') {
        resourceType = 'raw';
      }
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log(`Deleted media ${publicId} from Cloudinary.`);
    } catch (err) {
      console.error('Failed to delete media from Cloudinary:', err.message);
    }
  } else {
    // Fallback: delete local file
    try {
      const filename = publicId.replace('local_', '');
      const filePath = path.join(localUploadsDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      console.log(`Deleted local file: ${filename}`);
    } catch (err) {
      console.error('Failed to delete local file:', err.message);
    }
  }
};
