// server.js
const express = require('express');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const expressLayouts = require('express-ejs-layouts');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const TMDB_API_KEY = 'fdbc5d0ea9e499aaeba73d29c21726be';
const VIDSRC_EMBED_BASE = 'https://vidsrc.xyz/embed';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

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
    // Fetch the latest movies from VidSrc API
    const response = await axios.get(`https://vidsrc.xyz/movies/latest/page-${page}.json`);
    return response.data;
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
      return res.render('error', { 
        msg: "Sorry, could not retrieve movie data. Please try again later.",
        code: 500 
      });
    }

    const movies = data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
    }));
    
    res.render('index', { movies, page });
  } catch (error) {
    res.render('error', { 
      msg: "An error occurred while retrieving movies.",
      code: 500 
    });
  }
});

app.get('/latest', async (req, res) => {
  try {
    const page = req.query.p || 1;
    const data = await fetchLatestMovies(page);
    
    if (!data.movies || !Array.isArray(data.movies)) {
      return res.render('error', { 
        msg: "Sorry, could not retrieve latest movies. Please try again later.",
        code: 500 
      });
    }

    // You may need to modify this based on the actual response structure
    const movies = data.movies.map(movie => ({
      id: movie.tmdb_id || movie.id,
      title: movie.title,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
    }));
    
    res.render('latest', { movies, page });
  } catch (error) {
    res.render('error', { 
      msg: "An error occurred while retrieving latest movies.",
      code: 500 
    });
  }
});

app.get('/top', async (req, res) => {
  try {
    const page = req.query.p || 1;
    const data = await fetchFromTMDB('/movie/top_rated', { page });
    
    if (!data.results) {
      return res.render('error', { 
        msg: "Sorry, could not retrieve movie data. Please try again later.",
        code: 500 
      });
    }

    const movies = data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
    }));
    
    res.render('top', { movies, page });
  } catch (error) {
    res.render('error', { 
      msg: "An error occurred while retrieving top rated movies.",
      code: 500 
    });
  }
});

app.get('/search', (req, res) => {
  res.render('search');
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
      return res.render('error', { 
        msg: "Sorry, could not retrieve search results. Please try again later.",
        code: 500 
      });
    }
    
    if (data.results.length === 0) {
      return res.render('error', { 
        msg: "Sorry, No Movies Found!",
        code: 404 
      });
    }
    
    const movies = data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
    }));
    
    res.render('results', { movies, query, page });
  } catch (error) {
    res.render('error', { 
      msg: "An error occurred during search.",
      code: 500 
    });
  }
});

app.get('/view/movie/:id', async (req, res) => {
  try {
    const tmdbId = req.params.id;
    
    // Get movie details
    const movieData = await fetchFromTMDB(`/movie/${tmdbId}`);
    
    // Get external IDs (IMDB ID)
    const externalIds = await fetchFromTMDB(`/movie/${tmdbId}/external_ids`);
    const imdbId = externalIds.imdb_id;
    
    // Get similar movies
    const similarData = await fetchFromTMDB(`/movie/${tmdbId}/similar`);
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
      similarMovies: similarMovies
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
    const subUrl = req.query.sub_url;
    const dsLang = req.query.ds_lang;
    
    if (!tmdbId && !imdbId) {
      return res.status(400).send("Either TMDB ID or IMDB ID is required!");
    }
    
    let embedUrl;
    
    if (imdbId) {
      embedUrl = `${VIDSRC_EMBED_BASE}/movie/${imdbId}`;
    } else {
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
    
    res.render('player', { embedUrl });
  } catch (error) {
    res.status(500).send("An error occurred while loading the player.");
  }
});

// Routes for TV Shows
app.get('/browse/tv', async (req, res) => {
  try {
    const page = req.query.p || 1;
    const data = await fetchFromTMDB('/tv/popular', { page });
    
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
    
    res.render('tv_browse', { shows, page });
  } catch (error) {
    res.render('error', { 
      msg: "An error occurred while retrieving TV shows.",
      code: 500 
    });
  }
});

app.get('/latest/tv', async (req, res) => {
  try {
    const page = req.query.p || 1;
    const data = await fetchLatestTVShows(page);
    
    if (!data.results || !Array.isArray(data.results)) {
      return res.render('error', { 
        msg: "Sorry, could not retrieve latest TV shows. Please try again later.",
        code: 500 
      });
    }

    // You may need to modify this based on the actual response structure
    const shows = data.results.map(show => ({
      id: show.tmdb_id || show.id,
      title: show.name,
      poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null
    }));
    
    res.render('latest_tv', { shows, page });
  } catch (error) {
    res.render('error', { 
      msg: "An error occurred while retrieving latest TV shows.",
      code: 500 
    });
  }
});

app.get('/latest/episodes', async (req, res) => {
  try {
    const page = req.query.p || 1;
    const data = await fetchLatestEpisodes(page);
    
    if (!data.episodes || !Array.isArray(data.episodes)) {
      return res.render('error', { 
        msg: "Sorry, could not retrieve latest episodes. Please try again later.",
        code: 500 
      });
    }

    // You may need to modify this based on the actual response structure
    const episodes = data.episodes;
    
    res.render('latest_episodes', { episodes, page });
  } catch (error) {
    res.render('error', { 
      msg: "An error occurred while retrieving latest episodes.",
      code: 500 
    });
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
      return res.render('error', { 
        msg: "Sorry, could not retrieve search results. Please try again later.",
        code: 500 
      });
    }
    
    if (data.results.length === 0) {
      return res.render('error', { 
        msg: "Sorry, No TV Shows Found!",
        code: 404 
      });
    }
    
    const shows = data.results.map(show => ({
      id: show.id,
      title: show.name,
      poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null
    }));
    
    res.render('results_tv', { shows, query, page });
  } catch (error) {
    res.render('error', { 
      msg: "An error occurred during search.",
      code: 500 
    });
  }
});

app.get('/view/tv/:id', async (req, res) => {
  try {
    const tmdbId = req.params.id;
    
    // Get TV show details
    const tvData = await fetchFromTMDB(`/tv/${tmdbId}`);
    
    // Get external IDs (IMDB ID)
    const externalIds = await fetchFromTMDB(`/tv/${tmdbId}/external_ids`);
    const imdbId = externalIds.imdb_id;
    
    // Get similar TV shows
    const similarData = await fetchFromTMDB(`/tv/${tmdbId}/similar`);
    const similarShows = similarData.results.slice(0, 12).map(s => ({
      id: s.id,
      title: s.name,
      poster: s.poster_path ? `https://image.tmdb.org/t/p/w300${s.poster_path}` : null
    }));
    
    // Generate embed URL
    const embedUrl = `${VIDSRC_EMBED_BASE}/tv/${tmdbId}`;
    
    const show = {
      tmdbId,
      imdbId,
      title: tvData.name,
      overview: tvData.overview,
      runtime: tvData.episode_run_time && tvData.episode_run_time.length > 0 ? `${tvData.episode_run_time[0]} min.` : 'N/A',
      rating: `${tvData.vote_average}/10`,
      poster: tvData.poster_path ? `https://image.tmdb.org/t/p/w500${tvData.poster_path}` : null,
      background: tvData.backdrop_path ? `https://image.tmdb.org/t/p/original${tvData.backdrop_path}` : null,
      year: tvData.first_air_date ? `(${tvData.first_air_date.split('-')[0]})` : '',
      seasons: tvData.seasons || [],
      embedUrl: embedUrl,
      similarShows: similarShows
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

// API endpoint for real-time search (used by the navbar search)
app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q;
    const limit = parseInt(req.query.limit) || 5;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }
    
    // Search for both movies and TV shows in parallel
    const [movieData, tvData] = await Promise.all([
      fetchFromTMDB('/search/movie', { query, page: 1 }),
      fetchFromTMDB('/search/tv', { query, page: 1 })
    ]);
    
    let combinedResults = [];
    
    // Process movie results
    if (movieData.results && movieData.results.length > 0) {
      const movieResults = movieData.results.map(movie => ({
        ...movie,
        media_type: 'movie'
      }));
      combinedResults = combinedResults.concat(movieResults);
    }
    
    // Process TV show results
    if (tvData.results && tvData.results.length > 0) {
      const tvResults = tvData.results.map(show => ({
        ...show,
        media_type: 'tv'
      }));
      combinedResults = combinedResults.concat(tvResults);
    }
    
    // Sort by popularity (descending)
    combinedResults.sort((a, b) => b.popularity - a.popularity);
    
    // Limit the number of results
    combinedResults = combinedResults.slice(0, limit);
    
    res.json({ results: combinedResults });
  } catch (error) {
    console.error(`API search error: ${error.message}`);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Custom 404 handler
app.use((req, res) => {
  res.status(404).render('error', { msg: 'Page Not Found', code: 404 });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});