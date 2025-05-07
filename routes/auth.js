const express = require('express');
const router = express.Router();
const passport = require('passport');
const crypto = require('crypto');
const User = require('../models/User');
const { forwardAuthenticated, ensureAuthenticated } = require('../config/auth');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'public/uploads/profiles';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Configure nodemailer
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'teumteum776@gmail.com',
        pass: 'pihl zudv xrwi racy'
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Email template rendering function
const renderEmailTemplate = async (templateName, data) => {
    const templatePath = path.join(__dirname, '..', 'views', 'emails', `${templateName}.ejs`);
    try {
        const template = fs.readFileSync(templatePath, 'utf-8');
        return ejs.render(template, data);
    } catch (error) {
        console.error(`Error rendering email template: ${templateName}`, error);
        throw error;
    }
};

// Send email function
const sendEmail = async (options) => {
    const mailOptions = {
        from: 'StreamAPI <teumteum776@gmail.com>',
        ...options
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

// Function to fetch latest movies
async function fetchLatestMovies() {
    try {
        const response = await axios.get('https://api.themoviedb.org/3/movie/now_playing', {
            params: {
                api_key: process.env.TMDB_API_KEY || 'fdbc5d0ea9e499aaeba73d29c21726be',
                language: 'en-US',
                page: 1
            }
        });
        return response.data.results.slice(0, 5).map(movie => ({
            title: movie.title,
            backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
            overview: movie.overview
        }));
    } catch (error) {
        console.error('Error fetching latest movies:', error);
        return [];
    }
}

// Login Page
router.get('/login', forwardAuthenticated, async (req, res) => {
    const latestMovies = await fetchLatestMovies();
    res.render('login', { latestMovies });
});

// Register Page
router.get('/register', forwardAuthenticated, async (req, res) => {
    const latestMovies = await fetchLatestMovies();
    res.render('register', { latestMovies });
});

// Register Handle
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, password2 } = req.body;
        let errors = [];
        
        // Check required fields
        if (!name || !email || !password || !password2) {
            errors.push({ msg: 'Please fill in all fields' });
        }
        
        // Check passwords match
        if (password !== password2) {
            errors.push({ msg: 'Passwords do not match' });
        }
        
        // Check password length
        if (password.length < 6) {
            errors.push({ msg: 'Password should be at least 6 characters' });
        }
        
        if (errors.length > 0) {
            const latestMovies = await fetchLatestMovies();
            return res.render('register', {
                errors,
                name,
                email,
                password,
                password2,
                latestMovies
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        
        if (existingUser) {
            errors.push({ msg: 'Email is already registered' });
            const latestMovies = await fetchLatestMovies();
            return res.render('register', {
                errors,
                name,
                email,
                password,
                password2,
                latestMovies
            });
        }

        // Create new user
        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password
        });
        
        // Save user to database
        await newUser.save();
        
        // Set success message
        req.flash('success_msg', 'You are now registered! Please log in with your credentials.');
        res.redirect('/auth/login');
        
    } catch (err) {
        console.error('Registration error:', err);
        req.flash('error_msg', 'Registration failed. Please try again.');
        res.redirect('/auth/register');
    }
});

// Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/auth/login',
        failureFlash: true,
        successFlash: 'Welcome back! You have successfully logged in.'
    })(req, res, next);
});

// Logout Handle
router.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) {
            console.error('Logout error:', err);
            return next(err);
        }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/auth/login');
    });
});

// Forgot Password Page
router.get('/forgot-password', async (req, res) => {
    const latestMovies = await fetchLatestMovies();
    res.render('forgot-password', { latestMovies });
});

// Forgot Password Handle
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            req.flash('error_msg', 'No account with that email address exists.');
            return res.redirect('/auth/forgot-password');
        }

        // Generate reset token
        const resetToken = user.generatePasswordReset();
        await user.save();

        // Create reset URL
        const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${resetToken}`;

        try {
            // Render email template
            const html = await renderEmailTemplate('password_reset', {
                name: user.name,
                resetUrl,
                siteUrl: `${req.protocol}://${req.get('host')}`
            });

            // Send email
            await sendEmail({
                to: user.email,
                subject: 'Password Reset Request - StreamAPI',
                html
            });

            req.flash('success_msg', 'An email has been sent with password reset instructions.');
            res.redirect('/auth/login');
        } catch (emailError) {
            console.error('Email sending error:', emailError);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            
            req.flash('error_msg', 'Failed to send password reset email. Please try again.');
            return res.redirect('/auth/forgot-password');
        }
    } catch (error) {
        console.error('Password reset error:', error);
        req.flash('error_msg', 'An error occurred while processing your request.');
        res.redirect('/auth/forgot-password');
    }
});

// Reset Password Page
router.get('/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('error_msg', 'Password reset token is invalid or has expired.');
            return res.redirect('/auth/forgot-password');
        }

        res.render('reset-password', {
            token: req.params.token
        });
    } catch (error) {
        console.error('Reset password error:', error);
        req.flash('error_msg', 'An error occurred while processing your request.');
        res.redirect('/auth/forgot-password');
    }
});

// Reset Password Handle
router.post('/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            req.flash('error_msg', 'Password reset token is invalid or has expired.');
            return res.redirect('/auth/forgot-password');
        }

        const { password, password2 } = req.body;

        // Validate password
        if (!password || !password2) {
            req.flash('error_msg', 'Please fill in all fields.');
            return res.redirect(`/auth/reset-password/${req.params.token}`);
        }

        if (password !== password2) {
            req.flash('error_msg', 'Passwords do not match.');
            return res.redirect(`/auth/reset-password/${req.params.token}`);
        }

        if (password.length < 6) {
            req.flash('error_msg', 'Password must be at least 6 characters.');
            return res.redirect(`/auth/reset-password/${req.params.token}`);
        }

        // Update password and clear reset token
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        req.flash('success_msg', 'Your password has been updated. Please log in with your new password.');
        res.redirect('/auth/login');
    } catch (error) {
        console.error('Reset password error:', error);
        req.flash('error_msg', 'An error occurred while resetting your password.');
        res.redirect('/auth/forgot-password');
    }
});

// Profile Page
router.get('/profile', ensureAuthenticated, async (req, res) => {
    res.render('profile', { user: req.user });
});

// Update Profile
router.post('/update-profile', ensureAuthenticated, async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.user.id);
        
        if (email !== user.email) {
            const emailExists = await User.findOne({ email: email.toLowerCase() });
            if (emailExists) {
                req.flash('error_msg', 'Email already exists');
                return res.redirect('/auth/profile');
            }
        }
        
        user.name = name;
        user.email = email.toLowerCase();
        await user.save();
        
        req.flash('success_msg', 'Profile updated successfully');
        res.redirect('/auth/profile');
    } catch (err) {
        console.error('Profile update error:', err);
        req.flash('error_msg', 'Failed to update profile');
        res.redirect('/auth/profile');
    }
});

// Change Password
router.post('/change-password', ensureAuthenticated, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const user = await User.findById(req.user.id);
        
        // Validate current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            req.flash('error_msg', 'Current password is incorrect');
            return res.redirect('/auth/profile');
        }
        
        // Validate new password
        if (newPassword !== confirmPassword) {
            req.flash('error_msg', 'New passwords do not match');
            return res.redirect('/auth/profile');
        }
        
        if (newPassword.length < 6) {
            req.flash('error_msg', 'Password must be at least 6 characters');
            return res.redirect('/auth/profile');
        }
        
        // Update password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        
        req.flash('success_msg', 'Password updated successfully');
        res.redirect('/auth/profile');
    } catch (err) {
        console.error('Password change error:', err);
        req.flash('error_msg', 'Failed to update password');
        res.redirect('/auth/profile');
    }
});

// Delete Account
router.post('/delete-account', ensureAuthenticated, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user.id);
        req.logout(function(err) {
            if (err) {
                console.error('Logout error:', err);
                return next(err);
            }
            req.flash('success_msg', 'Your account has been deleted');
            res.redirect('/auth/login');
        });
    } catch (err) {
        console.error('Account deletion error:', err);
        req.flash('error_msg', 'Failed to delete account');
        res.redirect('/auth/profile');
    }
});

// Profile Image Upload Route
router.post('/update-profile-image', ensureAuthenticated, upload.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No image file provided' 
            });
        }

        // Get the uploaded file path
        const imageUrl = `/uploads/profiles/${req.file.filename}`;

        // Update user's profile image in database
        await User.findByIdAndUpdate(req.user.id, {
            profileImage: imageUrl
        });

        res.json({ 
            success: true, 
            imageUrl: imageUrl,
            message: 'Profile image updated successfully' 
        });
    } catch (error) {
        console.error('Profile image upload error:', error);
        // If there's an error, delete the uploaded file
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        }
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update profile image' 
        });
    }
});

module.exports = router; 