const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const multer = require('multer');
const path = require('path');

// Reuse multer configuration from auth routes
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

// Get user profile
router.get('/', async (req, res) => {
    try {
        const userRecord = await admin.auth().getUser(req.user.uid);
        res.render('profile/index', { user: userRecord });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update profile
router.post('/update', upload.single('profile'), async (req, res) => {
    try {
        const { displayName } = req.body;
        const updateData = {
            displayName
        };

        if (req.file) {
            updateData.photoURL = `/uploads/profiles/${req.file.filename}`;
        }

        await admin.auth().updateUser(req.user.uid, updateData);
        res.redirect('/profile?success=Profile+updated+successfully');
    } catch (error) {
        console.error('Profile update error:', error);
        res.redirect('/profile?error=Failed+to+update+profile');
    }
});

// Change password
router.post('/change-password', async (req, res) => {
    try {
        const { newPassword } = req.body;
        await admin.auth().updateUser(req.user.uid, {
            password: newPassword
        });
        res.redirect('/profile?success=Password+changed+successfully');
    } catch (error) {
        console.error('Password change error:', error);
        res.redirect('/profile?error=Failed+to+change+password');
    }
});

module.exports = router; 