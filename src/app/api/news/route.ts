import { getTodaysNews } from "@/lib/db";
import { createCachedGET } from "@/lib/api/cached-route";

export const runtime = "edge";

export const GET = createCachedGET({
  cacheKey: "news:latest",
  fetcher: getTodaysNews,
  notFoundMessage: "No news found",
  errorMessage: "Failed to fetch news",
});
