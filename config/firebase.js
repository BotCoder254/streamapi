const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with service account
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
} catch (error) {
  // If already initialized, skip
  if (!/already exists/.test(error.message)) {
    console.error('Firebase Admin initialization error', error.stack);
  }
}

// Session cookie configuration
const SESSION_COOKIE_OPTIONS = {
  maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax'
};

module.exports = { admin, SESSION_COOKIE_OPTIONS }; 