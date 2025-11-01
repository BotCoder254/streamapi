# StreamAPI - Technology Stack

## Programming Languages
- **JavaScript (Node.js)**: Primary backend language (ES6+)
- **EJS**: Server-side templating engine
- **HTML5**: Frontend markup
- **CSS3**: Styling with Tailwind CSS framework

## Backend Framework & Runtime
- **Node.js**: Runtime environment (>=14.0.0)
- **Express.js**: Web application framework (^4.18.1)
- **Express-EJS-Layouts**: Layout support for EJS templates

## Database & ODM
- **MongoDB**: Primary database with Atlas cloud hosting
- **Mongoose**: Object Document Mapper (^8.14.1)
- **Connect-Mongo**: MongoDB session store (^5.1.0)

## Authentication & Security
- **Passport.js**: Authentication middleware (^0.7.0)
- **Passport-Local**: Local authentication strategy (^1.0.0)
- **bcryptjs**: Password hashing (^3.0.2)
- **Express-Session**: Session management (^1.18.1)
- **Connect-Flash**: Flash message middleware (^0.1.1)

## External APIs & Services
- **TMDB API**: Movie and TV show data source
- **OMDB API**: Additional movie metadata
- **VidSrc**: Video streaming service integration
- **Axios**: HTTP client for API requests (^0.27.2)

## Real-time Communication
- **WebSocket (ws)**: Real-time bidirectional communication (^8.18.1)
- **WebTorrent**: P2P streaming capabilities (^1.9.7)

## Email & Communication
- **Nodemailer**: Email sending service (^6.9.7)
- **EJS**: Email template rendering

## File Handling & Uploads
- **Multer**: File upload middleware (^1.4.5-lts.2)
- **File System (fs)**: Native Node.js file operations
- **Path**: Native Node.js path utilities

## Utility Libraries
- **CORS**: Cross-Origin Resource Sharing (^2.8.5)
- **Crypto**: Cryptographic functionality (^1.0.1)
- **Express-Useragent**: User agent parsing (^1.0.15)
- **Network-Speed**: Network speed testing (^2.1.1)
- **Dotenv**: Environment variable management (^16.5.0)

## Development Tools
- **Nodemon**: Development server auto-restart (^2.0.22)
- **NPM**: Package management

## Deployment & Infrastructure
- **Docker**: Containerization platform
- **Vercel**: Serverless deployment platform
- **Render**: Cloud application platform
- **Serverless-HTTP**: Serverless function adapter (^3.2.0)

## Frontend Styling & UI
- **Tailwind CSS**: Utility-first CSS framework
- **Font Awesome**: Icon library
- **Responsive Design**: Mobile-first approach

## Build & Development Commands

### NPM Scripts
```json
{
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

### Development Workflow
- **Local Development**: `npm run dev` with nodemon
- **Production**: `npm start` with Node.js
- **Docker Build**: `docker build -t streamapi .`
- **Docker Run**: `docker run -p 3000:3000 streamapi`

## Environment Variables
- **PORT**: Server port (default: 5001)
- **TMDB_API_KEY**: The Movie Database API key
- **EMAIL_HOST**: SMTP server host
- **EMAIL_PORT**: SMTP server port
- **EMAIL_USER**: Email username
- **EMAIL_PASSWORD**: Email password
- **EMAIL_FROM**: From email address
- **SITE_URL**: Application URL
- **SESSION_SECRET**: Session encryption secret

## API Integrations

### TMDB API Endpoints
- `/movie/popular`: Popular movies
- `/movie/now_playing`: Latest movies
- `/movie/top_rated`: Top-rated movies
- `/tv/popular`: Popular TV shows
- `/search/movie`: Movie search
- `/search/tv`: TV show search

### Internal API Endpoints
- `/api/search`: Content search
- `/api/trending`: Trending content
- `/api/watchlist/*`: Watchlist management
- `/api/player`: Video player
- `/api/subscribe`: Newsletter subscription

## Performance & Optimization
- **Session Management**: MongoDB-based session storage
- **Caching**: In-memory storage for frequently accessed data
- **Image Optimization**: TMDB image CDN integration
- **Lazy Loading**: Content loading optimization
- **WebSocket Optimization**: Connection pooling and cleanup