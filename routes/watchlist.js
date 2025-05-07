const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { ensureAuthenticated } = require('../config/auth');

// Get watchlist items
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        
        const user = await User.findById(req.user._id);
        const watchlist = user.watchlist || [];
        
        // Sort by added date
        watchlist.sort((a, b) => b.added_date - a.added_date);
        
        // Paginate
        const paginatedItems = watchlist.slice(skip, skip + limit);
        const totalPages = Math.ceil(watchlist.length / limit) || 1;
        
        res.render('watchlist', {
            items: paginatedItems,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                total: watchlist.length
            }
        });
    } catch (error) {
        console.error('Watchlist error:', error);
        res.render('error', {
            msg: "An error occurred while retrieving your watchlist.",
            code: 500
        });
    }
});

// Add item to watchlist
router.post('/add', ensureAuthenticated, async (req, res) => {
    try {
        const { id, type, title, poster } = req.body;
        
        if (!id || !type || !title) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }
        
        const user = await User.findById(req.user._id);
        
        // Check if item already exists
        const exists = user.watchlist.some(item => 
            item.id === id && item.type === type
        );
        
        if (exists) {
            return res.status(409).json({ success: false, error: "Item already exists in watchlist" });
        }
        
        // Add new item
        user.watchlist.push({
            id,
            type,
            title,
            poster,
            added_date: new Date()
        });
        
        await user.save();
        res.json({ success: true, message: "Item added to watchlist" });
    } catch (error) {
        console.error('Add to watchlist error:', error);
        res.status(500).json({ success: false, error: "Failed to add item to watchlist" });
    }
});

// Remove item from watchlist
router.post('/remove', ensureAuthenticated, async (req, res) => {
    try {
        const { id, type } = req.body;
        
        if (!id || !type) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }
        
        const user = await User.findById(req.user._id);
        
        // Remove item
        const initialLength = user.watchlist.length;
        user.watchlist = user.watchlist.filter(item => 
            !(item.id === id && item.type === type)
        );
        
        if (user.watchlist.length === initialLength) {
            return res.status(404).json({ success: false, error: "Item not found in watchlist" });
        }
        
        await user.save();
        res.json({ success: true, message: "Item removed from watchlist" });
    } catch (error) {
        console.error('Remove from watchlist error:', error);
        res.status(500).json({ success: false, error: "Failed to remove item from watchlist" });
    }
});

// Check if item is in watchlist
router.get('/check', ensureAuthenticated, async (req, res) => {
    try {
        const { id, type } = req.query;
        
        if (!id || !type) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }
        
        const user = await User.findById(req.user._id);
        const inWatchlist = user.watchlist.some(item => 
            item.id === id && item.type === type
        );
        
        res.json({ success: true, inWatchlist });
    } catch (error) {
        console.error('Check watchlist error:', error);
        res.status(500).json({ success: false, error: "Failed to check watchlist" });
    }
});

module.exports = router; 