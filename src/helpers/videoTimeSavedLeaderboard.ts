export interface VideoTimeSavedEntry {
  id: string;
  title: string;
  url: string;
  savedSeconds: number;
  lastSavedAt: number;
}

export interface VideoTimeSavedIdentity {
  id: string;
  title: string;
  url: string;
}

export interface VideoTimeSavedPageContext {
  href: string;
  title: string;
}

const maxVideoLeaderboardEntries = 10;
const maxTitleLength = 120;
const maxUrlLength = 2048;

export function getCurrentVideoTimeSavedIdentity(
  context = getBrowserPageContext()
): VideoTimeSavedIdentity | undefined {
  if (!context) return undefined;

  let url: URL;
  try {
    url = new URL(context.href);
  } catch {
    return undefined;
  }

  const youtubeId = getYoutubeVideoId(url);
  const title = sanitizeVideoTitle(context.title, url.hostname);

  if (youtubeId) {
    return {
      id: `youtube:${youtubeId}`,
      title,
      url: `https://www.youtube.com/watch?v=${youtubeId}`,
    };
  }

  url.hash = "";
  return {
    id: `url:${url.toString()}`,
    title,
    url: url.toString().slice(0, maxUrlLength),
  };
}

export function updateVideoTimeSavedLeaderboard(
  previousEntries: readonly VideoTimeSavedEntry[] | undefined,
  identity: VideoTimeSavedIdentity | undefined,
  savedSecondsDelta: number,
  now = Date.now()
): VideoTimeSavedEntry[] {
  if (!identity || !Number.isFinite(savedSecondsDelta) || savedSecondsDelta <= 0) {
    return [...(previousEntries ?? [])];
  }

  const entriesById = new Map<string, VideoTimeSavedEntry>();
  for (const entry of previousEntries ?? []) {
    if (!entry.id || !Number.isFinite(entry.savedSeconds)) continue;
    entriesById.set(entry.id, {
      ...entry,
      savedSeconds: Math.max(0, entry.savedSeconds),
    });
  }

  const existing = entriesById.get(identity.id);
  entriesById.set(identity.id, {
    id: identity.id,
    title: truncate(identity.title, maxTitleLength),
    url: identity.url.slice(0, maxUrlLength),
    savedSeconds: (existing?.savedSeconds ?? 0) + savedSecondsDelta,
    lastSavedAt: now,
  });

  return [...entriesById.values()]
    .sort((a, b) => b.savedSeconds - a.savedSeconds || b.lastSavedAt - a.lastSavedAt)
    .slice(0, maxVideoLeaderboardEntries);
}

function getBrowserPageContext(): VideoTimeSavedPageContext | undefined {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return undefined;
  }
  return {
    href: window.location.href,
    title: document.title,
  };
}

function getYoutubeVideoId(url: URL): string | undefined {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    return url.searchParams.get("v") ?? undefined;
  }
  if (host === "youtu.be") {
    return url.pathname.split("/").find(Boolean);
  }
  return undefined;
}

function sanitizeVideoTitle(rawTitle: string, fallback: string): string {
  const title = rawTitle
    .replace(/\s+-\s+YouTube$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return truncate(title || fallback || "Untitled video", maxTitleLength);
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength - 1).trimEnd() + "…" : value;
}
