const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mediaId: {
        type: String,
        required: true
    },
    mediaType: {
        type: String,
        enum: ['movie', 'tv'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    poster: {
        type: String
    },
    genre: [String],
    duration: {
        type: Number,
        default: 0
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    watchedAt: {
        type: Date,
        default: Date.now
    },
    completed: {
        type: Boolean,
        default: false
    }
});

// Create a compound index on user and mediaId to ensure uniqueness
watchHistorySchema.index({ user: 1, mediaId: 1 }, { unique: true });

module.exports = mongoose.model('WatchHistory', watchHistorySchema); 