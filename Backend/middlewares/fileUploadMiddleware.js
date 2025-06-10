import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// const uploadFolder = path.resolve('C:\\Users\\Pershant\\Desktop\\Fyp\\Memora\\backend', 'uploads');


// ES module-compatible way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadFolder = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const upload = multer({ storage });

// Wrapper to handle missing files
export const uploadSingleFile = (req, res, next) => {
    const middleware = upload.single('file');
    middleware(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: 'File upload error', details: err.message });
        } else if (err) {
            return res.status(500).json({ error: 'Server error', details: err.message });
        }
        // Proceed if no file was uploaded but it's optional
        if (!req.file) {
            req.file = null; // Optional: Set to null if you want to handle missing files explicitly
        }
        next();
    });
};

export const uploadMultipleFiles = (req, res, next) => {
    const middleware = upload.array('files', 10);
    middleware(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: 'File upload error', details: err.message });
        } else if (err) {
            return res.status(500).json({ error: 'Server error', details: err.message });
        }
        // Proceed if no files were uploaded but it's optional
        if (!req.files || req.files.length === 0) {
            req.files = []; // Optional: Set to empty array if you want to handle missing files explicitly
        }
        next();
    });
};
