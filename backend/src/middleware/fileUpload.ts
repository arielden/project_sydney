import multer from 'multer';
import path from 'path';

// Configure multer for SQL file uploads
const storage = multer.memoryStorage();

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.sql') {
    return cb(new Error('Only .sql files are allowed'));
  }

  // Check MIME type
  if (file.mimetype !== 'application/sql' && file.mimetype !== 'text/plain' && file.mimetype !== 'application/octet-stream') {
    // Allow common MIME types for SQL files
    if (!file.originalname.endsWith('.sql')) {
      return cb(new Error('File must have .sql extension'));
    }
  }

  cb(null, true);
};

export const uploadSqlFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  }
});

// Middleware to handle file upload errors
export const handleUploadError = (error: any, _req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB limit'
      });
    }
  }

  if (error.message) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  next(error);
};