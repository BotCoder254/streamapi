const express = require('express');
const router = express.Router();
const passport = require('passport');
const crypto = require('crypto');
const User = require('../models/User');
const { forwardAuthenticated, ensureAuthenticated } = require('../config/auth');
const axios = require('axios');
const bcrypt = require('bcryptjs');

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
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        
        await user.save();
        
        // Send password reset email
        const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${token}`;
        const mailOptions = {
            to: user.email,
            subject: 'Password Reset',
            html: `
                <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
                <p>Please click on the following link, or paste this into your browser to complete the process:</p>
                <p><a href="${resetUrl}">${resetUrl}</a></p>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            `
        };
        
        await sendEmail(mailOptions);
        req.flash('success_msg', 'An email has been sent with further instructions.');
        res.redirect('/auth/forgot-password');
    } catch (err) {
        console.error('Password reset error:', err);
        req.flash('error_msg', 'An error occurred. Please try again.');
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
        
        res.render('reset-password', { token: req.params.token });
    } catch (err) {
        console.error('Reset password error:', err);
        req.flash('error_msg', 'An error occurred. Please try again.');
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
        
        if (password !== password2) {
            req.flash('error_msg', 'Passwords do not match.');
            return res.redirect('back');
        }
        
        if (password.length < 6) {
            req.flash('error_msg', 'Password should be at least 6 characters.');
            return res.redirect('back');
        }
        
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        
        await user.save();
        
        req.flash('success_msg', 'Your password has been updated. You can now log in with your new password.');
        res.redirect('/auth/login');
    } catch (err) {
        console.error('Reset password error:', err);
        req.flash('error_msg', 'An error occurred. Please try again.');
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

module.exports = router; 