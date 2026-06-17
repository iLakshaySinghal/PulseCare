import { v2 as cloudinary } from 'cloudinary';
import logger from './logger.js';

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  logger.info('Cloudinary configured successfully.');
} else {
  logger.warn('Cloudinary environment variables missing. Storage service will fall back to local disk uploads.');
}

export { cloudinary, isCloudinaryConfigured };
export default cloudinary;
