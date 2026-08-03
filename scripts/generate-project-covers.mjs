import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

// Load GEMINI_API_KEY from .env.local
let apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  try {
    const envLocal = await readFile(join(rootDir, '.env.local'), 'utf-8')
    const match = envLocal.match(/^GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/m)
    if (match) apiKey = match[1]
  } catch {
    // .env.local not found — fall through
  }
}

if (!apiKey) {
  throw new Error(
    'GEMINI_API_KEY is required. Set it in .env.local or export it before running this script.',
  )
}

const outputDirectory = join(rootDir, 'public', 'project-covers')

// ──────────────────────────────────────────────────────────────────────────────
// Project definitions — prompts crafted from each repo's README content
// ──────────────────────────────────────────────────────────────────────────────

const projects = [
  {
    filename: 'voice-assistant.jpg',
    prompt: [
      'Create a premium, cinematic 16:9 wide cover illustration for a portfolio project card.',
      'The project is "StayNep AI Voice Receptionist" — an intelligent multilingual AI voice assistant for hotels.',
      'Key features: voice-to-voice chat with guests, autonomous hotel room booking, live room availability, 40+ language support, smart room alternatives, staff notifications, built with Next.js, Google Gemini AI, Prisma, and Azure Speech.',
      'Visual concept: A sleek modern hotel reception scene at night with a glowing AI voice waveform floating elegantly above a minimalist reception desk. Include subtle holographic booking calendar elements, floating language icons, and a warm welcoming atmosphere. The waveform should feel alive and intelligent.',
      'Style: Dark cinematic 3D render with glass and brushed-metal textures. Midnight blue and emerald accent colors. Premium product-design aesthetic.',
      'Constraints: NO people, NO text, NO letters, NO logos, NO watermarks, NO UI screenshots. Pure visual art.',
    ].join(' '),
  },
  {
    filename: 'film-studio-managment.jpg',
    prompt: [
      'Create a premium, cinematic 16:9 wide cover illustration for a portfolio project card.',
      'The project is "WedStudio OS" — an operations management app for wedding and film studios.',
      'Key features: client project tracking, expense management, payroll in NPR currency, gear inventory, rental bookings, monthly financial reports, Google OAuth, installable PWA. Built with Next.js 14, Prisma 7, PostgreSQL.',
      'Visual concept: An elegant creative production workspace with a professional cinema camera on a stabilizer, organized gear cases, a financial ledger represented as abstract floating data blocks, and a wedding bouquet subtly placed. The scene should feel organized, professional, and creative.',
      'Style: Cinematic product photography blended with polished 3D render. Deep charcoal background with warm amber studio lighting. Upscale and organized feel.',
      'Constraints: NO readable text, NO letters, NO logos, NO watermarks, NO UI screenshots. Pure visual art.',
    ].join(' '),
  },
  {
    filename: 'studio-galleries.jpg',
    prompt: [
      'Create a premium, cinematic 16:9 wide cover illustration for a portfolio project card.',
      'The project is "Studio Galleries" — a multi-tenant photo gallery platform for professional photography studios, modeled on wfolio.com.',
      'Key features: secure photo sharing with encrypted links, client favorites/selection with must-have and maybe labels, centralized Google Drive storage, resumable chunked uploads, HMAC-signed expiring image URLs, password-protected galleries. Built with Next.js 16, Prisma 7, Auth.js v5, Google Drive API.',
      'Visual concept: A sophisticated modern photography gallery space with beautifully framed abstract image placeholders on a sleek gallery wall, a soft projector glow casting light, a subtle heart-shaped light motif for favorites, and a secure lock icon made of light rays. Immersive museum-like space.',
      'Style: Gallery-quality architectural photography with soft 3D accents. Rich ink blue and soft lavender tones with clean museum lighting.',
      'Constraints: NO people, NO readable text, NO letters, NO logos, NO watermarks, NO UI screenshots. Pure visual art.',
    ].join(' '),
  },
  {
    filename: 'jeere-website.jpg',
    prompt: [
      'Create a premium, cinematic 16:9 wide cover illustration for a portfolio project card.',
      'The project is "Jeere Website" — a modern, responsive business website built with HTML, CSS, and JavaScript.',
      'Visual concept: A polished abstract hero visual representing modern web development. Sculptural translucent floating panels arranged in a dynamic composition, layered web surface elements suggesting responsive design, and a confident digital editorial feeling. Clean geometric shapes suggesting a well-crafted website layout.',
      'Style: Art-directed 3D digital design with a premium web agency aesthetic. Dark navy foundation with lively teal and coral light accents. Sophisticated depth and clean negative space.',
      'Constraints: NO readable text, NO letters, NO logos, NO watermarks, NO UI screenshots. Pure visual art.',
    ].join(' '),
  },
  {
    filename: 'nepgeom-staynep.jpg',
    prompt: [
      'Create a premium, cinematic 16:9 wide cover illustration for a portfolio project card.',
      'The project is "NEPGEOM StayNEP — Tourism Intelligence Network" — a GIS-powered smart tourism platform for Nepal.',
      'Key features: real-time hotel availability mapping, tourism analytics and discovery, safety monitoring for natural disasters and weather, emergency accommodation finder, occupancy intelligence, AI-powered tourism insights. Connects tourists, hotels, authorities, and emergency services through location intelligence. Built with Next.js, TypeScript, NextAuth, Prisma, PostgreSQL.',
      'Visual concept: A cinematic topographic raised-relief visualization of the Himalayan mountain range with luminous location markers for hotels and emergency points, subtle glowing routes connecting them, intelligent data flow currents streaming across the terrain, and a sense of connected travel infrastructure.',
      'Style: Premium data-art 3D terrain render with physically realistic contours. Oblique aerial view with sweeping mountain depth. Midnight indigo and glacier blue tones with a restrained warm beacon accent.',
      'Constraints: NO readable text, NO letters, NO logos, NO watermarks, NO UI screenshots, NOT a literal map UI. Pure visual art.',
    ].join(' '),
  },
  {
    filename: 'hearts-of-nepal.jpg',
    prompt: [
      'Create a premium, cinematic 16:9 wide cover illustration for a portfolio project card.',
      'The project is "Hearts of Nepal" — a community and social-impact project celebrating Nepal\'s culture and spirit.',
      'Visual concept: A soulful contemporary illustration of a handcrafted deep-red heart woven from fine Nepali textile-like threads, set naturally within a serene Himalayan valley at golden-hour dawn. Gentle threads of warm light connect outward from the heart symbolizing community and togetherness. Snow-capped mountains in the background.',
      'Style: Sophisticated editorial 3D illustration with tangible fabric texture and restrained visual poetry. Generous depth with an elegant central focal point. Deep navy shadows with warm sunrise red and gold tones — hopeful but not sentimental.',
      'Constraints: NO people, NO readable text, NO letters, NO logos, NO watermarks. Pure visual art.',
    ].join(' '),
  },
]

// ──────────────────────────────────────────────────────────────────────────────
// Gemini generateContent API — image generation via responseModalities
// ──────────────────────────────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-2.5-flash-image'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`

async function generateImage(prompt) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['image', 'text'],
      responseMimeType: 'text/plain',
    },
  }

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Gemini API error: ${response.status} — ${detail.slice(0, 600)}`)
  }

  const result = await response.json()

  // Walk through response parts to find inline image data
  const candidates = result.candidates ?? []
  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? []
    for (const part of parts) {
      if (part.inlineData?.data) {
        return {
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType ?? 'image/png',
        }
      }
    }
  }

  throw new Error('No image returned in Gemini response.')
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

await mkdir(outputDirectory, { recursive: true })

console.log(`\n🎨 Generating ${projects.length} project covers using Gemini…\n`)

for (const project of projects) {
  console.log(`⏳ Generating ${project.filename}…`)

  try {
    const image = await generateImage(project.prompt)
    const extension = image.mimeType.includes('png') ? 'png' : 'jpg'
    const finalFilename = project.filename.replace(/\.\w+$/, `.${extension}`)

    await writeFile(
      join(outputDirectory, finalFilename),
      Buffer.from(image.data, 'base64'),
    )

    console.log(`  ✅ Saved public/project-covers/${finalFilename}`)
  } catch (error) {
    console.error(`  ❌ Failed: ${error.message}`)
  }
}

console.log('\n🎉 Done!\n')
