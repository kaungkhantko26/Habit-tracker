interface AvatarProfileLinks {
  avatar_url?: string | null;
  github_url?: string | null;
  instagram_url?: string | null;
  website_url?: string | null;
  x_url?: string | null;
}

const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg"];

function normalizeUrl(value?: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function parseUrl(value?: string | null) {
  const normalized = normalizeUrl(value);

  if (!normalized) {
    return null;
  }

  try {
    return new URL(normalized);
  } catch {
    return null;
  }
}

function isDirectImageUrl(value: string) {
  try {
    const url = new URL(value);
    return imageExtensions.some((extension) => url.pathname.toLowerCase().endsWith(extension));
  } catch {
    return false;
  }
}

function getUsernameForHosts(value: string | null | undefined, hosts: string[]) {
  const url = parseUrl(value);
  if (!url) {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  if (!hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
    return null;
  }

  return url.pathname.split("/").filter(Boolean)[0] ?? null;
}

function getHostname(value?: string | null) {
  return parseUrl(value)?.hostname ?? null;
}

function pushCandidate(target: string[], value?: string | null) {
  const normalized = normalizeUrl(value);

  if (!normalized || target.includes(normalized)) {
    return;
  }

  target.push(normalized);
}

export function getProfileAvatarCandidates(links: AvatarProfileLinks) {
  const candidates: string[] = [];
  const directAvatar = normalizeUrl(links.avatar_url);

  if (directAvatar && isDirectImageUrl(directAvatar)) {
    candidates.push(directAvatar);
  }

  const githubUsername = getUsernameForHosts(links.github_url ?? links.avatar_url, ["github.com"]);
  if (githubUsername) {
    pushCandidate(candidates, `https://github.com/${githubUsername}.png?size=256`);
  }

  const xUsername = getUsernameForHosts(links.x_url, ["x.com", "twitter.com"]);
  if (xUsername) {
    pushCandidate(candidates, `https://unavatar.io/x/${xUsername}?fallback=false`);
  }

  const instagramUsername = getUsernameForHosts(links.instagram_url, ["instagram.com"]);
  if (instagramUsername) {
    pushCandidate(candidates, `https://unavatar.io/instagram/${instagramUsername}?fallback=false`);
  }

  const websiteHost = getHostname(links.website_url ?? links.avatar_url);
  if (websiteHost) {
    pushCandidate(candidates, `https://unavatar.io/${websiteHost}?fallback=false`);
  }

  if (directAvatar && !candidates.includes(directAvatar)) {
    candidates.push(directAvatar);
  }

  return candidates;
}
