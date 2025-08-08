# Technology Stack & Build System

## Backend Framework
- **Node.js** (>=14.0.0) - Runtime environment
- **Express.js** - Web application framework
- **EJS** - Server-side templating engine with layouts support

## Database & Authentication
- **MongoDB** with Mongoose ODM - Primary database
- **Passport.js** with Local Strategy - Authentication middleware
- **bcryptjs** - Password hashing
- **express-session** with MongoStore - Session management
- **connect-flash** - Flash messaging

## Real-time Features
- **WebSocket (ws)** - Real-time communication for user count and watch parties
- **WebTorrent** - P2P torrent streaming capabilities

## External APIs & Services
- **TMDB API** - Movie and TV show data (API key: `TMDB_API_KEY`)
- **VidSrc** - Video streaming source integration
- **Nodemailer** - Email service for newsletters and notifications

## Frontend & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Font Awesome** - Icon library
- **Responsive design** - Mobile-first approach

## File Handling & Middleware
- **Multer** - File upload handling (profile images)
- **CORS** - Cross-origin resource sharing
- **express-useragent** - User agent detection
- **network-speed** - Network speed testing

## Development & Deployment

### Common Commands
```bash
# Development
npm run dev          # Start with nodemon for auto-reload
npm start           # Production start

# Dependencies
npm install         # Install all dependencies
npm ci              # Clean install for production
```

### Environment Variables Required
```
PORT=3000
TMDB_API_KEY=your_tmdb_api_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=StreamAPI <your_email@gmail.com>
SITE_URL=http://localhost:3000
SESSION_SECRET=your_session_secret
```

### Deployment Options
- **Vercel** - Serverless deployment with vercel.json config
- **Render** - Container-based deployment with render.yaml
- **Docker** - Containerized deployment with Dockerfile and docker-compose.yml
- **Heroku** - Platform-as-a-service with Procfile

### Build Process
- No build step required - Node.js application runs directly
- Static assets served from `/public` directory
- EJS templates compiled at runtime