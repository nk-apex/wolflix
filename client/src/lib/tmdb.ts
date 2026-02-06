const IMG_BASE = "https://image.tmdb.org/t/p";

export const IMG = `${IMG_BASE}/w342`;
export const IMG_BACKDROP = `${IMG_BASE}/w1280`;
export const IMG_POSTER_SM = `${IMG_BASE}/w185`;

export interface TMDBMovie {
  id: number;
  title: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  media_type?: string;
  popularity: number;
}

export interface TMDBResponse {
  results: TMDBMovie[];
  page: number;
  total_pages: number;
  total_results: number;
}

export function openStream(type: string, id: number) {
  window.open(`https://vidsrc.cc/v2/embed/${type}/${id}`, "_blank");
}

export function openDownload(type: string, id: number) {
  window.open(`https://vidsrc.me/download/${type}?tmdb=${id}`, "_blank");
}

export function getImageUrl(path: string | null, size: string = "w342"): string {
  if (!path) return "";
  return `${IMG_BASE}/${size}${path}`;
}

export function getRating(vote: number): string {
  return vote.toFixed(1);
}

export function getYear(date?: string): string {
  if (!date) return "";
  return date.split("-")[0];
}
