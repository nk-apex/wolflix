export interface CoverImage {
  url: string;
  width: number;
  height: number;
}

export interface SubjectItem {
  subjectId: string;
  subjectType: number;
  title: string;
  description: string;
  releaseDate: string;
  duration: number;
  genre: string;
  cover: CoverImage | null;
  countryName: string;
  imdbRatingValue: string;
  subtitles: string;
  hasResource: boolean;
  detailPath: string;
  stills: CoverImage | null;
  imdbRatingCount: number;
  postTitle: string;
}

export interface BannerItem {
  id: string;
  title: string;
  image: CoverImage;
  subjectId: string;
  subjectType: number;
  subject: SubjectItem;
  detailPath: string;
}

export interface HomepageData {
  platformList: { name: string; uploadBy: string }[];
  operatingList: {
    type: string;
    position: number;
    title: string;
    banner?: { items: BannerItem[] };
  }[];
}

export interface TrendingResponse {
  code: number;
  success: boolean;
  data: { subjectList: SubjectItem[] };
}

export interface HotResponse {
  code: number;
  success: boolean;
  data: { movie: SubjectItem[]; tv: SubjectItem[] };
}

export interface SearchResponse {
  code: number;
  success: boolean;
  data: {
    pager: { hasMore: boolean; nextPage: string; page: string; totalCount: number };
    items: SubjectItem[];
  };
}

export interface PopularSearchResponse {
  code: number;
  success: boolean;
  data: { everyoneSearch: { title: string }[] };
}

export interface HomepageResponse {
  code: number;
  success: boolean;
  data: HomepageData;
}

export interface RecommendResponse {
  code: number;
  success: boolean;
  data: { items: SubjectItem[] };
}

export function getMediaType(subjectType: number): "movie" | "tv" {
  return subjectType === 1 ? "movie" : "tv";
}

export function getRating(item: SubjectItem): string {
  return item.imdbRatingValue || "";
}

export function getYear(item: SubjectItem): string {
  if (!item.releaseDate) return "";
  return item.releaseDate.substring(0, 4);
}

export function getPosterUrl(item: SubjectItem): string {
  return item.cover?.url || "";
}

export function getGenres(item: SubjectItem): string[] {
  if (!item.genre) return [];
  return item.genre.split(",").map(g => g.trim());
}
