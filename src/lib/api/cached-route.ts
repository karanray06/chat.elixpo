import { NextResponse } from "next/server";
import { getCached, setCache } from "@/lib/kv";

/**
 * Creates a GET handler that checks KV cache first, falls back to a DB
 * fetcher, then populates the cache before responding.
 *
 * Eliminates the identical try/cache/fetch/set/catch boilerplate duplicated
 * across the news, podcast, news-details, and podcast-details routes.
 */
export function createCachedGET<T>(opts: {
  cacheKey: string;
  fetcher: () => Promise<T | null>;
  notFoundMessage: string;
  errorMessage: string;
}) {
  return async function GET() {
    try {
      const cached = await getCached<T>(opts.cacheKey);
      if (cached) return NextResponse.json(cached);

      const data = await opts.fetcher();
      if (!data) return NextResponse.json({ error: opts.notFoundMessage }, { status: 404 });

      await setCache(opts.cacheKey, data);
      return NextResponse.json(data);
    } catch (error) {
      console.error(opts.errorMessage, error);
      return NextResponse.json({ error: opts.errorMessage }, { status: 500 });
    }
  };
}
