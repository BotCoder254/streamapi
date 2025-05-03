const express = require('express');
const router = express.Router();
const { admin, SESSION_COOKIE_OPTIONS } = require('../config/firebase');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

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

// Authentication middleware
const isAuthenticated = async (req, res, next) => {
    try {
        const sessionCookie = req.cookies.session || '';
        if (!sessionCookie) {
            return res.redirect('/auth/login');
        }

        const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
        req.user = decodedClaims;
        next();
    } catch (error) {
        res.clearCookie('session');
        res.redirect('/auth/login');
    }
};

// Login page
router.get('/login', (req, res) => {
    res.render('auth/login', { error: null, email: '' });
});

// Register page
router.get('/register', (req, res) => {
    res.render('auth/register', { error: null });
});

// Forgot password page
router.get('/forgot-password', (req, res) => {
    res.render('auth/forgot-password');
});

// Reset password page
router.get('/reset-password', (req, res) => {
    const token = req.query.token;
    if (!token) {
        return res.redirect('/auth/login');
    }
    res.render('auth/reset-password', { token });
});

// Login handler
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Get user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        
        // Create ID token
        const idToken = await admin.auth().createCustomToken(userRecord.uid);
        
        // Create session cookie
        const sessionCookie = await admin.auth().createSessionCookie(idToken, {
            expiresIn: SESSION_COOKIE_OPTIONS.maxAge
        });
        
        // Set cookie
        res.cookie('session', sessionCookie, SESSION_COOKIE_OPTIONS);
        
        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        res.render('auth/login', { 
            error: 'Invalid email or password',
            email: req.body.email
        });
    }
});

// Register handler
router.post('/register', upload.single('profile'), async (req, res) => {
    try {
        const { email, password, username } = req.body;
        const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
        
        // Create user in Firebase
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: username,
            photoURL: req.file 
                ? `${siteUrl}/uploads/profiles/${req.file.filename}`
                : `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=10B981&color=fff`
        });
        
        // Create ID token and session cookie
        const idToken = await admin.auth().createCustomToken(userRecord.uid);
        const sessionCookie = await admin.auth().createSessionCookie(idToken, {
            expiresIn: SESSION_COOKIE_OPTIONS.maxAge
        });
        
        // Set cookie
        res.cookie('session', sessionCookie, SESSION_COOKIE_OPTIONS);
        
        res.redirect('/');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('auth/register', { 
            error: 'Failed to create account. ' + (error.message || ''),
            formData: req.body
        });
    }
});

// Forgot password handler
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        await admin.auth().generatePasswordResetLink(email, {
            url: `${process.env.SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
            handleCodeInApp: true
        });
        
        res.render('auth/forgot-password', { 
            success: 'Password reset instructions have been sent to your email' 
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.render('auth/forgot-password', { 
            error: 'Failed to send reset instructions' 
        });
    }
});

// Reset password handler
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        
        await admin.auth().verifyPasswordResetCode(token);
        await admin.auth().confirmPasswordReset(token, password);
        
        res.redirect('/auth/login?success=Password+reset+successful');
    } catch (error) {
        console.error('Reset password error:', error);
        res.render('auth/reset-password', { 
            token,
            error: 'Failed to reset password' 
        });
    }
});

// Logout handler
router.get('/logout', (req, res) => {
    res.clearCookie('session');
    res.redirect('/auth/login');
});

module.exports = {
    router,
    isAuthenticated
}; 