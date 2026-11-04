export type TitleType = "movie" | "series";

export type DownloadLink = {
  id: string;
  label: string;
  url: string;
  size?: number;
};

export type Episode = {
  id: string;
  number: number;
  title: string;
  image?: string;
  videoUrl?: string;
  links: DownloadLink[];
};

export type Title = {
  id: string;
  name: string;
  type: TitleType;
  year: number;
  language: string;
  genres: string[];
  description: string;
  poster: string;
  backdrop?: string;
  accent: string;
  featured: boolean;
  videoUrl?: string;
  links: DownloadLink[];
  episodes?: Episode[];
  createdAt: number;
  updatedAt: number;
};

export type DownloadStatus =
  | "queued"
  | "downloading"
  | "paused"
  | "complete"
  | "error"
  | "cancelled"
  | "external";

export type DownloadTask = {
  id: string;
  titleId: string;
  titleName: string;
  label: string;
  url: string;
  poster: string;
  status: DownloadStatus;
  received: number;
  total: number;
  error?: string;
  createdAt: number;
  completedAt?: number;
};

export type AdminSettings = {
  pin: string;
  concurrency: 1 | 2 | 3;
};

export type Toast = {
  id: number;
  title: string;
  message?: string;
  tone?: "default" | "error";
};

export type TitleRequestStatus = "pending" | "added" | "rejected";

export type TitleRequest = {
  id: string;
  name: string;
  type: "movie" | "series" | "unsure";
  year: string;
  note: string;
  requester: string;
  status: TitleRequestStatus;
  createdAt: number;
  resolvedAt?: number;
};
