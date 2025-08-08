# Project Structure & Organization

## Root Directory Structure

```
streamapi/
├── server.js              # Main application entry point
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (not in repo)
├── README.md              # Project documentation
└── app.json              # Application metadata
```

## Core Application Directories

### `/config/`
Configuration modules for application setup:
- `auth.js` - Authentication middleware helpers
- `passport.js` - Passport.js strategy configuration

### `/models/`
Mongoose data models:
- `User.js` - User schema with authentication, watchlist, profile
- `WatchHistory.js` - User viewing history and progress tracking
- `Achievement.js` - User achievement system

### `/routes/`
Express route handlers organized by feature:
- `auth.js` - Authentication routes (login, register, profile)
- `watchlist.js` - Watchlist management endpoints
- `torrent.js` - Torrent search and download functionality

### `/middleware/`
Custom Express middleware:
- `auth.js` - Authentication verification middleware

### `/views/`
EJS templates organized by functionality:
- `layout.ejs` - Main application layout
- `home.ejs` - Homepage with featured content sliders
- `search.ejs`, `results.ejs` - Search functionality
- `movie.ejs`, `tv.ejs` - Content detail pages
- `login.ejs`, `register.ejs` - Authentication pages
- `profile.ejs`, `watchlist.ejs` - User account pages
- `/partials/` - Reusable template components
- `/emails/` - Email templates for notifications

### `/public/`
Static assets served directly:
- `/js/` - Client-side JavaScript
- `/images/` - Static images and assets
- `/uploads/` - User-uploaded content (profile images)

## Deployment Configuration Files

- `Dockerfile` - Container configuration
- `docker-compose.yml` - Multi-container setup
- `vercel.json` - Vercel deployment config
- `render.yaml` - Render deployment config
- `Procfile` - Heroku deployment config

## Code Organization Patterns

### Route Structure
- Routes are modularized by feature area
- Authentication middleware applied at route level
- Consistent error handling with `handleError()` helper

### Model Patterns
- Mongoose schemas with validation
- Pre-save hooks for password hashing
- Instance methods for common operations
- Compound indexes for performance

### Template Organization
- Shared layout with block content
- Partials for reusable components
- Data passed via `res.locals` for global access
- Flash messaging for user feedback

### API Integration
- Centralized TMDB API helper functions
- Consistent error handling for external APIs
- Response caching and data transformation
- Fallback handling for API failures

## File Naming Conventions

- **Routes**: Lowercase, feature-based (`auth.js`, `watchlist.js`)
- **Models**: PascalCase (`User.js`, `WatchHistory.js`)
- **Views**: Lowercase with hyphens (`forgot-password.ejs`)
- **Config**: Lowercase, purpose-based (`passport.js`, `auth.js`)

## Key Architecture Decisions

- **MVC Pattern**: Models, Views, Controllers separation
- **Session-based Auth**: Server-side sessions with MongoDB storage
- **Template Rendering**: Server-side EJS with client-side enhancements
- **API-first Design**: External API integration with local data caching
- **Real-time Features**: WebSocket integration for live features