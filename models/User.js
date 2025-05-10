const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Drop the existing index if it exists
mongoose.connection.on('open', async () => {
    try {
        await mongoose.connection.db.collection('users').dropIndex('username_1');
        console.log('Dropped problematic index');
    } catch (err) {
        console.log('No problematic index to drop or already dropped');
    }
});

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        sparse: true,  // Allow multiple documents with no value for this field
        default: undefined
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    profileImage: {
        type: String,
        default: null
    },
    date: {
        type: Date,
        default: Date.now
    },
    watchlist: [{
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
        added_date: {
            type: Date,
            default: Date.now
        }
    }],
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

// Create a new username index with sparse option (only indexed if field exists)
UserSchema.index({ username: 1 }, { unique: true, sparse: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Generate password reset token
UserSchema.methods.generatePasswordReset = function() {
    const crypto = require('crypto');
    this.resetPasswordToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    return this.resetPasswordToken;
};

module.exports = mongoose.model('User', UserSchema); 