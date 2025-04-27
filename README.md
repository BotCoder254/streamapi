# StreamAPI

A modern streaming API service that fetches movie and TV show data from TMDB and VidSrc. Built with Node.js, Express, and EJS.

![StreamAPI Screenshot](https://via.placeholder.com/800x400/1a202c/10b981?text=StreamAPI)

## Features

- 🎬 Browse movies and TV shows
- 📺 View latest releases and top-rated content
- 🔍 Search for movies and TV shows
- 📋 Create and manage your watchlist
- 📱 Responsive design for all devices
- 📧 Contact form with email notifications
- 📰 Newsletter subscription functionality

## Tech Stack

- **Frontend**: HTML, CSS (Tailwind CSS), JavaScript
- **Backend**: Node.js, Express
- **Templating**: EJS
- **Email**: Nodemailer
- **APIs**: TMDB API, VidSrc

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/streamapi.git
   cd streamapi
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   # Server Configuration
   PORT=3000

   # TMDB API Configuration
   TMDB_API_KEY=your_tmdb_api_key

   # Email Configuration (Gmail)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=StreamAPI <your-email@gmail.com>

   # Site Configuration
   SITE_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Setting Up Gmail for Nodemailer

To use Gmail with Nodemailer in this application, follow these steps:

1. **Create a Google Account** (if you don't have one already)

2. **Enable 2-Step Verification**:
   - Go to your Google Account at [myaccount.google.com](https://myaccount.google.com)
   - Select "Security" from the left navigation panel
   - Under "Signing in to Google," select "2-Step Verification" and turn it on

3. **Create an App Password**:
   - After enabling 2-Step Verification, go back to the Security page
   - Select "App passwords" (under "Signing in to Google")
   - Select "Mail" as the app and "Other" as the device (name it "StreamAPI")
   - Click "Generate"
   - Google will generate a 16-character password - copy this password

4. **Update Your .env File**:
   - Use your Gmail address as `EMAIL_USER`
   - Use the generated App Password as `EMAIL_PASSWORD`

5. **Test the Email Functionality**:
   - Start the server and test the contact form or newsletter subscription

## Project Structure

```
streamapi/
├── public/           # Static assets
│   ├── css/          # CSS files
│   └── js/           # JavaScript files
├── views/            # EJS templates
│   ├── emails/       # Email templates
│   └── partials/     # Reusable template parts
├── .env              # Environment variables
├── package.json      # Project dependencies
├── README.md         # Project documentation
└── server.js         # Application entry point
```

## Routes

- `/` - Homepage
- `/browse` - Browse movies
- `/browse/tv` - Browse TV shows
- `/latest` - Latest movies
- `/latest/tv` - Latest TV shows
- `/latest/episodes` - Latest episodes
- `/top` - Top rated movies
- `/top/tv` - Top rated TV shows
- `/search` - Search page for movies
- `/search/tv` - Search page for TV shows
- `/results` - Search results for movies
- `/results/tv` - Search results for TV shows
- `/view/movie/:id` - View movie details
- `/view/tv/:id` - View TV show details
- `/view/tv/:id/:s/:e` - View TV episode
- `/watchlist` - User's watchlist
- `/contact` - Contact page

## API Endpoints

- `/api/search` - Search movies and TV shows
- `/api/player` - Get player embed URL
- `/api/watchlist/add` - Add item to watchlist
- `/api/watchlist/remove` - Remove item from watchlist
- `/api/watchlist/check` - Check if item is in watchlist
- `/api/subscribe` - Subscribe to newsletter

## License

ISC

## Created By

[BotCoder254](https://github.com/BotCoder254) 