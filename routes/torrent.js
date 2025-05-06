const express = require('express');
const router = express.Router();
const axios = require('axios');
const WebTorrent = require('webtorrent');
const path = require('path');
const fs = require('fs');

// Initialize WebTorrent client with default configurations
const client = new WebTorrent({
    maxConns: 55,        // Max number of connections per torrent
    nodeId: String(Math.random()).slice(2),
    tracker: {
        announce: [
            'wss://tracker.openwebtorrent.com',
            'wss://tracker.btorrent.xyz'
        ]
    }
});

// Create downloads directory if it doesn't exist
const downloadsPath = path.join(__dirname, '../downloads');
if (!fs.existsSync(downloadsPath)) {
    fs.mkdirSync(downloadsPath, { recursive: true });
}

// YTS API base URL
const YTS_API_BASE = 'https://yts.mx/api/v2';

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
        
        const response = await axios.get(`${YTS_API_BASE}/list_movies.json?${params}`);
        const { data } = response.data;
        
        res.render('torrent-results', {
            movies: data.movies || [],
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
        const response = await axios.get(`${YTS_API_BASE}/movie_details.json`, {
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
        
        res.render('torrent-movie', { movie });
    } catch (error) {
        console.error('Error fetching movie details:', error);
        res.render('torrent-movie', { 
            movie: null,
            error: 'Failed to fetch movie details. Please try again.'
        });
    }
});

// Update download route
router.post('/download', (req, res) => {
    const { magnetURI } = req.body;
    
    if (!magnetURI) {
        return res.status(400).json({ error: 'Magnet URI is required' });
    }

    // Check if torrent is already being downloaded
    const existingTorrent = client.get(magnetURI);
    if (existingTorrent) {
        return res.json({
            infoHash: existingTorrent.infoHash,
            name: existingTorrent.name,
            files: existingTorrent.files.map(file => ({
                name: file.name,
                length: file.length,
                path: file.path
            }))
        });
    }

    try {
        const torrent = client.add(magnetURI, { 
            path: downloadsPath,
            announce: [
                'wss://tracker.openwebtorrent.com',
                'wss://tracker.btorrent.xyz'
            ]
        });

        // Set up event handlers before sending response
        torrent.on('error', (err) => {
            console.error('Torrent error:', err);
        });

        torrent.on('warning', (err) => {
            console.warn('Torrent warning:', err);
        });

        torrent.on('ready', () => {
            console.log('Torrent ready:', torrent.infoHash);
        });

        torrent.on('download', (bytes) => {
            console.log('Progress:', Math.round(torrent.progress * 100) + '%');
            console.log('Download speed:', Math.round(torrent.downloadSpeed / 1024 / 1024 * 100) / 100 + ' MB/s');
        });

        torrent.on('done', () => {
            console.log('Torrent download finished');
            torrent.files.forEach(file => {
                const filePath = path.join(downloadsPath, file.path);
                console.log('File downloaded:', filePath);
            });
        });

        // Send initial response
        res.json({
            infoHash: torrent.infoHash || '',
            name: torrent.name || 'Initializing...',
            files: []
        });

        // Clean up after 1 hour or when download is complete
        const cleanup = () => {
            if (client.get(torrent.infoHash)) {
                torrent.destroy({ destroyStore: false });
            }
        };

        setTimeout(cleanup, 3600000); // 1 hour
        torrent.on('done', cleanup);

    } catch (error) {
        console.error('Error adding torrent:', error);
        res.status(500).json({ error: 'Failed to start download' });
    }
});

module.exports = router; 