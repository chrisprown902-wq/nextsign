export interface NewsItem {
  id: string;
  title: string;
  source: string;
  summary: string;
  url?: string;
  heatScore: number;
  date: string;
  categories: string[];
}
