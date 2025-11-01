const express = require('express');
const router = express.Router();
const axios = require('axios');

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
  },
  
  async post(url, data, config = {}) {
    if (typeof url === 'string' && url.toLowerCase().startsWith('data:')) {
      throw new Error('Data URIs are not allowed for security reasons');
    }
    
    const secureConfig = {
      ...config,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024,
      timeout: 30000,
    };
    
    return axios.post(url, data, secureConfig);
  }
};
const WebTorrent = require('webtorrent');
const path = require('path');
const fs = require('fs');
const pump = require('pump');

// Initialize WebTorrent client
const client = new WebTorrent();

// Create downloads directory if it doesn't exist
const downloadsPath = path.join(__dirname, '../downloads');
if (!fs.existsSync(downloadsPath)) {
    fs.mkdirSync(downloadsPath, { recursive: true });
}

// YTS API base URL
const YTS_API_BASE = 'https://yts.mx/api/v2';

// Default trackers for better download speeds
const DEFAULT_TRACKERS = [
    'udp://open.demonii.com:1337/announce',
    'udp://tracker.openbittorrent.com:80',
    'udp://tracker.coppersurfer.tk:6969',
    'udp://glotorrents.pw:6969/announce',
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://torrent.gresille.org:80/announce',
    'udp://p4p.arenabg.com:1337',
    'udp://tracker.leechers-paradise.org:6969'
];

// Track active torrents
const activeTorrents = new Map();

// Helper function to construct magnet URI
function constructMagnetURI(hash, name, trackers = DEFAULT_TRACKERS) {
    const encodedName = encodeURIComponent(name);
    const trackerString = trackers.map(tracker => `&tr=${encodeURIComponent(tracker)}`).join('');
    return `magnet:?xt=urn:btih:${hash}&dn=${encodedName}${trackerString}`;
}

// Search page
router.get('/search', (req, res) => {
    res.render('torrent-search');
});

// Search results
router.get('/results', async (req, res) => {
    try {
        const { q, quality, genre, rating, sort, page = 1 } = req.query;
        
        // Construct API URL with query parameters
        const params = new URLSearchParams({
            limit: 20,
            page,
            ...(q && { query_term: q }),
            ...(quality && { quality }),
            ...(genre && { genre }),
            ...(rating && { minimum_rating: rating }),
            ...(sort && { sort_by: sort })
        });
        
        const response = await secureAxios.get(`${YTS_API_BASE}/list_movies.json?${params}`);
        const { data } = response.data;
        
        // Add magnet URIs to movies
        const movies = data.movies?.map(movie => ({
            ...movie,
            torrents: movie.torrents?.map(torrent => ({
                ...torrent,
                magnet: constructMagnetURI(torrent.hash, `${movie.title} ${movie.year} ${torrent.quality}`)
            }))
        })) || [];
        
        res.render('torrent-results', {
            movies,
            totalResults: data.movie_count || 0,
            currentPage: parseInt(page),
            totalPages: Math.ceil((data.movie_count || 0) / 20),
            query: q || '',
            quality: quality || '',
            genre: genre || '',
            rating: rating || '',
            sort: sort || 'date_added'
        });
    } catch (error) {
        console.error('Error fetching search results:', error);
        res.render('torrent-results', {
            movies: [],
            totalResults: 0,
            currentPage: 1,
            totalPages: 0,
            query: req.query.q || '',
            quality: req.query.quality || '',
            genre: req.query.genre || '',
            rating: req.query.rating || '',
            sort: req.query.sort || 'date_added',
            error: 'Failed to fetch search results. Please try again.'
        });
    }
});

// Movie details
router.get('/movie/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await secureAxios.get(`${YTS_API_BASE}/movie_details.json`, {
            params: {
                movie_id: id,
                with_images: true,
                with_cast: true
            }
        });
        
        const { movie } = response.data.data;
        
        if (!movie) {
            throw new Error('Movie not found');
        }
        
        // Add magnet URIs to torrents
        movie.torrents = movie.torrents?.map(torrent => ({
            ...torrent,
            magnet: constructMagnetURI(torrent.hash, `${movie.title} ${movie.year} ${torrent.quality}`)
        }));
        
        res.render('torrent-movie', { movie });
    } catch (error) {
        console.error('Error fetching movie details:', error);
        res.render('torrent-movie', { 
            movie: null,
            error: 'Failed to fetch movie details. Please try again.'
        });
    }
});

// POST route for initiating torrent download
router.post('/download', async (req, res) => {
    try {
        const { magnetURI } = req.body;
        if (!magnetURI) {
            return res.status(400).json({ error: 'Magnet URI is required' });
        }

        // Check if torrent is already being downloaded
        if (activeTorrents.has(magnetURI)) {
            const torrent = activeTorrents.get(magnetURI);
            return res.json({
                infoHash: torrent.infoHash,
                files: torrent.files.map(file => ({
                    name: file.name,
                    length: file.length,
                    path: file.path
                }))
            });
        }

        // Add new torrent
        client.add(magnetURI, torrent => {
            // Store in active torrents
            activeTorrents.set(magnetURI, torrent);

            // Send initial response
            res.json({
                infoHash: torrent.infoHash,
                files: torrent.files.map(file => ({
                    name: file.name,
                    length: file.length,
                    path: file.path
                }))
            });

            // Cleanup function
            const cleanup = () => {
                if (activeTorrents.has(magnetURI)) {
                    const t = activeTorrents.get(magnetURI);
                    t.destroy();
                    activeTorrents.delete(magnetURI);
                }
            };

            // Handle completion
            torrent.on('done', cleanup);

            // Handle errors
            torrent.on('error', err => {
                console.error('Torrent error:', err);
                cleanup();
            });

            // Set timeout for cleanup (30 minutes)
            setTimeout(cleanup, 30 * 60 * 1000);
        });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to process torrent' });
    }
});

// GET route for downloading specific files
router.get('/file/:infoHash/:filename', (req, res) => {
    try {
        const { infoHash, filename } = req.params;
        
        // Find torrent by infoHash
        const torrent = client.torrents.find(t => t.infoHash === infoHash);
        if (!torrent) {
            return res.status(404).json({ error: 'Torrent not found' });
        }

        // Find requested file
        const file = torrent.files.find(f => f.name === filename);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Set headers
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);

        // Stream file
        pump(file.createReadStream(), res, err => {
            if (err) {
                console.error('Streaming error:', err);
            }
        });

    } catch (error) {
        console.error('File download error:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// Downloader page
router.get('/downloader', (req, res) => {
    const { magnet } = req.query;
    // Set default magnet value if not provided
    const magnetURI = magnet || '';
    // Render the downloader page with the magnet URI
    res.render('torrent-downloader', { 
        title: 'Torrent Downloader',
        magnet: magnetURI,
        layout: 'layout' // Ensure layout is used
    });
});

// Cleanup function for destroying torrents
function cleanup() {
    client.torrents.forEach(torrent => {
        if (!torrent.destroyed) {
            torrent.destroy();
        }
    });
}

// Clean up torrents on process exit
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

module.exports = router; 