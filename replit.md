# WOLFLIX - Streaming Platform

## Overview
WOLFLIX is a streaming platform built with React + Vite on the frontend and Express on the backend. It uses the movieapi.xcasper.space API as the data source for movie/TV metadata. Streaming is handled via ShowBox embed players (VidSrc, VidSrc.me, MultiEmbed, AutoEmbed, NontonGo). The app features a dark theme with neon green (#00ff00) accents and glass-morphism card effects.

## Recent Changes
- **Feb 16, 2026**: Music search cards, music play page, watch page hover controls
  - Redesigned Music page with search bar using xwolf search API, results shown as card grid (like movies)
  - Added Music play page (`/music/play/:id`) with MP3/MP4 format selection and streaming player
  - Added hover-visible playback controls (pause, next, previous, mute) on watch page streaming player
  - Backend proxy route for xwolf search API (`/api/wolflix/music/search`)
- **Feb 16, 2026**: Music page, grid layouts, fullscreen watch page
  - Added Music page (`/music`) with YouTube MP3/MP4 playback via xwolf APIs
  - Backend proxy routes for xwolf music APIs (`/api/wolflix/music/mp3`, `/api/wolflix/music/mp4`, `/api/wolflix/music/download`)
  - Converted homepage, movies, TV shows pages from horizontal scroll rows to vertical grid layout (ContentGrid)
  - Watch page redesigned to edge-to-edge fullscreen with player filling viewport height
- **Feb 16, 2026**: ShowBox embed player integration & detail page improvements
  - Switched from direct MP4 URLs to ShowBox embed players (XCASPER API's /play URLs are IP-locked)
  - Added ShowBox resolve endpoint (`/api/wolflix/showbox/resolve`) that searches ShowBox API for IMDB IDs
  - Added player proxy endpoint (`/api/wolflix/player`) serving HTML pages with embed iframes
  - Added detail page (`/detail/:type/:id`) with rich metadata, hero backdrop, cast, recommendations
  - Fixed API response structure: detail endpoint returns data in `data.subject` not `data`
  - Added title cleanup: strips [CAM] and other bracketed tags before ShowBox search
  - URL parameter resilience: fallback to detail API when query params missing on direct navigation
  - TV show season/episode selection with dynamic ShowBox resolve per episode
- **Feb 15, 2026**: Migrated from IMDB API to movieapi.xcasper.space API

## Architecture
- **Frontend**: React + TypeScript + Vite, TailwindCSS, Shadcn UI
- **Backend**: Express.js proxying movieapi.xcasper.space API requests with caching
- **Streaming**: ShowBox embed players via iframe (VidSrc, VidSrc.me, MultiEmbed, AutoEmbed, NontonGo)
- **Player Proxy**: `/api/wolflix/player` serves HTML pages embedding provider iframes, bypassing iframe restrictions
- **Styling**: Dark mode with neon green accents, glass card effects, font-display (Oxanium), font-mono
- **Routing**: wouter for client-side routing
- **Data Fetching**: @tanstack/react-query

## API (movieapi.xcasper.space)
### Key Concepts
- `subjectId`: Unique content ID
- `subjectType`: 1 = Movie, 2 = TV Show
- `detailPath`: URL slug needed for play and rich-detail endpoints
- API requires User-Agent header for successful requests
- Detail endpoint returns data nested in `data.subject` (not directly in `data`)

### Server Proxy Routes (`/api/wolflix/`)
- `trending` - Trending content list
- `hot` - Hot movies and TV shows (separate movie/tv arrays)
- `homepage` - Homepage data with banners
- `search?keyword=` - Search by keyword
- `popular-search` - Popular search terms
- `recommend?subjectId=` - Recommended content
- `detail?subjectId=` - Basic content info (returns data.subject)
- `rich-detail?detailPath=` - Detailed content info with cast, seasons
- `showbox/resolve?title=&type=` - Resolve ShowBox embed links by title
- `player?url=` - Serve HTML page with embedded player iframe
- `music/mp3?url=` - Convert YouTube URL to MP3 stream via xwolf API
- `music/mp4?url=` - Convert YouTube URL to MP4 stream via xwolf API
- `music/download?url=` - Get direct download link via xwolf API
- `music/search?q=` - Search for music using xwolf search API

## Pages
- `/` - Welcome (hero carousel, stats, trending/hot content rows)
- `/movies` - Movies by category (hot, trending, genre-grouped)
- `/tv-shows` - TV Shows by category (hot, trending, genre-grouped)
- `/search` - Search with popular search suggestions
- `/detail/:type/:id` - Detail page with metadata, description, cast, recommendations, "Watch Now" button
- `/watch/:type/:id` - Watch page with ShowBox embed player, provider switching, season/episode selection (TV)
- `/music` - Music search page with card grid results
- `/music/play/:id` - Music play page with MP3/MP4 format selection and streaming player

## Key Components
- `GlassCard` / `GlassPanel` - Glass-morphism card components
- `ContentCard` - Title poster card with rating badge, navigates to Watch page (passes detailPath in URL)
- `ContentRow` - Horizontally scrollable content row with scroll buttons
- `AppSidebar` - Navigation sidebar using Shadcn sidebar primitives

## Data Types (client/src/lib/tmdb.ts)
- `SubjectItem` - Core content item (subjectId, subjectType, title, cover, genre, imdbRatingValue, detailPath, etc.)
- `BannerItem` - Homepage banner with subject reference
- Helper functions: getMediaType, getRating, getYear, getPosterUrl, getGenres

## Streaming Flow
1. User clicks content → navigates to `/watch/:type/:id` with query params (title, detailPath)
2. If no query params (direct URL), watch page fetches title from `/api/wolflix/detail?subjectId=`
3. Title is cleaned (strips [CAM] etc.) and sent to `/api/wolflix/showbox/resolve`
4. ShowBox resolve returns embed links from multiple providers
5. First provider URL is loaded via `/api/wolflix/player?url=` (server-side HTML proxy)
6. User can switch providers, reload player, or open in new tab as fallback

## Caching
- Server-side in-memory cache with 5-minute TTL
- Max 300 cache entries with LRU eviction
- 20-second timeout on API calls

## Environment Variables
- No API keys required (movieapi.xcasper.space is free/no auth, only needs User-Agent header)
