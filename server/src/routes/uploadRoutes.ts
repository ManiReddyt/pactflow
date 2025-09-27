// @ts-nocheck
import { Router } from 'express';
import multer from 'multer';
import { uploadFile } from '../controllers/uploadController';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for now
    cb(null, true);
  }
});

router.post('/', upload.single('file'), uploadFile);

export default router;
