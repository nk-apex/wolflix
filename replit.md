# WOLFLIX - Streaming Platform

## Overview
WOLFLIX is a streaming platform built with React + Vite on the frontend and Express on the backend. It uses the TMDB API and MovieBox (wolfmovieapi) to display movies, TV shows, animation, and more. The app features a dark theme with neon green (#00ff00) accents and glass-morphism card effects.

## Architecture
- **Frontend**: React + TypeScript + Vite, TailwindCSS, Shadcn UI
- **Backend**: Express.js proxying TMDB API and MovieBox API requests
- **Styling**: Dark mode with neon green accents, glass card effects, font-display (Oxanium), font-mono
- **Routing**: wouter for client-side routing
- **Data Fetching**: @tanstack/react-query

## Pages
- `/` - Welcome (dashboard with hero, stats, featured content, MovieBox trending + categories)
- `/movies` - Movies by genre (trending, action, sci-fi, horror, drama, comedy)
- `/tv-shows` - TV Shows by genre
- `/series` - Series collections (trending, top rated, popular, airing today)
- `/animation` - Animated content (movies, anime, TV, family)
- `/novel` - Book adaptations, literary classics, fantasy
- `/most-viewed` - Top 10 trending, popular, all-time favorites
- `/application` - Download apps info
- `/search` - Search movies & TV shows (dual TMDB + MovieBox results with tabs)
- `/settings` - User preferences
- `/profile` - User profile
- `/watch/:type/:id` - Watch page with embedded player, movie details, download links, and related MovieBox content

## API Routes
### WolfMovieAPI (MovieBox powered) - `/api/wolfmovieapi/`
- `home` - Home page content with categories (operatingList)
- `search?keyword=&page=&perPage=&type=` - Search movies/TV (POST to MovieBox)
- `search-suggest?keyword=` - Search suggestions
- `trending?page=&perPage=&tabId=` - Trending content
- `filter?type=&page=&perPage=&genre=&country=&year=&sort=` - Filter content (type: 1=movie, 2=series)
- `detail/:subjectId?page=` - Related content for a subject
- `stream-domain` - Get streaming domain URL (currently 123movienow.cc)
- `everyone-search` - Popular search terms

### TMDB API (content browsing) - `/api/tmdb/`
- `trending` - Trending all
- `movies/trending`, `movies/popular`, `movies/top_rated`, `movies/genre/:id`
- `tv/trending`, `tv/popular`, `tv/top_rated`, `tv/airing_today`, `tv/genre/:id`
- `animation/movies`, `animation/anime`, `animation/tv`, `animation/family`
- `novel/adaptations`, `novel/classics`, `novel/fantasy`, `novel/series`
- `search/:query` - Multi search
- `movie/:id`, `tv/:id` - Individual movie/TV detail

### Arslan API (streaming/downloads) - `/api/arslan/`
- `search?text=` - Search for movies with download links (pirate source)
- `movie?url=` - Get movie details + download links
- `sinhalasub/search?text=`, `sinhalasub/movie?url=`, `sinhalasub/tvshow?url=`, `sinhalasub/episode?url=` - Sinhalasub sources

## Streaming
- Clicking any content card navigates to `/watch/:type/:id`
- Watch page has embedded player with 4 server options (MultiEmbed, AutoEmbed, 2Embed, MovieBox)
- MovieBox items navigate with `?source=moviebox` and store item data in sessionStorage
- Fullscreen toggle button on the player using browser Fullscreen API
- Download links fetched from Arslan Pirate API by searching movie title
- Multiple download sources with quality/size info

## MovieBox Integration (wolfmovieapi)
- Server-side token management with automatic refresh (1 hour expiry)
- Token obtained from `/web/get-page-tdk` endpoint
- API base: `https://h5-api.aoneroom.com/wefeed-h5api-bff/`
- Streaming domain: dynamically fetched from `/media-player/get-domain`
- Uses POST for search/filter, GET for trending/home/detail
- Required headers: X-Client-Token, X-Request-Lang, User-Agent

## Environment Variables
- `TMDB_API_KEY` - TMDB API key for fetching movie/TV data

## Key Components
- `GlassCard` / `GlassPanel` - Glass-morphism card components
- `ContentCard` - TMDB movie/TV show poster card, navigates to Watch page
- `MovieBoxCard` - MovieBox content card with cover images from MovieBox CDN
- `ContentRow` - Horizontally scrollable content row (TMDB items)
- `MovieBoxRow` - Horizontally scrollable content row (MovieBox items)
- `AppSidebar` - Navigation sidebar using Shadcn sidebar primitives
