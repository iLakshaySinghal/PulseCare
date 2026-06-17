import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import logger from '../config/logger.js';

// Local storage directory definition
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  logger.info(`Created local uploads directory at: ${LOCAL_UPLOADS_DIR}`);
}

/**
 * Uploads a file buffer to Cloudinary or falls back to local disk storage
 * Returns object with: { fileUrl, publicId, fileName }
 */
export const uploadFileStream = async (fileBuffer, originalName, mimeType) => {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'hms_emr_attachments',
          resource_type: 'auto',
          type: 'private' // secure private assets
        },
        (error, result) => {
          if (error) {
            logger.error(`Cloudinary upload failed: ${error.message}`);
            return reject(error);
          }
          resolve({
            fileUrl: result.secure_url,
            publicId: result.public_id,
            fileName: originalName
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  } else {
    // Local storage fallback
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(originalName);
    const uniqueFileName = `${hash}${ext}`;
    const targetPath = path.join(LOCAL_UPLOADS_DIR, uniqueFileName);

    await fs.promises.writeFile(targetPath, fileBuffer);
    
    // Express static asset path
    const fileUrl = `/uploads/${uniqueFileName}`;
    logger.debug(`File written to local fallback storage: ${fileUrl}`);
    
    return {
      fileUrl,
      publicId: uniqueFileName,
      fileName: originalName
    };
  }
};

/**
 * Generates a signed URL with a 15-minute expiration (TTL) for secure access
 */
export const generateSignedUrl = (fileUrlOrPublicId) => {
  if (isCloudinaryConfigured && !fileUrlOrPublicId.startsWith('/uploads')) {
    // Generate private signed Cloudinary url (valid for 15 minutes)
    const expiration = Math.floor(Date.now() / 1000) + 15 * 60; // +15 mins
    return cloudinary.url(fileUrlOrPublicId, {
      sign_url: true,
      type: 'private',
      expires_at: expiration
    });
  } else {
    // Local storage path: return the URL directly
    // In production we would proxy this or generate a signed cookie/token
    return fileUrlOrPublicId;
  }
};

export default {
  uploadFileStream,
  generateSignedUrl
};
