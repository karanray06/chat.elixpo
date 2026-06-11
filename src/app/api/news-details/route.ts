import { getTodaysNewsDetails } from "@/lib/db";
import { createCachedGET } from "@/lib/api/cached-route";

export const runtime = "edge";

export const GET = createCachedGET({
  cacheKey: "news:details",
  fetcher: getTodaysNewsDetails,
  notFoundMessage: "No news details found",
  errorMessage: "Failed to fetch news details",
});
