const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { getDB } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/profiles');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
};

// Login routes
router.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.render('auth/login', { layout: 'layout' });
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth/login',
    failureFlash: true
}));

// Register routes
router.get('/register', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.render('auth/register', { layout: 'layout' });
});

router.post('/register', upload.single('profile_picture'), async (req, res) => {
    try {
        const db = getDB();
        const { username, email, password, confirm_password } = req.body;

        // Validation
        if (password !== confirm_password) {
            return res.render('auth/register', { error: 'Passwords do not match', layout: 'layout' });
        }

        // Check if user already exists
        const existingUser = await db.collection('users').findOne({
            $or: [{ email: email.toLowerCase() }, { username }]
        });

        if (existingUser) {
            return res.render('auth/register', { error: 'Email or username already exists', layout: 'layout' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = {
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            profile_picture: req.file ? `/uploads/profiles/${req.file.filename}` : '/images/default-avatar.png',
            created_at: new Date()
        };

        await db.collection('users').insertOne(user);

        // Log in the user after registration
        req.login(user, (err) => {
            if (err) {
                console.error('Login error:', err);
                return res.render('auth/register', { error: 'Error logging in after registration', layout: 'layout' });
            }
            res.redirect('/');
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.render('auth/register', { error: 'Error creating account', layout: 'layout' });
    }
});

// Forgot password routes
router.get('/forgot-password', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.render('auth/forgot-password', { layout: 'layout' });
});

router.post('/forgot-password', async (req, res) => {
    try {
        const db = getDB();
        const { email } = req.body;
        
        const user = await db.collection('users').findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.render('auth/forgot-password', { error: 'No account found with that email', layout: 'layout' });
        }

        // Generate reset token
        const token = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour

        await db.collection('users').updateOne(
            { email: email.toLowerCase() },
            { $set: { resetToken: token, resetTokenExpiry } }
        );

        // Send reset email
        // ... email sending logic ...

        res.render('auth/forgot-password', { success: 'Password reset instructions sent to your email', layout: 'layout' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.render('auth/forgot-password', { error: 'Error processing request', layout: 'layout' });
    }
});

// Reset password routes
router.get('/reset-password', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    res.render('auth/reset-password', { layout: 'layout' });
});

router.post('/reset-password', async (req, res) => {
    try {
        const db = getDB();
        const { token, password, confirm_password } = req.body;

        if (password !== confirm_password) {
            return res.render('auth/reset-password', { error: 'Passwords do not match', layout: 'layout' });
        }

        const user = await db.collection('users').findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.render('auth/reset-password', { error: 'Invalid or expired reset token', layout: 'layout' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: { resetToken: "", resetTokenExpiry: "" }
            }
        );

        res.render('auth/login', { success: 'Password successfully reset. Please log in.', layout: 'layout' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.render('auth/reset-password', { error: 'Error resetting password', layout: 'layout' });
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

module.exports = { router, isAuthenticated }; 