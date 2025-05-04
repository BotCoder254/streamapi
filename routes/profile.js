const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/profiles')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});

// Profile page
router.get('/', async (req, res) => {
    try {
        const db = getDB();
        const user = await db.collection('users').findOne({ _id: req.user._id });
        res.render('profile/index', { user });
    } catch (error) {
        console.error('Profile error:', error);
        res.render('error', { 
            msg: "An error occurred while retrieving your profile.",
            code: 500 
        });
    }
});

// Update profile
router.post('/update', upload.single('profile'), async (req, res) => {
    try {
        const { username, email } = req.body;
        const db = getDB();
        const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

        // Check if email is already taken by another user
        const existingUser = await db.collection('users').findOne({
            _id: { $ne: req.user._id },
            email: email.toLowerCase()
        });

        if (existingUser) {
            return res.render('profile/index', {
                user: req.user,
                error: 'Email is already taken'
            });
        }

        // Update user data
        const updateData = {
            username,
            email: email.toLowerCase()
        };

        // Add photo URL if new file uploaded
        if (req.file) {
            updateData.photoURL = `${siteUrl}/uploads/profiles/${req.file.filename}`;
        }

        await db.collection('users').updateOne(
            { _id: req.user._id },
            { $set: updateData }
        );

        // Fetch updated user data
        const updatedUser = await db.collection('users').findOne({ _id: req.user._id });

        res.render('profile/index', {
            user: updatedUser,
            success: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.render('profile/index', {
            user: req.user,
            error: 'Failed to update profile'
        });
    }
});

// Change password
router.post('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const db = getDB();

        // Verify current password
        const user = await db.collection('users').findOne({ _id: req.user._id });
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.render('profile/index', {
                user: req.user,
                error: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await db.collection('users').updateOne(
            { _id: req.user._id },
            { $set: { password: hashedPassword } }
        );

        res.render('profile/index', {
            user: req.user,
            success: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.render('profile/index', {
            user: req.user,
            error: 'Failed to change password'
        });
    }
});

// Delete account
router.post('/delete', async (req, res) => {
    try {
        const db = getDB();
        
        // Delete user
        await db.collection('users').deleteOne({ _id: req.user._id });
        
        // Logout user
        req.logout(() => {
            res.redirect('/auth/login?message=Account+deleted+successfully');
        });
    } catch (error) {
        console.error('Account deletion error:', error);
        res.render('profile/index', {
            user: req.user,
            error: 'Failed to delete account'
        });
    }
});

module.exports = router; 