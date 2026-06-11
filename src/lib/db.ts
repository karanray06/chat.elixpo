import type { News, NewsDetails, Podcast, PodcastDetails } from "./types";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { D1Database } from "@cloudflare/workers-types";

async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext();
  return (env as any).DB;
}

export async function getTodaysNews(): Promise<News | null> {
  const db = await getDB();

  const statsRow = await db
    .prepare("SELECT data FROM gen_stats WHERE key = ?")
    .bind("news")
    .first<{ data: string }>();

  if (!statsRow) return null;

  let stats: NewsDetails;
  try {
    stats = JSON.parse(statsRow.data);
  } catch (err) {
    console.error("Malformed news stats JSON:", err);
    return null;
  }

  const newsRow = await db
    .prepare("SELECT id, items FROM news WHERE id = ?")
    .bind(stats.latestNewsId)
    .first<{ id: string; items: string }>();

  if (!newsRow) return null;

  try {
    return { id: newsRow.id, items: JSON.parse(newsRow.items) };
  } catch (err) {
    console.error("Malformed news items JSON:", err);
    return null;
  }
}

export async function getTodaysNewsDetails(): Promise<NewsDetails | null> {
  const db = await getDB();

  const row = await db
    .prepare("SELECT data FROM gen_stats WHERE key = ?")
    .bind("news")
    .first<{ data: string }>();

  if (!row) return null;

  try {
    return JSON.parse(row.data);
  } catch (err) {
    console.error("Malformed news details JSON:", err);
    return null;
  }
}

export async function getTodaysPodcast(): Promise<Podcast | null> {
  const db = await getDB();

  const statsRow = await db
    .prepare("SELECT data FROM gen_stats WHERE key = ?")
    .bind("podcast")
    .first<{ data: string }>();

  if (!statsRow) return null;

  let stats: PodcastDetails;
  try {
    stats = JSON.parse(statsRow.data);
  } catch (err) {
    console.error("Malformed podcast stats JSON:", err);
    return null;
  }

  const podcastRow = await db
    .prepare(
      "SELECT id, podcast_name, podcast_audio_url, podcast_music_url, podcast_transcript_url, podcast_thumbnail_url, podcast_banner_url, topic_source FROM podcasts WHERE id = ?"
    )
    .bind(stats.latestPodcastID)
    .first<Podcast>();

  return podcastRow || null;
}

export async function getTodaysPodcastDetails(): Promise<PodcastDetails | null> {
  const db = await getDB();

  const row = await db
    .prepare("SELECT data FROM gen_stats WHERE key = ?")
    .bind("podcast")
    .first<{ data: string }>();

  if (!row) return null;

  try {
    return JSON.parse(row.data);
  } catch (err) {
    console.error("Malformed podcast details JSON:", err);
    return null;
  }
}
