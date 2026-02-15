# WOLFLIX - Streaming Platform

## Overview
WOLFLIX is a streaming platform built with React + Vite on the frontend and Express on the backend. It uses the movieapi.xcasper.space API as the data source for movie/TV metadata and direct MP4 streaming URLs. The app features a dark theme with neon green (#00ff00) accents and glass-morphism card effects.

## Recent Changes
- **Feb 15, 2026**: Migrated from IMDB API to movieapi.xcasper.space API
  - Replaced all API endpoints (trending, hot, search, play, recommend, homepage, popular-search, rich-detail)
  - Updated data model to use SubjectItem with subjectType (1=movie, 2=TV)
  - Streaming now uses direct MP4 URLs with multiple quality options and SRT subtitles
  - Removed unused pages (Series, Animation, Music, Sport, Novel, Most Viewed, Application, Settings, Profile)
  - Added detailPath parameter to play and rich-detail endpoints
  - Added User-Agent header to API proxy (required by external API)

## Architecture
- **Frontend**: React + TypeScript + Vite, TailwindCSS, Shadcn UI
- **Backend**: Express.js proxying movieapi.xcasper.space API requests with caching
- **Streaming**: Direct MP4 URLs from API with HTML5 video player, multiple quality options (360p/480p/1080p)
- **Subtitles**: SRT format served from API, loaded as video tracks
- **Styling**: Dark mode with neon green accents, glass card effects, font-display (Oxanium), font-mono
- **Routing**: wouter for client-side routing
- **Data Fetching**: @tanstack/react-query

## API (movieapi.xcasper.space)
### Key Concepts
- `subjectId`: Unique content ID
- `subjectType`: 1 = Movie, 2 = TV Show
- `detailPath`: URL slug needed for play and rich-detail endpoints
- API requires User-Agent header for successful requests

### Server Proxy Routes (`/api/wolflix/`)
- `trending` - Trending content list
- `hot` - Hot movies and TV shows (separate movie/tv arrays)
- `homepage` - Homepage data with banners
- `search?keyword=` - Search by keyword
- `popular-search` - Popular search terms
- `recommend?subjectId=` - Recommended content
- `rich-detail?detailPath=` - Detailed content info
- `play?subjectId=&detailPath=` - Get streaming URLs (MP4), subtitles, optional ep/season params

## Pages
- `/` - Welcome (hero carousel, stats, trending/hot content rows)
- `/movies` - Movies by category (hot, trending, genre-grouped)
- `/tv-shows` - TV Shows by category (hot, trending, genre-grouped)
- `/search` - Search with popular search suggestions
- `/watch/:type/:id` - Watch page with HTML5 video player, quality selection, subtitles, download links, recommendations

## Key Components
- `GlassCard` / `GlassPanel` - Glass-morphism card components
- `ContentCard` - Title poster card with rating badge, navigates to Watch page (passes detailPath in URL)
- `ContentRow` - Horizontally scrollable content row with scroll buttons
- `AppSidebar` - Navigation sidebar using Shadcn sidebar primitives

## Data Types (client/src/lib/tmdb.ts)
- `SubjectItem` - Core content item (subjectId, subjectType, title, cover, genre, imdbRatingValue, detailPath, etc.)
- `BannerItem` - Homepage banner with subject reference
- Helper functions: getMediaType, getRating, getYear, getPosterUrl, getGenres

## Caching
- Server-side in-memory cache with 5-minute TTL
- Max 300 cache entries with LRU eviction
- 20-second timeout on API calls

## Environment Variables
- No API keys required (movieapi.xcasper.space is free/no auth, only needs User-Agent header)
