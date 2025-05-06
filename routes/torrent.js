const express = require('express');
const router = express.Router();
const axios = require('axios');

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

module.exports = router; 