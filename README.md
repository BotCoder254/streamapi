# StreamAPI

![Screenshot](./Screenshot%20(15).png)





A streaming API service that fetches movie and TV show data from TMDB and VidSrc. This application provides a beautiful user interface for browsing movies and TV shows, with features like watchlists, search, and more.

## Oficcial website 

 [StreamApi](https://webstreamapi.tech/)


## Features

- Browse popular movies and TV shows
- View latest releases and top-rated content
- Search for specific movies and TV shows
- Create and manage your watchlist
- View detailed information about movies and TV shows
- Responsive, modern UI built with Tailwind CSS

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: EJS templating engine, Tailwind CSS
- **APIs**: TMDB API for movie/TV data
- **Email**: Nodemailer for newsletter and contact functionality

## Deployment Options

This application can be deployed using multiple services. Here are instructions for each option:

### Deploying to Vercel

1. Fork or clone this repository
2. Create an account on [Vercel](https://vercel.com)
3. Create a new project and import your repository
4. Add the following environment variables:
   - `TMDB_API_KEY` - Your TMDB API key
   - `EMAIL_HOST` - SMTP server host
   - `EMAIL_PORT` - SMTP server port
   - `EMAIL_USER` - Email username/address
   - `EMAIL_PASSWORD` - Email password or app password
   - `EMAIL_FROM` - From email address
   - `SITE_URL` - Site URL with protocol (e.g., https://yourapp.vercel.app)
5. Deploy!

### Deploying to Render

1. Fork or clone this repository
2. Create an account on [Render](https://render.com)
3. Create a new Web Service and select your repository
4. Set the following:
   - **Environment**: Node
   - **Build Command**: `npm ci`
   - **Start Command**: `node server.js`
5. Add the environment variables (same as above)
6. Deploy!

### Docker Deployment

1. Build the Docker image:

```bash
docker build -t streamapi .
```

2. Run the container:

```bash
docker run -p 3000:3000 \
  -e TMDB_API_KEY=your_tmdb_api_key \
  -e EMAIL_HOST=your_email_host \
  -e EMAIL_PORT=your_email_port \
  -e EMAIL_USER=your_email_user \
  -e EMAIL_PASSWORD=your_email_password \
  -e EMAIL_FROM=your_email_from \
  -e SITE_URL=your_site_url \
  streamapi
```

### Using Docker Compose

1. Update environment variables in a `.env` file
2. Run:

```bash
docker-compose up -d
```

## Local Development

1. Clone the repository:

```bash
git clone https://github.com/BotCoder254/streamapi.git
cd streamapi
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with the following variables:

```
PORT=3000
TMDB_API_KEY=your_tmdb_api_key
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=StreamAPI <your_email@gmail.com>
SITE_URL=http://localhost:3000
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## License

This project is licensed under the ISC License.

## Credits

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for the movie and TV show data
- [Tailwind CSS](https://tailwindcss.com/) for the styling
- [Font Awesome](https://fontawesome.com/) for the icons
- Created by [@BotCoder254](https://github.com/BotCoder254) 
