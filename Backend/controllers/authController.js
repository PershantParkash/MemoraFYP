import { User } from '../models/userModel.js';  
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config(); 



export const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10); 

        const user = await User.create({
            email: normalizedEmail,
            password: hashedPassword, 
        });

        const token = jwt.sign(
            { userId: user._id}, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } 
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            userId: user._id,
        });
    } catch (error) {
        console.error('Error registering user:', error); 
        res.status(500).json({ message: 'Error registering user', error: error.message || error });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
       console.log({ email, password })
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Login successful',
            token,
            userId: user._id
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const currentUserId = req.userId; 

        const users = await User.find({ _id: { $ne: currentUserId } }).select('email');

        res.status(200).json({
            message: 'Users fetched successfully',
            users,
        });
    } catch (error) {
        console.error('Error fetching users:', error.message, error.stack);
        res.status(500).json({ message: 'Error fetching users', error: error.message || error });
    }
};
