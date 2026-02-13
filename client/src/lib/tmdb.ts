export interface BWMTitle {
  id: string;
  type: string;
  primaryTitle: string;
  originalTitle?: string;
  primaryImage?: { url: string; width: number; height: number };
  startYear?: number;
  endYear?: number;
  rating?: { aggregateRating: number; voteCount: number };
  genres?: string[];
}

export interface BWMResponse {
  titles: BWMTitle[];
}

export interface BWMDetail {
  id: string;
  type: string;
  primaryTitle: string;
  originalTitle?: string;
  primaryImage?: { url: string; width: number; height: number };
  startYear?: number;
  endYear?: number;
  rating?: { aggregateRating: number; voteCount: number };
  genres?: string[];
  plot?: string;
  runtime?: number;
  totalSeasons?: number;
  totalEpisodes?: number;
  seasons?: { seasonNumber: number; episodeCount: number }[];
}

export function getMediaType(type: string): "movie" | "tv" {
  if (type === "tvSeries" || type === "tvMiniSeries" || type === "tvSpecial") return "tv";
  return "movie";
}

export function getRating(rating?: { aggregateRating: number; voteCount: number }): string {
  if (!rating?.aggregateRating) return "";
  return rating.aggregateRating.toFixed(1);
}

export function getYear(startYear?: number): string {
  if (!startYear) return "";
  return String(startYear);
}

export function getPosterUrl(item: BWMTitle): string {
  return item.primaryImage?.url || "";
}
