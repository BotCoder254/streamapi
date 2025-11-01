const nodemailer = require('nodemailer');
const axios = require('axios');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// TMDB API Key
const TMDB_API_KEY = process.env.TMDB_API_KEY || 'fdbc5d0ea9e499aaeba73d29c21726be';
const SITE_URL = process.env.SITE_URL || 'https://streamapi-x4gu.onrender.com';

// Secure axios wrapper to prevent data: URI DoS attacks
const secureAxios = {
  async get(url, config = {}) {
    // Validate URL to prevent data: URI attacks
    if (typeof url === 'string' && url.toLowerCase().startsWith('data:')) {
      throw new Error('Data URIs are not allowed for security reasons');
    }
    
    // Set security limits
    const secureConfig = {
      ...config,
      maxContentLength: 50 * 1024 * 1024, // 50MB limit
      maxBodyLength: 50 * 1024 * 1024,    // 50MB limit
      timeout: 30000, // 30 second timeout
    };
    
    return axios.get(url, secureConfig);
  }
};

// Helper function to fetch trending movies from TMDB
async function fetchTrending(mediaType = 'movie', timeWindow = 'week', page = 1) {
  try {
    const response = await secureAxios.get(`https://api.themoviedb.org/3/trending/${mediaType}/${timeWindow}`, {
      params: {
        api_key: TMDB_API_KEY,
        page
      }
    });
    return response.data.results || [];
  } catch (error) {
    console.error(`Error fetching trending ${mediaType}: ${error.message}`);
    return [];
  }
}

// Email template rendering function
const renderEmailTemplate = async (templateName, data) => {
  const templatePath = path.join(__dirname, 'views', 'emails', `${templateName}.ejs`);
  try {
    const template = fs.readFileSync(templatePath, 'utf-8');
    const html = ejs.render(template, { ...data, siteUrl: SITE_URL });
    return html;
  } catch (error) {
    console.error(`Error rendering email template: ${templateName}`, error);
    throw error;
  }
};

// Create a test email script to verify the newsletter functionality works
async function testNewsletterEmail() {
  // Create a transporter using the same configuration as the main app
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'teumteum776@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'pihl zudv xrwi racy'
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Fetch trending movies
    console.log('Fetching trending movies...');
    const trendingMovies = await fetchTrending('movie', 'week', 1);
    const formattedTrendingMovies = trendingMovies.slice(0, 3).map(movie => ({
      title: movie.title,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      id: movie.id
    }));

    console.log('Trending movies fetched:');
    formattedTrendingMovies.forEach((movie, index) => {
      console.log(`${index + 1}. ${movie.title} (ID: ${movie.id})`);
    });

    // Generate the email template
    console.log('Rendering newsletter template...');
    const email = process.env.EMAIL_USER;
    const html = await renderEmailTemplate('newsletter_subscription', {
      email,
      trendingMovies: formattedTrendingMovies
    });

    // Define the mail options
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'StreamAPI <noreply@streamapi.com>',
      to: email, // Send to yourself for testing
      subject: 'Welcome to StreamAPI Newsletter',
      html
    };

    // Send the test email
    console.log('Sending newsletter email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Email sent to:', email);
    return true;
  } catch (error) {
    console.error('Error sending newsletter email:', error);
    console.log('Email configuration:');
    console.log('- Host:', process.env.EMAIL_HOST);
    console.log('- Port:', process.env.EMAIL_PORT);
    console.log('- User:', process.env.EMAIL_USER);
    console.log('- From:', process.env.EMAIL_FROM);
    return false;
  }
}

// Run the test
testNewsletterEmail()
  .then(success => {
    if (success) {
      console.log('Newsletter email test completed successfully!');
    } else {
      console.error('Newsletter email test failed. Please check your configuration.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  }); 