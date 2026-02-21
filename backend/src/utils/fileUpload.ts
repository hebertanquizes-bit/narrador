import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs-extra";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "104857600", 10); // 100MB

// Create storage engine
const storage: StorageEngine = multer.diskStorage({
  destination: async (req, file, cb) => {
    const userId = (req as any).userId;
    if (!userId) {
      return cb(new Error("User ID not found"), "");
    }

    const userDir = path.join(UPLOAD_DIR, userId);
    await fs.ensureDir(userDir);
    cb(null, userDir);
  },

  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${name}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

// File filter
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "text/plain",
    "text/markdown",
    "application/json",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export const uploadMiddleware = upload;
