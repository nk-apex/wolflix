# WOLFLIX - Streaming Platform

## Overview
WOLFLIX is a streaming platform built with React + Vite on the frontend and Express on the backend. It uses the TMDB API to display movies, TV shows, animation, and more. The app features a dark theme with neon green (#00ff00) accents and glass-morphism card effects.

## Architecture
- **Frontend**: React + TypeScript + Vite, TailwindCSS, Shadcn UI
- **Backend**: Express.js proxying TMDB API requests
- **Styling**: Dark mode with neon green accents, glass card effects, font-display (Oxanium), font-mono
- **Routing**: wouter for client-side routing
- **Data Fetching**: @tanstack/react-query

## Pages
- `/` - Welcome (dashboard with hero, stats, featured content)
- `/movies` - Movies by genre (trending, action, sci-fi, horror, drama, comedy)
- `/tv-shows` - TV Shows by genre
- `/series` - Series collections (trending, top rated, popular, airing today)
- `/animation` - Animated content (movies, anime, TV, family)
- `/novel` - Book adaptations, literary classics, fantasy
- `/most-viewed` - Top 10 trending, popular, all-time favorites
- `/application` - Download apps info
- `/search` - Search movies & TV shows
- `/settings` - User preferences
- `/profile` - User profile

## API Routes
All prefixed with `/api/tmdb/`:
- `trending` - Trending all
- `movies/trending`, `movies/popular`, `movies/top_rated`, `movies/genre/:id`
- `tv/trending`, `tv/popular`, `tv/top_rated`, `tv/airing_today`, `tv/genre/:id`
- `animation/movies`, `animation/anime`, `animation/tv`, `animation/family`
- `novel/adaptations`, `novel/classics`, `novel/fantasy`, `novel/series`
- `search/:query` - Multi search

## Environment Variables
- `TMDB_API_KEY` - TMDB API key for fetching movie/TV data

## Key Components
- `GlassCard` / `GlassPanel` - Glass-morphism card components
- `ContentCard` - Movie/TV show poster card with stream/download buttons
- `ContentRow` - Horizontally scrollable content row
- `AppSidebar` - Navigation sidebar using Shadcn sidebar primitives
