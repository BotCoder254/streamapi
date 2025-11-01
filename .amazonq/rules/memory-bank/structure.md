# StreamAPI - Project Structure

## Directory Organization

### Root Level
- **server.js**: Main application entry point with Express server setup
- **package.json**: Dependencies and project configuration
- **Dockerfile**: Container configuration for deployment
- **docker-compose.yml**: Multi-container orchestration
- **vercel.json**: Vercel deployment configuration

### Core Application Structure

#### `/config/`
- **auth.js**: Authentication middleware and route protection
- **passport.js**: Passport.js configuration for local authentication strategy

#### `/models/`
- **User.js**: MongoDB user schema with bcrypt password hashing
- **WatchHistory.js**: User viewing history tracking model
- **Achievement.js**: User achievement and badge system model

#### `/routes/`
- **auth.js**: Authentication routes (login, register, password reset)
- **torrent.js**: Torrent-related functionality and search
- **watchlist.js**: User watchlist management endpoints

#### `/middleware/`
- **auth.js**: Custom authentication middleware functions

#### `/views/`
EJS template structure:
- **layout.ejs**: Main application layout template
- **partials/**: Reusable template components (nav, messages, modals)
- **emails/**: Email templates for notifications
- Content pages: movie.ejs, tv.ejs, player.ejs, search.ejs
- User pages: login.ejs, register.ejs, profile.ejs, watchlist.ejs
- Legal pages: terms.ejs, privacy.ejs, copyright.ejs

#### `/public/`
Static assets organization:
- **js/**: Client-side JavaScript modules
  - player.js: Video player controls and functionality
  - watchlist.js: Watchlist management
  - movie.js: Movie-specific interactions
  - stats.js: User statistics and analytics
- **images/**: Static images and user uploads
- **uploads/profiles/**: User profile picture storage

## Architectural Patterns

### MVC Architecture
- **Models**: MongoDB schemas for data persistence
- **Views**: EJS templates for server-side rendering
- **Controllers**: Route handlers in server.js and route files

### Middleware Stack
1. **Security**: CORS, CSP headers, ad-blocker middleware
2. **Session**: Express-session with MongoDB store
3. **Authentication**: Passport.js with local strategy
4. **Static**: Express static file serving
5. **Parsing**: JSON and URL-encoded body parsing

### Database Design
- **MongoDB**: Primary database with Mongoose ODM
- **Session Store**: MongoDB-based session persistence
- **User Data**: Encrypted passwords, profile information
- **Content Tracking**: Watch history, achievements, watchlists

### API Integration
- **TMDB API**: Primary content data source
- **OMDB API**: Additional movie metadata
- **VidSrc**: Streaming source integration
- **Email Service**: Nodemailer with SMTP

## Core Components

### Authentication System
- Local strategy with email/password
- Session-based authentication
- Password reset functionality
- User profile management

### Content Management
- TMDB API integration for movies/TV shows
- Search functionality across multiple content types
- Trending and popular content aggregation
- Similar content recommendations

### Streaming Infrastructure
- VidSrc embed integration
- Multiple streaming source support
- Episode tracking for TV shows
- Continue watching functionality

### Real-time Features
- WebSocket server for live updates
- Watch party synchronization
- Active user count tracking
- Real-time chat functionality

### Email System
- Template-based email rendering
- Newsletter subscription management
- Contact form processing
- Password reset notifications

## Deployment Architecture

### Multi-Platform Support
- **Vercel**: Serverless deployment with vercel.json
- **Render**: Container deployment with render.yaml
- **Docker**: Containerized deployment with Dockerfile
- **Local**: Development server with nodemon

### Environment Configuration
- Environment-specific settings via .env
- Database connection strings
- API keys and secrets
- Email service configuration

### Static Asset Handling
- Express static middleware
- Public directory structure
- User upload management
- Image optimization and serving