type RepoForImage = {
  name: string
  homepage: string | null
  language: string | null
  topics?: string[]
  owner: { login: string }
}

type ProjectVisual = {
  image: string
  logoStyle?: boolean
}

const normalizeUrl = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `https://${url}`
}

const hostnameImages: Record<string, ProjectVisual> = {
  'staynep.com': {
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  },
  'www.staynep.com': {
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  },
  'staynepassistant.vercel.app': {
    image:
      'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1200&q=80',
  },
  'infinitycreations.vercel.app': {
    image: 'https://infinitycreations.vercel.app/Infinity-White.png',
    logoStyle: true,
  },
  'enflix.vercel.app': {
    image: '/enflix-logo.png',
    logoStyle: true,
  },
  'portfolio-beryl-three-zm1jji1g7i.vercel.app': {
    image: '/portfolio-cover.png',
    logoStyle: true,
  },
  'film-studio-managment.vercel.app': {
    image: '/film-studio-management-cover.png',
  },
}

const repoNameImages: Record<string, ProjectVisual> = {
  enflix: { image: '/enflix-logo.png', logoStyle: true },
  infinitycreations: {
    image: 'https://infinitycreations.vercel.app/Infinity-White.png',
    logoStyle: true,
  },
  staynep: {
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  },
  portfolio: {
    image: '/portfolio-cover.png',
    logoStyle: true,
  },
  'film-studio-managment': {
    image: '/film-studio-management-cover.png',
  },
  // Prevent the “GitHub avatar card” style (from github social image fallback).
  'sms-spam-classifier': {
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
  },
  'content-discovery': {
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
  },
  'hand-cursor-detctor': {
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80',
  },
  agent: {
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
  },
}

function githubRepoSocialImage(owner: string, repo: string) {
  return `https://opengraph.githubassets.com/1/${owner}/${repo}`
}

function getHostnameOverride(homepage: string | null | undefined): ProjectVisual | null {
  if (!homepage?.trim()) {
    return null
  }

  try {
    const hostname = new URL(normalizeUrl(homepage.trim())).hostname.toLowerCase()
    return hostnameImages[hostname] ?? null
  } catch {
    return null
  }
}

function extractMetaImage(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }

  return null
}

async function fetchWebsitePreviewImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(6000),
      headers: {
        Accept: 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; PortfolioBot/1.0)',
      },
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()
    const metaImage = extractMetaImage(html)
    if (!metaImage) {
      return null
    }

    return new URL(metaImage, url).toString()
  } catch {
    return null
  }
}

async function fetchWebsiteScreenshot(url: string): Promise<string | null> {
  try {
    const endpoint = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`
    const response = await fetch(endpoint, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return null
    }

    const payload = (await response.json()) as {
      data?: { screenshot?: { url?: string } }
    }

    return payload.data?.screenshot?.url ?? null
  } catch {
    return null
  }
}

export async function resolveProjectImage(
  repo: RepoForImage,
  username: string,
): Promise<ProjectVisual> {
  const repoKey = repo.name.toLowerCase()
  if (repoNameImages[repoKey]) {
    return repoNameImages[repoKey]
  }

  const hostnameOverride = getHostnameOverride(repo.homepage)
  if (hostnameOverride) {
    return hostnameOverride
  }

  const homepage = repo.homepage?.trim()
  if (homepage) {
    const websiteUrl = normalizeUrl(homepage)
    const previewImage = await fetchWebsitePreviewImage(websiteUrl)
    if (previewImage) {
      return { image: previewImage }
    }

    const screenshot = await fetchWebsiteScreenshot(websiteUrl)
    if (screenshot) {
      return { image: screenshot }
    }
  }

  const owner = repo.owner.login || username
  return {
    image: githubRepoSocialImage(owner, repo.name),
  }
}
