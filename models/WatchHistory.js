const mongoose = require('mongoose');

const WatchHistorySchema = new mongoose.Schema({
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
    poster: String,
    genre: [String],
    duration: {
        type: Number,
        default: 0
    },
    progress: {
        type: Number,
        default: 0
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

module.exports = mongoose.model('WatchHistory', WatchHistorySchema); 