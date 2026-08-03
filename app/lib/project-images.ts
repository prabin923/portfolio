import { existsSync } from 'node:fs'
import { join } from 'node:path'

type ProjectCoverInput = {
  name: string
  title?: string
  description: string
  tags: string[]
}

const palettes = [
  { accent: '#8b5cf6', accentSoft: '#c4b5fd', glow: '#312e81' },
  { accent: '#06b6d4', accentSoft: '#67e8f9', glow: '#164e63' },
  { accent: '#f97316', accentSoft: '#fdba74', glow: '#7c2d12' },
  { accent: '#ec4899', accentSoft: '#f9a8d4', glow: '#831843' },
  { accent: '#22c55e', accentSoft: '#86efac', glow: '#14532d' },
  { accent: '#eab308', accentSoft: '#fde68a', glow: '#713f12' },
]

const knownTechnologies = [
  'Next.js',
  'React',
  'TypeScript',
  'JavaScript',
  'Python',
  'Node.js',
  'Prisma',
  'Postgres',
  'PostgreSQL',
  'Tailwind CSS',
  'OpenAI',
  'Google Gemini',
  'Docker',
  'HTML',
  'CSS',
]

const generatedProjectCovers: Record<string, string> = {
  'voice-assistant': '/project-covers/voice-assistant.png',
  'film-studio-managment': '/project-covers/film-studio-managment.png',
  'studio-galleries': '/project-covers/studio-galleries.png',
  'jeere-website': '/project-covers/jeere-website.png',
  'nepgeom-staynep': '/project-covers/nepgeom-staynep.png',
  'hearts-of-nepal': '/project-covers/hearts-of-nepal.png',
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

function cleanMarkdown(value: string) {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_~]/g, '')
    .replace(/\\([\\`*_{}\[\]()#+.!_-])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function isUsefulReadmeLine(line: string) {
  return (
    line.length > 24 &&
    !line.startsWith('#') &&
    !line.startsWith('![') &&
    !line.startsWith('|') &&
    !line.startsWith('```') &&
    !/^[-=]{3,}$/.test(line) &&
    !line.startsWith('http')
  )
}

function escapeXml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&apos;',
      '"': '&quot;',
    }

    return entities[character]
  })
}

function hash(value: string) {
  return [...value].reduce((result, character) => (result * 31 + character.charCodeAt(0)) >>> 0, 7)
}

function splitTitle(title: string) {
  const words = title.replace(/[-_]/g, ' ').split(/\s+/).filter(Boolean)
  const midpoint = Math.max(1, Math.ceil(words.length / 2))
  const firstLine = truncate(words.slice(0, midpoint).join(' '), 24)
  const secondLine = truncate(words.slice(midpoint).join(' '), 24)

  return secondLine ? [firstLine, secondLine] : [firstLine]
}

function splitDescription(description: string) {
  const words = truncate(description, 115).split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word
    if (nextLine.length > 58 && currentLine) {
      lines.push(currentLine)
      currentLine = word
      continue
    }

    currentLine = nextLine
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.slice(0, 2)
}

/** Returns the first reader-friendly description found in a repository README. */
export function getReadmeDescription(readme: string) {
  const lines = readme
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => cleanMarkdown(line.replace(/^>\s?/, '').replace(/^[-*+]\s+/, '')))

  const firstDescription = lines.find(isUsefulReadmeLine)
  return firstDescription ? truncate(firstDescription, 210) : null
}

/** Pulls a compact, de-duplicated technology set from the README and repository metadata. */
export function getReadmeTechnologies(
  readme: string,
  language: string | null,
  topics: string[] = [],
) {
  const source = `${readme}\n${topics.join(' ')}`.toLowerCase()
  const technologies = knownTechnologies.filter((technology) => source.includes(technology.toLowerCase()))

  return [...new Set([language, ...technologies, ...topics].filter(Boolean))].slice(0, 5) as string[]
}

/**
 * Creates a compact, self-contained SVG cover from README metadata. Keeping the image local to
 * the response avoids fragile third-party image URLs and lets every new repository have artwork.
 */
export function createReadmeProjectCover({
  name,
  title = name,
  description,
  tags,
}: ProjectCoverInput) {
  const palette = palettes[hash(name.toLowerCase()) % palettes.length]
  const titleLines = splitTitle(title)
  const safeDescriptionLines = splitDescription(description).map(escapeXml)
  const safeTags = tags.slice(0, 3).map((tag) => escapeXml(truncate(tag, 16)))
  const tagWidth = (tag: string) => Math.max(96, tag.length * 11 + 34)
  let tagOffset = 0
  const tagMarkup = safeTags
    .map((tag) => {
      const width = tagWidth(tag)
      const markup = `
        <rect x="${tagOffset}" y="0" width="${width}" height="38" rx="19" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.16"/>
        <text x="${tagOffset + 18}" y="25" fill="#f8fafc" font-family="Arial, sans-serif" font-size="15" font-weight="700">${tag}</text>`
      tagOffset += width + 10
      return markup
    })
    .join('')

  const safeTitleLines = titleLines.map(escapeXml)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="660" viewBox="0 0 1200 660" role="img" aria-label="${escapeXml(title)} project cover">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0b1020"/>
          <stop offset="1" stop-color="#07070d"/>
        </linearGradient>
        <radialGradient id="glow" cx="0" cy="0" r="1" gradientTransform="translate(1040 106) rotate(135) scale(490 420)">
          <stop offset="0" stop-color="${palette.accent}" stop-opacity="0.55"/>
          <stop offset="1" stop-color="${palette.glow}" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${palette.accentSoft}"/>
          <stop offset="1" stop-color="${palette.accent}"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="660" fill="url(#background)"/>
      <rect width="1200" height="660" fill="url(#glow)"/>
      <path d="M0 516C220 412 324 667 599 530C827 417 916 407 1200 495V660H0Z" fill="${palette.accent}" fill-opacity="0.09"/>
      <g transform="translate(68 68)">
        <rect width="276" height="42" rx="21" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.18"/>
        <circle cx="23" cy="21" r="6" fill="url(#accent)"/>
        <text x="40" y="27" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="1.8">README / GITHUB PROJECT</text>
        <text x="0" y="145" fill="#f8fafc" font-family="Arial, sans-serif" font-size="66" font-weight="800" letter-spacing="-2">${safeTitleLines[0]}</text>
        ${safeTitleLines[1] ? `<text x="0" y="218" fill="#f8fafc" font-family="Arial, sans-serif" font-size="66" font-weight="800" letter-spacing="-2">${safeTitleLines[1]}</text>` : ''}
        <rect x="0" y="${safeTitleLines[1] ? 256 : 183}" width="88" height="5" rx="2.5" fill="url(#accent)"/>
        <text x="0" y="${safeTitleLines[1] ? 302 : 229}" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="22">${safeDescriptionLines[0] ?? ''}</text>
        ${safeDescriptionLines[1] ? `<text x="0" y="${safeTitleLines[1] ? 334 : 261}" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="22">${safeDescriptionLines[1]}</text>` : ''}
        <g transform="translate(0 ${safeTitleLines[1] ? 360 : 287})">${tagMarkup}</g>
      </g>
      <g transform="translate(845 164) rotate(8)">
        <rect width="250" height="302" rx="28" fill="#0f172a" fill-opacity="0.76" stroke="#ffffff" stroke-opacity="0.19"/>
        <rect x="28" y="31" width="54" height="54" rx="16" fill="url(#accent)"/>
        <path d="M44 58h22M55 47v22" stroke="#0b1020" stroke-width="4" stroke-linecap="round"/>
        <rect x="28" y="118" width="149" height="12" rx="6" fill="#ffffff" fill-opacity="0.84"/>
        <rect x="28" y="146" width="194" height="10" rx="5" fill="#ffffff" fill-opacity="0.27"/>
        <rect x="28" y="169" width="167" height="10" rx="5" fill="#ffffff" fill-opacity="0.19"/>
        <rect x="28" y="221" width="194" height="1" fill="#ffffff" fill-opacity="0.17"/>
        <circle cx="38" cy="252" r="6" fill="${palette.accentSoft}"/>
        <rect x="53" y="246" width="112" height="12" rx="6" fill="#ffffff" fill-opacity="0.36"/>
      </g>
      <g transform="translate(1038 502)">
        <circle r="54" fill="${palette.accent}" fill-opacity="0.18"/>
        <circle r="30" fill="${palette.accent}" fill-opacity="0.32"/>
        <circle r="11" fill="${palette.accentSoft}"/>
      </g>
    </svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** Uses a tailored static image when one has been generated, with an SVG fallback for new repos. */
export function getProjectCardImage(input: ProjectCoverInput) {
  const generatedCover = generatedProjectCovers[input.name.toLowerCase()]

  if (generatedCover && existsSync(join(process.cwd(), 'public', generatedCover))) {
    return generatedCover
  }

  return createReadmeProjectCover(input)
}
