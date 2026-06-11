import { getTodaysPodcast } from "@/lib/db";
import { createCachedGET } from "@/lib/api/cached-route";

export const runtime = "edge";

export const GET = createCachedGET({
  cacheKey: "podcast:latest",
  fetcher: getTodaysPodcast,
  notFoundMessage: "No podcast found",
  errorMessage: "Failed to fetch podcast",
});
