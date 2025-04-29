// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const expressLayouts = require('express-ejs-layouts');
const nodemailer = require('nodemailer');
const ejs = require('ejs');
const fs = require('fs');
const useragent = require('express-useragent');
const os = require('os');
const NetworkSpeed = require('network-speed');
const testNetworkSpeed = new NetworkSpeed();
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = require('http').createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket connection handling
wss.on('connection', function connection(ws) {
    // Send initial user count
    ws.send(JSON.stringify({ type: 'userCount', count: activeUsers }));
});

// Function to broadcast user count to all connected clients
function broadcastUserCount() {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'userCount', count: activeUsers }));
        }
    });
}

// Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY || 'fdbc5d0ea9e499aaeba73d29c21726be'; //Dont mess with this 
const VIDSRC_EMBED_BASE = 'https://vidsrc.xyz/embed'; //Dont mess with this 

// Site Configuration
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const SITE_AUTHOR = process.env.SITE_AUTHOR || '@BotCoder254';
const SITE_AUTHOR_URL = process.env.SITE_AUTHOR_URL || 'https://github.com/BotCoder254';

// Session storage for tracking user information
const userSessions = new Map();

// Add active users tracking
let activeUsers = 0;

// Simple in-memory storage for watchlist (in a real app, this would be a database)
const watchlistStorage = {
  items: [],
  
  addItem(item) {
    // Check if item already exists in watchlist
    const exists = this.items.some(existing => 
      existing.id === item.id && existing.type === item.type
    );
    
    if (!exists) {
      item.added_date = new Date().toLocaleDateString();
      this.items.push(item);
      return true;
    }
    return false;
  },
  
  removeItem(id, type) {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => !(item.id === id && item.type === type));
    return this.items.length < initialLength;
  },
  
  getItems(page = 1, limit = 20) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = this.items.slice(startIndex, endIndex);
    
    return {
      watchlist: paginatedItems,
      pagination: {
        total: this.items.length,
        current_page: page,
        total_pages: Math.ceil(this.items.length / limit) || 1
      }
    };
  }
};

// Simple in-memory storage for newsletter subscribers
const newsletterStorage = {
  subscribers: [],
  
  addSubscriber(email) {
    // Check if email already exists
    const exists = this.subscribers.some(subscriber => subscriber.email === email);
    
    if (!exists) {
      this.subscribers.push({
        email,
        date: new Date().toISOString()
      });
      return true;
    }
    return false;
  },
  
  getSubscribers() {
    return this.subscribers;
  }
};

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'teumteum776@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'pihl zudv xrwi racy'
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates in development
  }
});

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

// Function to send an email
const sendEmail = async (options) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'StreamAPI <noreply@streamapi.com>',
    ...options
  };

  try {
    // Always attempt to send the email regardless of environment
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Ad blocker middleware
app.use((req, res, next) => {
  // Block common ad domains and tracking scripts
  const blockedDomains = [
    'doubleclick.net',
    'google-analytics.com',
    'adnxs.com',
    'advertising.com',
    'fastclick.net',
    'quantserve.com',
    'scorecardresearch.com',
    'zedo.com',
    'adbrite.com',
    'adbureau.net',
    'admob.com',
    'bannersxchange.com',
    'buysellads.com',
    'dtscout.com',
    'popads.net'
  ];

  const referer = req.get('Referer') || '';
  const isAdRequest = blockedDomains.some(domain => referer.includes(domain));

  if (isAdRequest) {
    return res.status(403).end();
  }

  // Add security headers
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
  
  next();
});

// Middleware to track user information
app.use(useragent.express());

// Middleware to track user session time and get network speed
app.use(async (req, res, next) => {
    const sessionId = req.ip + '-' + req.headers['user-agent'];
    
    if (!userSessions.has(sessionId)) {
        activeUsers++;
        broadcastUserCount(); // Broadcast when user count changes
        userSessions.set(sessionId, {
            startTime: Date.now(),
            networkSpeed: 'Checking...'
        });
        
        // Get network speed (run this only once per session)
        try {
            const baseUrl = 'https://raw.githubusercontent.com/librespeed/speedtest-go/master/web/assets/garbage.php';
            const speed = await testNetworkSpeed.checkDownloadSpeed(baseUrl, 1000);
            const speedMbps = typeof speed === 'object' && speed.mbps ? 
                            parseFloat(speed.mbps).toFixed(2) : 
                            'Unknown';
            userSessions.get(sessionId).networkSpeed = `${speedMbps} Mbps`;
        } catch (error) {
            console.error('Network speed test error:', error);
            userSessions.get(sessionId).networkSpeed = 'Unable to determine';
        }
    }
    
    // Calculate time spent
    const session = userSessions.get(sessionId);
    const timeSpent = Math.floor((Date.now() - session.startTime) / 1000); // in seconds
    
    // Add active users count to locals
    res.locals.activeUsers = activeUsers;
    
    // Fix: Rename the OS property to systemInfo to avoid conflict
    res.locals.userInfo = {
        systemInfo: {
            platform: os.platform(),
            release: os.release(),
            type: os.type()
        },
        browser: req.useragent.browser,
        version: req.useragent.version,
        userOs: req.useragent.os,
        platform: req.useragent.platform,
        timeSpent: timeSpent,
        networkSpeed: session.networkSpeed
    };
    
    next();
});

// Update the cleanup interval to broadcast user count when it changes
setInterval(() => {
    const now = Date.now();
    let userCountChanged = false;
    
    for (const [sessionId, session] of userSessions.entries()) {
        if (now - session.startTime > 30 * 60 * 1000) {
            userSessions.delete(sessionId);
            activeUsers = Math.max(0, activeUsers - 1);
            userCountChanged = true;
        }
    }
    
    if (userCountChanged) {
        broadcastUserCount();
    }
}, 5 * 60 * 1000);

// Helper functions
const fetchFromTMDB = async (endpoint, params = {}) => {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3${endpoint}`, {
      params: {
        api_key: TMDB_API_KEY,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching from TMDB: ${error.message}`);
    throw error;
  }
};

// Fetch trailers for a movie or TV show
const fetchTrailers = async (id, type = 'movie') => {
  try {
    const data = await fetchFromTMDB(`/${type}/${id}/videos`);
    if (data.results && data.results.length > 0) {
      // Filter for YouTube trailers and sort by newest first
      return data.results
        .filter(video => video.site === 'YouTube' && 
                        (video.type === 'Trailer' || video.type === 'Teaser'))
        .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
        .map(video => ({
          id: video.key,
          name: video.name,
          type: video.type,
          site: video.site,
          url: `https://www.youtube.com/embed/${video.key}`,
          thumbnail: `https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`
        }));
    }
    return [];
  } catch (error) {
    console.error(`Error fetching trailers: ${error.message}`);
    return [];
  }
};

// Fetch trending items for homepage sliders
const fetchTrending = async (mediaType = 'all', timeWindow = 'week', page = 1) => {
  try {
    const data = await fetchFromTMDB(`/trending/${mediaType}/${timeWindow}`, { page });
    return data.results || [];
  } catch (error) {
    console.error(`Error fetching trending ${mediaType}: ${error.message}`);
    return [];
  }
};

// Fetch featured content for homepage hero section
const fetchFeaturedContent = async () => {
  try {
    // Fetch upcoming movies with backdrop images for the hero section
    const data = await fetchFromTMDB('/movie/upcoming', { page: 1 });
    
    // Filter to only movies with backdrop images and sort by popularity
    if (data.results && data.results.length > 0) {
      return data.results
        .filter(movie => movie.backdrop_path)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 5)
        .map(movie => ({
          id: movie.id,
          title: movie.title,
          overview: movie.overview,
          backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
        }));
    }
    return [];
  } catch (error) {
    console.error(`Error fetching featured content: ${error.message}`);
    return [];
  }
};

const fetchLatestMovies = async (page = 1) => {
  try {
    // Use TMDB API to fetch the latest movies (now_playing endpoint)
    const data = await fetchFromTMDB('/movie/now_playing', { page });
    
    // Format the response to match the expected structure
    if (data && data.results) {
      return { 
        movies: data.results.map(movie => ({
          tmdb_id: movie.id,
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path
        })),
        page: data.page,
        total_pages: data.total_pages 
      };
    }
    
    return { movies: [] };
  } catch (error) {
    console.error(`Error fetching latest movies: ${error.message}`);
    return { movies: [] };
  }
};

const fetchLatestTVShows = async (page = 1) => {
  try {
    const data = await fetchFromTMDB('/tv/on_the_air', { page });
    return data;
  } catch (error) {
    console.error(`Error fetching latest TV shows: ${error.message}`);
    return { results: [] };
  }
};

const fetchLatestEpisodes = async (page = 1) => {
  try {
    // Fetch the latest episodes from VidSrc API
    const response = await axios.get(`https://vidsrc.xyz/episodes/latest/page-${page}.json`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching latest episodes: ${error.message}`);
    return { episodes: [] };
  }
};

// Helper error handler function to standardize error responses
const handleError = (res, message, code = 500) => {
  console.error(`Error (${code}): ${message}`);
  return res.status(code).render('error', { 
    msg: message,
    code: code 
  });
};

// Add a helper function for API error responses to complement handleError for page errors
function handleApiError(res, message, code = 500) {
  console.error(`API Error (${code}): ${message}`);
  return res.status(code).json({ success: false, error: message });
}

// Routes for Movies
app.get('/', async (req, res) => {
  try {
    // Fetch data for all sliders in parallel
    const [featured, trendingMovies, latestMoviesData, popularShowsData, latestEpisodesData] = await Promise.all([
      fetchFeaturedContent(),
      fetchTrending('movie', 'week'),
      fetchLatestMovies(),
      fetchFromTMDB('/tv/popular'),
      fetchLatestEpisodes()
    ]);

    // Format the data for each slider
    const formattedTrendingMovies = trendingMovies.slice(0, 15).map(movie => ({
      id: movie.id,
      title: movie.title,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null
    }));

    const latestMovies = (latestMoviesData.movies || []).slice(0, 15).map(movie => ({
      id: movie.tmdb_id || movie.id,
      title: movie.title,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
    }));

    const popularShows = (popularShowsData.results || []).slice(0, 15).map(show => ({
      id: show.id,
      title: show.name,
      poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null
    }));

    const latestEpisodes = (latestEpisodesData.episodes || []).slice(0, 15).map(episode => ({
      show_id: episode.show_id,
      show_title: episode.show_title,
      season_number: episode.season_number,
      episode_number: episode.episode_number,
      name: episode.name,
      still: episode.still_path ? `https://image.tmdb.org/t/p/w500${episode.still_path}` : null
    }));

    // Render the home page with all slider data
    res.render('home', {
      featured,
      trendingMovies: formattedTrendingMovies,
      latestMovies,
      popularShows,
      latestEpisodes
    });
  } catch (error) {
    console.error(`Home page error: ${error.message}`);
    // If there's an error, redirect to the old browse page as fallback
  res.redirect('/browse');
  }
});

app.get('/browse', async (req, res) => {
  try {
    const page = req.query.p || 1;
    const data = await fetchFromTMDB('/movie/popular', { page });
    
    if (!data.results) {
      return handleError(res, "Sorry, could not retrieve movie data. Please try again later.", 500);
    }

    const movies = data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
    }));
    
    res.render('index', { movies, page });
  } catch (error) {
    handleError(res, "An error occurred while retrieving movies.", 500);
  }
});

app.get('/latest', async (req, res) => {
  try {
    const page = req.query.p || 1;
    const data = await fetchLatestMovies(page);
    
    if (!data.movies || !Array.isArray(data.movies)) {
      return handleError(res, "Sorry, could not retrieve latest movies. Please try again later.", 500);
    }

    // You may need to modify this based on the actual response structure
    const movies = data.movies.map(movie => ({
      id: movie.tmdb_id || movie.id,
      title: movie.title,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
    }));
    
    res.render('latest', { movies, page });
  } catch (error) {
    handleError(res, "An error occurred while retrieving latest movies.", 500);
  }
});

app.get('/top', async (req, res) => {
  try {
    const page = req.query.p || 1;
    const data = await fetchFromTMDB('/movie/top_rated', { page });
    
    if (!data.results) {
      return handleError(res, "Sorry, could not retrieve movie data. Please try again later.", 500);
    }

    const movies = data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
    }));
    
    res.render('top', { movies, page });
  } catch (error) {
    handleError(res, "An error occurred while retrieving top rated movies.", 500);
  }
});

app.get('/search', async (req, res) => {
  try {
    // Fetch popular TV shows for the search page
    const data = await fetchFromTMDB('/tv/popular', { page: 1 });
    
    const popularShows = data.results ? 
      data.results.slice(0, 4).map(show => ({
        id: show.id,
        title: show.name,
        poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null
      })) : [];
    
    res.render('search', { popularShows });
  } catch (error) {
    console.error(`Search page error: ${error.message}`);
    res.render('search', { popularShows: [] });
  }
});

app.get('/results', async (req, res) => {
  try {
    const query = req.query.q;
    const page = req.query.p || 1;
    
    if (!query) {
      return res.render('search');
    }
    
    const data = await fetchFromTMDB('/search/movie', { query, page });
    
    if (!data.results) {
      return handleError(res, "Sorry, could not retrieve search results. Please try again later.", 500);
    }
    
    if (data.results.length === 0) {
      return handleError(res, `No movies found matching "${query}"`, 404);
    }
    
    const movies = data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
    }));
    
    res.render('results', { movies, query, page });
  } catch (error) {
    handleError(res, "An error occurred during search.", 500);
  }
});

app.get('/view/movie/:id', async (req, res) => {
  try {
    const tmdbId = req.params.id;
    
    // Get movie details, trailers, and similar movies in parallel
    const [movieData, externalIds, similarData, trailers] = await Promise.all([
      fetchFromTMDB(`/movie/${tmdbId}`),
      fetchFromTMDB(`/movie/${tmdbId}/external_ids`),
      fetchFromTMDB(`/movie/${tmdbId}/similar`),
      fetchTrailers(tmdbId, 'movie')
    ]);
    
    const imdbId = externalIds.imdb_id;
    
    const similarMovies = similarData.results.slice(0, 12).map(m => ({
      id: m.id,
      title: m.title,
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w300${m.poster_path}` : null
    }));
    
    // Generate embed URLs
    const embedUrl = `${VIDSRC_EMBED_BASE}/movie/${tmdbId}`;
    const imdbEmbedUrl = imdbId ? `${VIDSRC_EMBED_BASE}/movie/${imdbId}` : null;
    
    const movie = {
      tmdbId,
      imdbId,
      title: movieData.title,
      overview: movieData.overview,
      runtime: `${movieData.runtime} min.`,
      rating: `${movieData.vote_average}/10`,
      poster: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : null,
      background: movieData.backdrop_path ? `https://image.tmdb.org/t/p/original${movieData.backdrop_path}` : null,
      year: movieData.release_date ? `(${movieData.release_date.split('-')[0]})` : '',
      tagline: movieData.tagline,
      embedUrl: embedUrl,
      similarMovies: similarMovies,
      trailers: trailers
    };
    
    res.render('movie', { movie });
  } catch (error) {
    res.render('error', { 
      msg: "An error occurred while retrieving movie details.",
      code: 500 
    });
  }
});

app.get('/api/player', async (req, res) => {
  try {
    const tmdbId = req.query.id;
    const imdbId = req.query.imdb;
    const title = req.query.title || 'StreamAPI Player';
    const season = req.query.season;
    const episode = req.query.episode;
    const subUrl = req.query.sub_url;
    const dsLang = req.query.ds_lang;
    const posterPath = req.query.poster;
    
    if (!tmdbId && !imdbId) {
      return res.status(400).send("Either TMDB ID or IMDB ID is required!");
    }
    
    let embedUrl;
    let mediaType = 'movie';
    
    // Handle TV episodes
    if (season && episode) {
      mediaType = 'tv';
      embedUrl = `${VIDSRC_EMBED_BASE}/tv/${tmdbId}/${season}-${episode}`;
    } else if (imdbId) {
      // Handle movies with IMDB ID
      embedUrl = `${VIDSRC_EMBED_BASE}/movie/${imdbId}`;
    } else {
      // Handle movies with TMDB ID
      embedUrl = `${VIDSRC_EMBED_BASE}/movie/${tmdbId}`;
    }
    
    // Add optional parameters if provided
    const params = new URLSearchParams();
    if (subUrl) params.append('sub_url', subUrl);
    if (dsLang) params.append('ds_lang', dsLang);
    
    const queryString = params.toString();
    if (queryString) {
      embedUrl += `?${queryString}`;
    }

    // Set CSP headers to prevent unwanted redirects and popups
    res.setHeader('Content-Security-Policy', `
      default-src 'self' ${VIDSRC_EMBED_BASE};
      frame-src 'self' ${VIDSRC_EMBED_BASE} https://www.youtube.com;
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: http:;
      media-src 'self' blob: ${VIDSRC_EMBED_BASE};
      connect-src 'self' ${VIDSRC_EMBED_BASE};
    `.replace(/\s+/g, ' ').trim());
    
    // Pass additional context to the player template
    res.render('player', { 
      embedUrl,
      title,
      mediaType,
      tmdbId,
      imdbId,
      season,
      episode,
      posterPath,
      isMobile: req.useragent.isMobile,
      isTablet: req.useragent.isTablet
    });
  } catch (error) {
    console.error(`Player error: ${error.message}`);
    res.status(500).render('error', { 
      msg: "An error occurred while loading the player.",
      code: 500 
    });
  }
});

// Routes for TV Shows
app.get('/browse/tv', async (req, res) => {
  try {
    const page = req.query.p || 1;
    const data = await fetchFromTMDB('/tv/popular', { page });
    
    if (!data.results) {
      return handleError(res, "Sorry, could not retrieve TV show data. Please try again later.", 500);
    }

    const shows = data.results.map(show => ({
      id: show.id,
      title: show.name,
      poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null
    }));
    
    res.render('tv_browse', { shows, page });
  } catch (error) {
    handleError(res, "An error occurred while retrieving TV shows.", 500);
  }
});

app.get('/latest/tv', async (req, res) => {
  try {
    const page = req.query.p || 1;
    const data = await fetchLatestTVShows(page);
    
    if (!data.results || !Array.isArray(data.results)) {
      return handleError(res, "Sorry, could not retrieve latest TV shows. Please try again later.", 500);
    }

    // You may need to modify this based on the actual response structure
    const shows = data.results.map(show => ({
      id: show.tmdb_id || show.id,
      title: show.name,
      poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null
    }));
    
    res.render('latest_tv', { shows, page });
  } catch (error) {
    handleError(res, "An error occurred while retrieving latest TV shows.", 500);
  }
});

app.get('/latest/episodes', async (req, res) => {
  try {
    const page = req.query.p || 1;
    const data = await fetchLatestEpisodes(page);
    
    if (!data.episodes || !Array.isArray(data.episodes)) {
      return handleError(res, "Sorry, could not retrieve latest episodes. Please try again later.", 500);
    }

    // You may need to modify this based on the actual response structure
    const episodes = data.episodes;
    
    res.render('latest_episodes', { episodes, page });
  } catch (error) {
    handleError(res, "An error occurred while retrieving latest episodes.", 500);
  }
});

app.get('/top/tv', async (req, res) => {
  try {
    const page = req.query.p || 1;
    const data = await fetchFromTMDB('/tv/top_rated', { page });
    
    if (!data.results) {
      return res.render('error', { 
        msg: "Sorry, could not retrieve TV show data. Please try again later.",
        code: 500 
      });
    }

    const shows = data.results.map(show => ({
      id: show.id,
      title: show.name,
      poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null
    }));
    
    res.render('top_tv', { shows, page });
  } catch (error) {
    res.render('error', { 
      msg: "An error occurred while retrieving top rated TV shows.",
      code: 500 
    });
  }
});

app.get('/search/tv', (req, res) => {
  res.render('search_tv');
});

app.get('/results/tv', async (req, res) => {
  try {
    const query = req.query.q;
    const page = req.query.p || 1;
    
    if (!query) {
      return res.render('search_tv');
    }
    
    const data = await fetchFromTMDB('/search/tv', { query, page });
    
    if (!data.results) {
      return handleError(res, "Sorry, could not retrieve search results. Please try again later.", 500);
    }
    
    if (data.results.length === 0) {
      return handleError(res, `No TV shows found matching "${query}"`, 404);
    }
    
    const shows = data.results.map(show => ({
      id: show.id,
      title: show.name,
      poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null
    }));
    
    res.render('results_tv', { shows, query, page });
  } catch (error) {
    handleError(res, "An error occurred during search.", 500);
  }
});

app.get('/view/tv/:id', async (req, res) => {
  try {
    const tmdbId = req.params.id;
    
    // Get TV show details, trailers, and similar shows in parallel
    const [showData, externalIds, similarData, trailers] = await Promise.all([
      fetchFromTMDB(`/tv/${tmdbId}`),
      fetchFromTMDB(`/tv/${tmdbId}/external_ids`),
      fetchFromTMDB(`/tv/${tmdbId}/similar`),
      fetchTrailers(tmdbId, 'tv')
    ]);
    
    const imdbId = externalIds.imdb_id;
    
    const similarShows = similarData.results.slice(0, 12).map(s => ({
      id: s.id,
      title: s.name,
      poster: s.poster_path ? `https://image.tmdb.org/t/p/w300${s.poster_path}` : null
    }));
    
    // Get seasons data
    const seasons = showData.seasons.map(season => ({
      season_number: season.season_number,
      episode_count: season.episode_count,
      name: season.name,
      overview: season.overview,
      poster: season.poster_path ? `https://image.tmdb.org/t/p/w300${season.poster_path}` : null
    }));
    
    const show = {
      tmdbId,
      imdbId,
      title: showData.name,
      overview: showData.overview,
      status: showData.status,
      rating: `${showData.vote_average}/10`,
      poster: showData.poster_path ? `https://image.tmdb.org/t/p/w500${showData.poster_path}` : null,
      background: showData.backdrop_path ? `https://image.tmdb.org/t/p/original${showData.backdrop_path}` : null,
      year: showData.first_air_date ? `(${showData.first_air_date.split('-')[0]})` : '',
      tagline: showData.tagline,
      seasons: seasons,
      similarShows: similarShows,
      trailers: trailers
    };
    
    res.render('tv', { show });
  } catch (error) {
    res.render('error', { 
      msg: "An error occurred while retrieving TV show details.",
      code: 500 
    });
  }
});

app.get('/view/tv/:id/:s/:e', async (req, res) => {
  try {
    const { id, s, e } = req.params;
    
    // Get TV show details
    const tvData = await fetchFromTMDB(`/tv/${id}`);
    
    // Get episode details
    const episodeData = await fetchFromTMDB(`/tv/${id}/season/${s}/episode/${e}`);
    
    // Get external IDs (IMDB ID)
    const externalIds = await fetchFromTMDB(`/tv/${id}/external_ids`);
    const imdbId = externalIds.imdb_id;
    
    // Generate embed URL - using the format for episodes
    const embedUrl = `${VIDSRC_EMBED_BASE}/tv/${id}/${s}-${e}`;
    
    const seasons = tvData.seasons || [];
    const currentSeason = parseInt(s) - 1;
    const nextSeason = currentSeason + 1;
    const epCount = currentSeason >= 0 && currentSeason < seasons.length ? seasons[currentSeason].episode_count + 1 : 1;
    
    const episode = {
      id,
      imdbId,
      season: s,
      episode: e,
      title: episodeData.name,
      overview: episodeData.overview,
      year: episodeData.air_date ? episodeData.air_date.split('-')[0] : '',
      rating: episodeData.vote_average ? Math.round(episodeData.vote_average * 10) / 10 : 0,
      embedUrl: embedUrl
    };
    
    res.render('view_tv', { 
      episode,
      seasons,
      currentSeason,
      nextSeason,
      epCount
    });
  } catch (error) {
    res.render('error', { 
      msg: "Sorry, Not Found!",
      code: 404 
    });
  }
});

app.get('/api', (req, res) => {
  res.render('api');
});

// Update Search API
app.get('/api/search', async (req, res) => {
  try {
    const { q: query, type = 'movie', page = 1, limit } = req.query;
    
    if (!query) {
      return handleApiError(res, "Search query is required", 400);
    }
    
    if (type !== 'movie' && type !== 'tv') {
      return handleApiError(res, "Invalid search type. Must be 'movie' or 'tv'", 400);
    }
    
    const searchResults = await fetchFromTMDB(
      `/search/${type}`,
      { query, page, include_adult: false }
    );
    
    if (!searchResults || !searchResults.results) {
      return handleApiError(res, "Failed to retrieve search results", 500);
    }
    
    let formattedResults = searchResults.results.map(item => ({
      id: item.id,
      title: type === 'movie' ? item.title : item.name,
      media_type: type,
      overview: item.overview,
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
      release_date: type === 'movie' ? item.release_date : item.first_air_date,
      vote_average: item.vote_average
    }));
    
    // Apply limit if specified
    if (limit && !isNaN(parseInt(limit))) {
      formattedResults = formattedResults.slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      results: formattedResults,
      page: searchResults.page,
      total_pages: searchResults.total_pages,
      total_results: searchResults.total_results
    });
  } catch (error) {
    handleApiError(res, "Failed to process search request", 500);
  }
});

// API endpoint for trending content
app.get('/api/trending', async (req, res) => {
  try {
    const { mediaType = 'all', timeWindow = 'day', page = 1 } = req.query;
    
    if (!['all', 'movie', 'tv', 'person'].includes(mediaType)) {
      return handleApiError(res, "Invalid media type. Must be 'all', 'movie', 'tv', or 'person'", 400);
    }
    
    if (!['day', 'week'].includes(timeWindow)) {
      return handleApiError(res, "Invalid time window. Must be 'day' or 'week'", 400);
    }
    
    const trendingData = await fetchTrending(mediaType, timeWindow, page);
    
    if (!trendingData || !trendingData.results) {
      return handleApiError(res, "Failed to retrieve trending content", 500);
    }
    
    const formattedResults = trendingData.results.map(item => {
      const isMovie = item.media_type === 'movie' || mediaType === 'movie';
      return {
        id: item.id,
        title: isMovie ? item.title : item.name,
        media_type: item.media_type || mediaType,
        overview: item.overview,
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
        release_date: isMovie ? item.release_date : item.first_air_date,
        vote_average: item.vote_average
      };
    });
    
    res.json({
      success: true,
      results: formattedResults,
      page: trendingData.page,
      total_pages: trendingData.total_pages,
      total_results: trendingData.total_results
    });
  } catch (error) {
    handleApiError(res, "Failed to retrieve trending content", 500);
  }
});

// Watchlist Routes
app.get('/watchlist', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const { watchlist, pagination } = watchlistStorage.getItems(page);
    
    // For empty watchlist, just render the template
    if (watchlist.length === 0) {
      return res.render('watchlist', { items: [], pagination: null });
    }
    
    // Format pagination to match what's expected in the template
    const paginationData = {
      totalPages: pagination.total_pages,
      currentPage: pagination.current_page,
      total: pagination.total
    };
    
    // Render the watchlist page
    res.render('watchlist', { 
      items: watchlist, 
      pagination: paginationData 
    });
  } catch (error) {
    console.error(`Watchlist error: ${error.message}`);
    res.render('error', { 
      msg: "An error occurred while retrieving your watchlist.",
      code: 500 
    });
  }
});

// API endpoints for watchlist management
app.post('/api/watchlist/add', async (req, res) => {
  try {
    const { id, type, title, poster } = req.body;
    
    if (!id || !type || !title) {
      return handleApiError(res, "Missing required fields", 400);
    }
    
    const added = watchlistStorage.addItem({ 
      id, 
      type, 
      title, 
      poster: poster || null 
    });
    
    if (!added) {
      return handleApiError(res, "Item already exists in watchlist", 409);
    }
    
    res.json({ success: true, message: "Item added to watchlist" });
  } catch (error) {
    handleApiError(res, "Failed to add item to watchlist", 500);
  }
});

app.post('/api/watchlist/remove', async (req, res) => {
  try {
    const { id, type } = req.body;
    
    if (!id) {
      return handleApiError(res, "Missing item ID", 400);
    }
    
    if (!type) {
      return handleApiError(res, "Missing item type", 400);
    }
    
    const removed = watchlistStorage.removeItem(id, type);
    
    if (!removed) {
      return handleApiError(res, "Item not found in watchlist", 404);
    }
    
    res.json({ success: true, message: "Item removed from watchlist" });
  } catch (error) {
    handleApiError(res, "Failed to remove item from watchlist", 500);
  }
});

app.get('/api/watchlist/check', async (req, res) => {
  try {
    const { id, type } = req.query;
    
    if (!id || !type) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const inWatchlist = watchlistStorage.items.some(item => 
      item.id === id && item.type === type
    );
    
    res.json({ inWatchlist });
  } catch (error) {
    console.error(`Check watchlist error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to check watchlist' });
  }
});

// Contact page route
app.get('/contact', (req, res) => {
  res.render('contact');
});

// Process contact form submission
app.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Basic validation
    if (!name || !email || !subject || !message) {
      return res.render('contact', { 
        error: 'All fields are required',
        formData: req.body // Send the form data back to pre-fill the form
      });
    }
    
    // Validate email format
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.render('contact', { 
        error: 'Please provide a valid email address',
        formData: req.body
      });
    }
    
    // Render the email template
    const html = await renderEmailTemplate('contact_confirmation', {
      name,
      email,
      subject,
      message
    });
    
    // Send confirmation email to the user
    try {
      await sendEmail({
        to: email,
        subject: 'Thank you for contacting StreamAPI',
        html
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Continue processing even if the confirmation email fails
    }
    
    // Email content for admin notification
    const adminMailOptions = {
      to: process.env.EMAIL_USER,
      subject: `Contact Form: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };
    
    // Send notification to admin
    try {
      await sendEmail(adminMailOptions);
    } catch (adminEmailError) {
      console.error('Error sending admin notification:', adminEmailError);
      // Continue processing even if the admin notification fails
    }
    
    // Render contact page with success message
    res.render('contact', { 
      success: true,
      message: 'Thank you for your message! We will get back to you as soon as possible.'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.render('contact', { 
      error: 'There was an error processing your request. Please try again later.',
      formData: req.body
    });
  }
});

// API route for newsletter subscription
app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return handleApiError(res, "Email is required", 400);
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return handleApiError(res, "Please provide a valid email address", 400);
    }
    
    const added = newsletterStorage.addSubscriber(email);
    
    if (!added) {
      return handleApiError(res, "Email already subscribed", 409);
    }
    
    try {
      // Fetch trending movies for the newsletter
      const trendingData = await fetchTrending('movie', 'week', 1);
      let trendingMovies = [];
      
      if (trendingData && trendingData.results) {
        trendingMovies = trendingData.results.slice(0, 3).map(movie => ({
          id: movie.id,
          title: movie.title,
          poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
        }));
      }
      
      // Render email template with subscriber email and trending movies
      const html = await renderEmailTemplate('newsletter_subscription', {
        email,
        trendingMovies
      });
      
      // Send confirmation email
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Welcome to StreamAPI Newsletter!',
        html
      };
      
      await sendEmail(mailOptions);
      res.json({ success: true, message: "Subscription successful! Check your email for confirmation." });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      // Still return success as the subscription was added
      res.json({ success: true, message: "Subscription successful, but confirmation email could not be sent." });
    }
  } catch (error) {
    handleApiError(res, "Failed to process subscription", 500);
  }
});

// Update contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return handleApiError(res, "All fields are required", 400);
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return handleApiError(res, "Please provide a valid email address", 400);
    }
    
    // Render email template
    const html = await renderEmailTemplate('contact_form', {
      name,
      email,
      message,
      date: new Date().toLocaleString()
    });
    
    // Send email
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_FROM,
      subject: `Contact Form: Message from ${name}`,
      html
    };
    
    await sendEmail(mailOptions);
    res.json({ success: true, message: "Your message has been sent successfully!" });
  } catch (error) {
    handleApiError(res, "Failed to send message", 500);
  }
});

// Legal pages routes
app.get('/terms', (req, res) => {
  res.render('terms');
});

app.get('/privacy', (req, res) => {
  res.render('privacy');
});

app.get('/copyright', (req, res) => {
  res.render('copyright');
});

// Custom 404 handler
app.use((req, res) => {
  res.status(404).render('error', { msg: 'Page Not Found', code: 404 });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});