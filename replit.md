# WOLFLIX - Streaming Platform

## Overview
WOLFLIX is a streaming platform built with React + Vite on the frontend and Express on the backend. It uses the IMDB API (api.imdbapi.dev) as the data source for movie/TV metadata and multiple embed sources for streaming via iframe. The app features a dark theme with neon green (#00ff00) accents and glass-morphism card effects. A global search bar is in the header on every page.

## Architecture
- **Frontend**: React + TypeScript + Vite, TailwindCSS, Shadcn UI
- **Backend**: Express.js proxying IMDB API and download API requests
- **Streaming**: Multiple embed sources (AutoEmbed, VidSrc, Embed.su) with server switching
- **Styling**: Dark mode with neon green accents, glass card effects, font-display (Oxanium), font-mono
- **Routing**: wouter for client-side routing
- **Data Fetching**: @tanstack/react-query with retry and exponential backoff

## Pages
- `/` - Welcome (dashboard with hero, stats, featured trending content)
- `/movies` - Movies by category (trending, action, sci-fi, horror, drama, comedy)
- `/tv-shows` - TV Shows by category
- `/series` - Series collections (trending, top rated, popular, new)
- `/animation` - Animated content (movies, anime, TV, family)
- `/music` - Music content (documentaries, biopics, concerts, musicals)
- `/sport` - Sports content (movies, boxing, racing, football, basketball, documentaries)
- `/novel` - Book adaptations, literary classics, fantasy
- `/most-viewed` - Top 10 trending, popular, all-time favorites
- `/application` - Download apps info
- `/search` - Search movies & TV shows
- `/settings` - User preferences
- `/profile` - User profile
- `/watch/:type/:id` - Watch page with multi-source player, movie details, download links

## API Routes (SilentWolf branded) - `/api/silentwolf/`
### Content browsing & search
- `search?q=` - Search titles via IMDB API (no auth required)
- `category/:category` - Category-based content using curated keyword searches (parallel fetching)
  - Movie categories: trending, action, scifi, horror, drama, comedy
  - TV categories: tv-trending, tv-action, tv-scifi, tv-animation, tv-drama, tv-documentary
  - Series categories: series-trending, series-top, series-popular, series-new
  - Animation categories: animation-movies, animation-anime, animation-tv, animation-family
  - Music categories: music-concert, music-documentary, music-biopic, music-musical
  - Sport categories: sport-football, sport-boxing, sport-racing, sport-documentary, sport-basketball, sport-general
  - Novel categories: novel-adaptations, novel-classics, novel-fantasy, novel-series
  - Most-viewed categories: most-trending, most-popular, most-top-rated, most-tv-popular
- `title/:id` - Get title details from IMDB v2 API

### Downloads - `/api/silentwolf/download/`
- `search?text=` - Search for movies with download links
- `movie?url=` - Get movie details + download links

### Subtitles - `/api/silentwolf/sub/`
- `search?text=`, `movie?url=`, `tvshow?url=`, `episode?url=` - Subtitle sources

## Streaming
- **Multiple Embed Sources** (switchable in watch page):
  - Server 1: player.autoembed.cc
  - Server 2: vidsrc.cc
  - Server 3: vidsrc.xyz
  - Server 4: embed.su
- Uses IMDB IDs (tt-prefixed) from API
- No splash/loading screen - direct iframe display
- TV show season/episode navigation with auto-advance
- Download links via download API

## Error Handling
- Server returns 502 with friendly messages on upstream failures
- Frontend retries queries 2x with exponential backoff
- 5-minute stale time for cached data
- AbortSignal.timeout(15000) on all external API calls
- Category fetching uses Promise.allSettled for parallel requests

## Environment Variables
- No API keys required (IMDB API is free/no auth)

## Key Components
- `GlassCard` / `GlassPanel` - Glass-morphism card components
- `ContentCard` - Title poster card, navigates to Watch page
- `ContentRow` - Horizontally scrollable content row
- `AppSidebar` - Navigation sidebar using Shadcn sidebar primitives
