const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { getDB } = require('./mongodb');

// Session configuration
const SESSION_OPTIONS = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
};

// Configure Passport's Local Strategy
passport.use(new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password'
    },
    async (email, password, done) => {
        try {
            const db = getDB();
            const user = await db.collection('users').findOne({ email: email.toLowerCase() });

            if (!user) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

// Serialize user for the session
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
    try {
        const db = getDB();
        const user = await db.collection('users').findOne({ _id: id });
        done(null, user);
    } catch (error) {
        done(error);
    }
});

module.exports = { passport, SESSION_OPTIONS }; 