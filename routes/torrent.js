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
            'udp://open.demonii.com:1337/announce',
            'udp://tracker.openbittorrent.com:80',
            'udp://tracker.coppersurfer.tk:6969',
            'udp://glotorrents.pw:6969/announce',
            'udp://tracker.opentrackr.org:1337/announce',
            'udp://torrent.gresille.org:80/announce',
            'udp://p4p.arenabg.com:1337',
            'udp://tracker.leechers-paradise.org:6969'
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

// Default trackers for magnet links
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
        
        const response = await axios.get(`${YTS_API_BASE}/list_movies.json?${params}`);
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

// Download route
router.post('/download', async (req, res) => {
    const { magnetURI } = req.body;
    
    if (!magnetURI) {
        return res.status(400).json({ error: 'Magnet URI is required' });
    }

    try {
        // Check if torrent is already being downloaded
        const existingTorrent = client.get(magnetURI);
        if (existingTorrent) {
            return res.json({
                infoHash: existingTorrent.infoHash,
                files: existingTorrent.files.map(file => ({
                    name: file.name,
                    path: file.path,
                    length: file.length
                }))
            });
        }

        // Add new torrent
        client.add(magnetURI, { announce: DEFAULT_TRACKERS }, torrent => {
            // Send torrent info back to client
            res.json({
                infoHash: torrent.infoHash,
                files: torrent.files.map(file => ({
                    name: file.name,
                    path: file.path,
                    length: file.length
                }))
            });

            // Set up cleanup after 1 hour or when download completes
            const cleanup = () => {
                if (torrent.destroyed) return;
                torrent.destroy();
            };

            setTimeout(cleanup, 60 * 60 * 1000); // 1 hour timeout
            torrent.on('done', cleanup);
        });

    } catch (error) {
        console.error('Download error:', error);
        // Only send error response if headers haven't been sent
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to start download' });
        }
    }
});

// File download route
router.get('/download/:infoHash/:filename', (req, res) => {
    const { infoHash, filename } = req.params;
    const torrent = client.get(infoHash);
    
    if (!torrent) {
        return res.status(404).json({ error: 'Torrent not found' });
    }

    const file = torrent.files.find(f => f.path === decodeURIComponent(filename));
    if (!file) {
        return res.status(404).json({ error: 'File not found' });
    }

    // Set content headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    res.setHeader('Content-Length', file.length);

    // Stream file to response
    const stream = file.createReadStream();
    stream.pipe(res);

    // Handle errors
    stream.on('error', error => {
        console.error('Stream error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed' });
        }
    });
});

module.exports = router; 