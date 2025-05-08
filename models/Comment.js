const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
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
    content: {
        type: String,
        required: true,
        trim: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Add indexes for faster queries
CommentSchema.index({ mediaId: 1, mediaType: 1 });
CommentSchema.index({ parentId: 1 });

module.exports = mongoose.model('Comment', CommentSchema);