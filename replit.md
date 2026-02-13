# WOLFLIX - Streaming Platform

## Overview
WOLFLIX is a streaming platform built with React + Vite on the frontend and Express on the backend. It uses the BWM API (api.imdbapi.dev) as the sole data source for movie/TV metadata and AutoEmbed (player.autoembed.cc) as the sole streaming source via iframe embedding. The app features a dark theme with neon green (#00ff00) accents and glass-morphism card effects. A global search bar is in the header on every page.

## Architecture
- **Frontend**: React + TypeScript + Vite, TailwindCSS, Shadcn UI
- **Backend**: Express.js proxying BWM API (IMDB) and Arslan API requests
- **Streaming**: AutoEmbed player (player.autoembed.cc) embedded via iframe using IMDB IDs
- **Styling**: Dark mode with neon green accents, glass card effects, font-display (Oxanium), font-mono
- **Routing**: wouter for client-side routing
- **Data Fetching**: @tanstack/react-query

## Pages
- `/` - Welcome (dashboard with hero, stats, featured BWM trending content)
- `/movies` - Movies by category (trending, action, sci-fi, horror, drama, comedy)
- `/tv-shows` - TV Shows by category
- `/series` - Series collections (trending, top rated, popular, new)
- `/animation` - Animated content (movies, anime, TV, family)
- `/novel` - Book adaptations, literary classics, fantasy
- `/most-viewed` - Top 10 trending, popular, all-time favorites
- `/application` - Download apps info
- `/search` - Search movies & TV shows via BWM API
- `/settings` - User preferences
- `/profile` - User profile
- `/watch/:type/:id` - Watch page with AutoEmbed iframe player, movie details, download links

## API Routes
### BWM API (content browsing & search) - `/api/bwm/`
- `search?q=` - Search titles via api.imdbapi.dev (no auth required)
- `category/:category` - Category-based content using curated keyword searches
  - Movie categories: trending, action, scifi, horror, drama, comedy
  - TV categories: tv-trending, tv-action, tv-scifi, tv-animation, tv-drama, tv-documentary
  - Series categories: series-trending, series-top, series-popular, series-new
  - Animation categories: animation-movies, animation-anime, animation-tv, animation-family
  - Novel categories: novel-adaptations, novel-classics, novel-fantasy, novel-series
  - Most-viewed categories: most-trending, most-popular, most-top-rated, most-tv-popular
- `title/:id` - Get title details from BWM v2 API

### Arslan API (downloads) - `/api/arslan/`
- `search?text=` - Search for movies with download links
- `movie?url=` - Get movie details + download links
- `sinhalasub/search?text=`, `sinhalasub/movie?url=`, `sinhalasub/tvshow?url=`, `sinhalasub/episode?url=` - Sinhalasub sources

## Streaming
- **AutoEmbed Player** (sole streaming source):
  - Movie URL: `player.autoembed.cc/embed/movie/{imdb_id}`
  - TV URL: `player.autoembed.cc/embed/tv/{imdb_id}/{season}/{episode}`
  - Uses IMDB IDs (tt-prefixed) from BWM API
  - Embedded via iframe in the watch page
- Content navigation:
  - All items navigate to `/watch/{type}/{imdb_id}?source=zone&title={title}`
  - IMDB IDs used directly for AutoEmbed player
- TV show season/episode data from BWM v2 title API (totalSeasons, seasons array)
- Season & episode selector with numbered episode listing
- Fullscreen toggle using browser Fullscreen API
- Download links fetched from Arslan API by searching movie title
- Auto-advance to next episode via postMessage listener

## BWM API Data Format
- Titles have: id (tt-prefixed IMDB ID), type, primaryTitle, primaryImage, startYear, rating
- Types: "movie", "tvSeries", "tvMiniSeries", "tvMovie", "tvSpecial"
- Category browsing uses curated keyword searches (BWM only supports search, no genre/trending endpoints)

## Environment Variables
- No API keys required (BWM API is free/no auth)

## Key Components
- `GlassCard` / `GlassPanel` - Glass-morphism card components
- `ContentCard` - BWM title poster card, navigates to Watch page
- `ContentRow` - Horizontally scrollable content row (BWM items)
- `AppSidebar` - Navigation sidebar using Shadcn sidebar primitives
