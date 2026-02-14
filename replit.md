# WOLFLIX - Streaming Platform

## Overview
WOLFLIX is a streaming platform built with React + Vite on the frontend and Express on the backend. It uses the IMDB API (api.imdbapi.dev) as the data source for movie/TV metadata and AutoEmbed for streaming via iframe. The app features a dark theme with neon green (#00ff00) accents and glass-morphism card effects. A global search bar is in the header on every page.

## Architecture
- **Frontend**: React + TypeScript + Vite, TailwindCSS, Shadcn UI
- **Backend**: Express.js proxying IMDB API and download API requests
- **Streaming**: AutoEmbed (player.autoembed.cc) single source
- **Styling**: Dark mode with neon green accents, glass card effects, font-display (Oxanium), font-mono
- **Routing**: wouter for client-side routing
- **Data Fetching**: @tanstack/react-query with retry and exponential backoff

## IMDB API Endpoints Used
- `/search/titles?query=` - Keyword search
- `/titles` - List/filter titles by genre, type, rating, year (supports: genres, types, sortBy, sortOrder, minVoteCount, startYear, endYear)
- `/titles/{titleId}` - Get full title details (plot, genres, rating, runtime, directors, stars)
- `/titles/{titleId}/seasons` - Get season/episode data for TV series

## Pages
- `/` - Welcome (dashboard with hero, stats, featured trending content)
- `/movies` - Movies by category (trending, action, sci-fi, horror, drama, comedy)
- `/tv-shows` - TV Shows by category
- `/series` - Series collections (trending, top rated, popular, new)
- `/animation` - Animated content (movies, anime, TV, family)
- `/music` - Music content (documentaries, biopics, concerts, musicals) - uses genre filtering
- `/sport` - Sports content (movies, boxing, racing, football, basketball, documentaries) - uses genre filtering
- `/novel` - Book adaptations, literary classics, fantasy
- `/most-viewed` - Top 10 trending, popular, all-time favorites
- `/application` - Download apps info
- `/search` - Search movies & TV shows
- `/settings` - User preferences
- `/profile` - User profile
- `/watch/:type/:id` - Watch page with AutoEmbed player, movie details, download links

## API Routes (SilentWolf branded) - `/api/silentwolf/`
### Content browsing & search
- `search?q=` - Search titles via IMDB API (no auth required)
- `category/:category` - Category-based content using genre filtering OR keyword search
  - Uses `/titles` endpoint with genre/type filters for most categories (Music, Sport, Action, etc.)
  - Falls back to keyword search for trending/new categories
  - Movie categories: trending, action, scifi, horror, drama, comedy
  - TV categories: tv-trending, tv-action, tv-scifi, tv-animation, tv-drama, tv-documentary
  - Series categories: series-trending, series-top, series-popular, series-new
  - Animation categories: animation-movies, animation-anime, animation-tv, animation-family
  - Music categories: music-concert, music-documentary, music-biopic, music-musical
  - Sport categories: sport-football, sport-boxing, sport-racing, sport-documentary, sport-basketball, sport-general
  - Novel categories: novel-adaptations, novel-classics, novel-fantasy, novel-series
  - Most-viewed categories: most-trending, most-popular, most-top-rated, most-tv-popular
- `title/:id` - Get title details from IMDB API (`/titles/{id}`) + seasons data for TV series

### Downloads - `/api/silentwolf/download/`
- `search?text=` - Search for movies with download links
- `movie?url=` - Get movie details + download links

### Subtitles - `/api/silentwolf/sub/`
- `search?text=`, `movie?url=`, `tvshow?url=`, `episode?url=` - Subtitle sources

## Streaming
- **AutoEmbed Player** (single source):
  - Movie URL: `player.autoembed.cc/embed/movie/{imdb_id}`
  - TV URL: `player.autoembed.cc/embed/tv/{imdb_id}/{season}/{episode}`
- Uses IMDB IDs (tt-prefixed) from API
- No splash/loading screen - direct iframe display
- TV show season/episode navigation with auto-advance
- Download links via download API

## Error Handling
- Server returns 502 with friendly messages on upstream failures
- Frontend retries queries 2x with exponential backoff
- 5-minute stale time for cached data
- AbortSignal.timeout(15000) on all external API calls
- Category fetching uses Promise.allSettled for parallel keyword searches

## Environment Variables
- No API keys required (IMDB API is free/no auth)

## Key Components
- `GlassCard` / `GlassPanel` - Glass-morphism card components
- `ContentCard` - Title poster card, navigates to Watch page
- `ContentRow` - Horizontally scrollable content row
- `AppSidebar` - Navigation sidebar using Shadcn sidebar primitives
