import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import authRoutes from './routes/authRoutes.js';  
import cors from 'cors';
import friendRoutes from './routes/friendRoutes.js';
import profileRoutes from './routes/profileRoutes.js'
// import fileUploadMiddleware from './middlewares/fileUploadMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadSingleFile, uploadMultipleFiles } from './middlewares/fileUploadMiddleware.js';
import timeCapsuleRoutes from './routes/timeCapsuleRoutes.js';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json({ limit: '50mb' })); 
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use('/api/auth', authRoutes); 
app.use('/api/profile', profileRoutes); 
app.use('/api/friends', friendRoutes);
app.use('/api/timecapsules', timeCapsuleRoutes);


// app.post('/api/timecapsules/create', (req, res) => {
//     console.log('Request Body:', req.body); 
//     res.status(201).json({s
//       success: true,
//       message: 'Time Capsule created successfully',
//       data: req.body,
//     });
//   });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// const uploadsFolder = path.resolve('C:\\Users\\Pershant\\Desktop\\CliMemora\\backend', 'uploads');
// app.use('/uploads', express.static(uploadsFolder));

const PORT = process.env.PORT || 5000;
const DB_URL = process.env.MONGO_URI;

mongoose.connect(DB_URL)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => console.log('DB connection error:', err));
