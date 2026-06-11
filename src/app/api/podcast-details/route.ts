import { getTodaysPodcastDetails } from "@/lib/db";
import { createCachedGET } from "@/lib/api/cached-route";

export const runtime = "edge";

export const GET = createCachedGET({
  cacheKey: "podcast:details",
  fetcher: getTodaysPodcastDetails,
  notFoundMessage: "No podcast details found",
  errorMessage: "Failed to fetch podcast details",
});
