# WOLFLIX - Streaming Platform

## Overview
WOLFLIX is a streaming platform built with React + Vite on the frontend and Express on the backend. It uses the TMDB API for movie/TV metadata and AutoEmbed (player.autoembed.cc) as the sole streaming source via iframe embedding. Search combines IMDB API (api.imdbapi.dev) and TMDB results into unified Wolflix Results. The app features a dark theme with neon green (#00ff00) accents and glass-morphism card effects. A global search bar is in the header on every page.

## Architecture
- **Frontend**: React + TypeScript + Vite, TailwindCSS, Shadcn UI
- **Backend**: Express.js proxying TMDB API, IMDB API, and Arslan API requests
- **Streaming**: AutoEmbed player (player.autoembed.cc) embedded via iframe using IMDB/TMDB IDs
- **Styling**: Dark mode with neon green accents, glass card effects, font-display (Oxanium), font-mono
- **Routing**: wouter for client-side routing
- **Data Fetching**: @tanstack/react-query

## Pages
- `/` - Welcome (dashboard with hero, stats, featured TMDB trending content)
- `/movies` - Movies by genre (trending, action, sci-fi, horror, drama, comedy)
- `/tv-shows` - TV Shows by genre
- `/series` - Series collections (trending, top rated, popular, airing today)
- `/animation` - Animated content (movies, anime, TV, family)
- `/novel` - Book adaptations, literary classics, fantasy
- `/most-viewed` - Top 10 trending, popular, all-time favorites
- `/application` - Download apps info
- `/search` - Search movies & TV shows (unified Wolflix Results combining IMDB + TMDB)
- `/settings` - User preferences
- `/profile` - User profile
- `/watch/:type/:id` - Watch page with AutoEmbed iframe player, movie details, download links

## API Routes
### TMDB API (content browsing) - `/api/tmdb/`
- `trending` - Trending all
- `movies/trending`, `movies/popular`, `movies/top_rated`, `movies/genre/:id`
- `tv/trending`, `tv/popular`, `tv/top_rated`, `tv/airing_today`, `tv/genre/:id`
- `animation/movies`, `animation/anime`, `animation/tv`, `animation/family`
- `novel/adaptations`, `novel/classics`, `novel/fantasy`, `novel/series`
- `search/:query` - Multi search
- `movie/:id`, `tv/:id` - Individual movie/TV detail (accepts both TMDB and IMDB IDs)
- `movie/:id/external_ids`, `tv/:id/external_ids` - Get external IDs (IMDB etc.)

### IMDB API (BWM search) - `/api/imdb/`
- `search?q=` - Search titles via api.imdbapi.dev (no auth required)

### Arslan API (downloads) - `/api/arslan/`
- `search?text=` - Search for movies with download links
- `movie?url=` - Get movie details + download links
- `sinhalasub/search?text=`, `sinhalasub/movie?url=`, `sinhalasub/tvshow?url=`, `sinhalasub/episode?url=` - Sinhalasub sources

### WolfMovieAPI (MovieBox - legacy, still available) - `/api/wolfmovieapi/`
- Routes still exist in server but are no longer used by the frontend

## Streaming
- **AutoEmbed Player** (sole streaming source):
  - Movie URL: `player.autoembed.cc/embed/movie/{id}`
  - TV URL: `player.autoembed.cc/embed/tv/{id}/{season}/{episode}`
  - Supports both IMDB IDs and TMDB IDs
  - Embedded via iframe in the watch page
- Content navigation:
  - TMDB items: Navigate to `/watch/{type}/{tmdb_id}`, system looks up IMDB ID from TMDB data
  - BWM/Zone search items: Navigate to `/watch/{type}/{imdb_id}?source=zone&title={title}`, IMDB ID used directly
  - TMDB API resolves IMDB IDs automatically (e.g., `/api/tmdb/movie/tt1234567` works)
- For TV shows: External IDs endpoint fetches IMDB ID since it's not in the main TV detail response
- Season details fetched from TMDB `/api/tmdb/tv/{id}/season/{season}` for accurate episode counts and names
- Season & episode selector with full episode listing (name, overview, runtime, air date)
- Fullscreen toggle using browser Fullscreen API
- Download links fetched from Arslan API by searching movie title
- HTML entity decoding for download URLs using textarea helper

## Environment Variables
- `TMDB_API_KEY` - TMDB API key for fetching movie/TV data

## Key Components
- `GlassCard` / `GlassPanel` - Glass-morphism card components
- `ContentCard` - TMDB movie/TV show poster card, navigates to Watch page
- `ContentRow` - Horizontally scrollable content row (TMDB items)
- `AppSidebar` - Navigation sidebar using Shadcn sidebar primitives
