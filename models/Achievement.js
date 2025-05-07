const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true
    },
    badge: {
        name: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        }
    },
    category: {
        type: String,
        enum: ['watching', 'engagement', 'social', 'special'],
        required: true
    },
    progress: {
        current: {
            type: Number,
            default: 0
        },
        target: {
            type: Number,
            required: true
        }
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
    },
    tier: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum'],
        default: 'bronze'
    },
    points: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Virtual for progress percentage
AchievementSchema.virtual('progressPercentage').get(function() {
    return Math.min(100, Math.round((this.progress.current / this.progress.target) * 100));
});

// Virtual for badge color based on tier
AchievementSchema.virtual('badgeColor').get(function() {
    const colors = {
        bronze: '#CD7F32',
        silver: '#C0C0C0',
        gold: '#FFD700',
        platinum: '#E5E4E2'
    };
    return colors[this.tier] || colors.bronze;
});

module.exports = mongoose.model('Achievement', AchievementSchema); 