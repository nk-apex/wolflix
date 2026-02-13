export interface MovieBoxItem {
  subjectId: number;
  subjectType: number;
  title: string;
  description: string;
  releaseDate: string;
  duration: number;
  genre: string;
  cover: {
    url: string;
    width: number;
    height: number;
    thumbnail: string;
    blurHash: string;
  };
  countryName: string;
  imdbRatingValue: string;
  subtitles: string[];
  hasResource: boolean;
  detailPath: string;
  staffList: { staffId: number; staffName: string; staffRole: string; staffAvatar: string }[];
  season: { seasonId: number; seasonTitle: string }[] | null;
  dubs: string[];
  stills: { url: string }[];
  postTitle: string;
}

export interface MovieBoxSearchResponse {
  code: number;
  message: string;
  data: {
    pager: { hasMore: boolean; page: number; perPage: number; totalCount: number };
    items: MovieBoxItem[];
    counts: { label: string; count: number; type: number }[];
  };
}

export interface MovieBoxTrendingResponse {
  code: number;
  message: string;
  data: {
    subjectList: MovieBoxItem[];
    pager: { hasMore: boolean; page: number; perPage: number; totalCount: number };
  };
}

export interface MovieBoxHomeResponse {
  code: number;
  message: string;
  data: {
    operatingList: {
      type: string;
      title: string;
      subjects: MovieBoxItem[];
      position: number;
    }[];
  };
}

export interface MovieBoxFilterResponse {
  code: number;
  message: string;
  data: {
    pager: { hasMore: boolean; page: number; perPage: number; totalCount: number };
    items: MovieBoxItem[];
  };
}

export function getMovieBoxCover(item: MovieBoxItem, size: "thumbnail" | "full" = "full"): string {
  if (!item.cover) return "";
  return size === "thumbnail" ? (item.cover.thumbnail || item.cover.url) : item.cover.url;
}

export function getMovieBoxYear(item: MovieBoxItem): string {
  if (!item.releaseDate) return "";
  return item.releaseDate.split("-")[0];
}

export function getMovieBoxRating(item: MovieBoxItem): string {
  return item.imdbRatingValue || "0.0";
}

export function movieBoxToTMDB(item: MovieBoxItem): import("./tmdb").TMDBMovie {
  return {
    id: item.subjectId,
    title: item.title,
    overview: item.description,
    poster_path: null,
    backdrop_path: null,
    vote_average: parseFloat(item.imdbRatingValue) || 0,
    release_date: item.releaseDate,
    genre_ids: [],
    media_type: item.subjectType === 2 ? "tv" : "movie",
    popularity: 0,
    _moviebox: item,
  } as any;
}
