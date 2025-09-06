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

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId; // From auth middleware

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false, message: 'Please provide both current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({  success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
        
      return res.status(404).json({  success: false, message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
         success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
         success: false,
        message: 'New password must be different from current password'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await User.findByIdAndUpdate(userId, {
      password: hashedNewPassword
    });

    


    res.status(200).json({ success: true, message: "Password changed successfully" });

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
        success: false,
      message: 'Error changing password',
      error: error.message || error
    });
  }
};

