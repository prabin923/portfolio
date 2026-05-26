import GithubContributions from './components/GithubContributions'
import { resolveProjectImage } from './lib/project-images'
import type { IconType } from 'react-icons'
import {
  FaGithub,
  FaLinkedin,
  FaXTwitter,
  FaRegEnvelope,
  FaPhone,
  FaRegFileLines,
  FaGlobe,
  FaCalendar,
  FaLocationDot,
  FaGraduationCap,
} from 'react-icons/fa6'
import { SiNotion } from 'react-icons/si'

const githubUsername = process.env.NEXT_PUBLIC_GITHUB_USERNAME ?? 'prabin923'
const githubToken = process.env.GITHUB_TOKEN

type ProjectCard = {
  title: string
  year: string
  description: string
  tags: string[]
  source: string
  image: string
  website?: string
  websiteLabel?: string
  logoStyle?: boolean
}

type GithubRepo = {
  name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  topics?: string[]
  pushed_at: string | null
  updated_at: string
  owner: {
    login: string
    avatar_url: string
  }
  fork: boolean
  archived: boolean
}

const normalizeUrl = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `https://${url}`
}

async function getGithubProjects(username: string): Promise<ProjectCard[]> {
  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=8&type=owner`,
      {
        next: { revalidate: 900 },
        headers: {
          Accept: 'application/vnd.github+json',
          ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
        },
      },
    )

    if (!response.ok) {
      return []
    }

    const repositories = (await response.json()) as GithubRepo[]

    const filtered = repositories.filter(
      (repository) => !repository.fork && !repository.archived,
    )

    return Promise.all(
      filtered.map(async (repository) => {
        const homepage = repository.homepage?.trim()
        const tags = [repository.language, ...(repository.topics ?? [])]
          .filter(Boolean)
          .slice(0, 5) as string[]
        const visual = await resolveProjectImage(repository, username)

        return {
          title: repository.name,
          year: new Date(repository.pushed_at ?? repository.updated_at).getFullYear().toString(),
          description:
            repository.description ??
            'A project from my GitHub profile. Visit the repository for full details and updates.',
          tags: tags.length > 0 ? tags : ['Open Source', 'GitHub'],
          website: homepage ? normalizeUrl(homepage) : undefined,
          websiteLabel: homepage ? 'Website' : undefined,
          source: repository.html_url,
          image: visual.image,
          logoStyle: visual.logoStyle,
        }
      }),
    )
  } catch {
    return []
  }
}

const workExperience = [
  {
    company: 'StayNEP',
    role: 'Full Stack Developer',
    period: '2024 - Present',
    summary:
      'Built booking-focused product interfaces and helped improve the conversion journey for travel and hospitality users.',
  },
  {
    company: 'Infinity Creations',
    role: 'Frontend Developer',
    period: '2025 - Present',
    summary:
      'Developed modern websites and internal tools from concept to deployment with a strong focus on speed and user experience.',
  },
]

const skills = [
  { name: 'TypeScript', icon: 'https://cdn.simpleicons.org/typescript/f3f4f6' },
  { name: 'React', icon: 'https://cdn.simpleicons.org/react/f3f4f6' },
  { name: 'Next.js', icon: 'https://cdn.simpleicons.org/nextdotjs/f3f4f6' },
  { name: 'Node.js', icon: 'https://cdn.simpleicons.org/nodedotjs/f3f4f6' },
  { name: 'Express', icon: 'https://cdn.simpleicons.org/express/f3f4f6' },
  { name: 'Socket.io', icon: 'https://cdn.simpleicons.org/socketdotio/f3f4f6' },
  { name: 'WebRTC', icon: 'https://cdn.simpleicons.org/webrtc/f3f4f6' },
  { name: 'Redis', icon: 'https://cdn.simpleicons.org/redis/f3f4f6' },
  { name: 'Kafka', icon: 'https://cdn.simpleicons.org/apachekafka/f3f4f6' },
  { name: 'Hono', icon: 'https://cdn.simpleicons.org/hono/f3f4f6' },
  { name: 'Docker', icon: 'https://cdn.simpleicons.org/docker/f3f4f6' },
  { name: 'Git', icon: 'https://cdn.simpleicons.org/git/f3f4f6' },
  { name: 'CI/CD', icon: 'https://cdn.simpleicons.org/githubactions/f3f4f6' },
  { name: 'AWS', icon: 'https://cdn.simpleicons.org/amazonwebservices/f3f4f6' },
  { name: 'Turborepo', icon: 'https://cdn.simpleicons.org/turborepo/f3f4f6' },
  { name: 'Nginx', icon: 'https://cdn.simpleicons.org/nginx/f3f4f6' },
  { name: 'LangChain', icon: 'https://cdn.simpleicons.org/chainlink/f3f4f6' },
  { name: 'LangGraph', icon: 'https://cdn.simpleicons.org/graphql/f3f4f6' },
  { name: 'MongoDB', icon: 'https://cdn.simpleicons.org/mongodb/f3f4f6' },
  { name: 'Prisma', icon: 'https://cdn.simpleicons.org/prisma/f3f4f6' },
  { name: 'PostgreSQL', icon: 'https://cdn.simpleicons.org/postgresql/f3f4f6' },
  { name: 'Tailwind CSS', icon: 'https://cdn.simpleicons.org/tailwindcss/f3f4f6' },
]

const socialLinks = [
  { name: 'GitHub', href: `https://github.com/${githubUsername}`, icon: FaGithub },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/prabin-sharma/', icon: FaLinkedin },
  { name: 'X', href: 'https://x.com/', icon: FaXTwitter },
  {
    name: 'Email',
    href: 'https://mail.google.com/mail/?view=cm&fs=1&to=prabinsharma923@gmail.com',
    icon: FaRegEnvelope,
  },
  { name: 'Phone', href: 'tel:+9779826983391', icon: FaPhone },
  { name: 'Notion', href: 'https://www.notion.so/', icon: SiNotion },
] satisfies Array<{ name: string; href: string; icon: IconType }>

const fallbackProjects: ProjectCard[] = [
  {
    title: 'StayNEP',
    year: '2024',
    description:
      'A modern hotel booking and discovery platform focused on seamless search, transparent pricing, and conversion-friendly flow.',
    tags: ['React', 'TypeScript', 'Node.js', 'API Integration', 'Responsive UI'],
    website: 'https://staynep.com',
    source: 'https://github.com/prabin923',
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Voice Assistant',
    year: '2025',
    description:
      'An AI-powered voice assistant project that handles practical commands and automates day-to-day workflows through natural voice input.',
    tags: ['JavaScript', 'Speech Recognition', 'Automation', 'AI Integration', 'Node.js'],
    website: 'https://staynepassistant.vercel.app/',
    source: 'https://github.com/prabin923',
    image:
      'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Infinity Creations',
    year: '2026',
    description:
      'A cinematic portfolio and digital presence for a creative brand, focused on premium visuals, smooth storytelling, and performance.',
    tags: ['Next.js', 'Brand Design', 'Responsive UI', 'Animations', 'Vercel'],
    website: 'https://infinitycreations.vercel.app/',
    source: 'https://github.com/prabin923/infinitycreations',
    image:
      'https://infinitycreations.vercel.app/Infinity-White.png',
    logoStyle: true,
  },
  {
    title: 'Enflix',
    year: '2026',
    description:
      'A modern streaming-style web experience focused on clean UI, smooth browsing, and fast content discovery.',
    tags: ['React', 'TypeScript', 'UI Design', 'Responsive Layout', 'Vercel'],
    website: 'https://enflix.vercel.app',
    source: 'https://github.com/prabin923/enflix',
    image:
      '/enflix-logo.png',
    logoStyle: true,
  },
]

export default async function Home() {
  const githubProjects = await getGithubProjects(githubUsername)
  const projectsToRender = githubProjects.length > 0 ? githubProjects : fallbackProjects

  return (
    <main className="container">
      <header className="hero">
        <div className="hero-top">
          <div>
            <p className="brand">Prabin</p>
            <h1>Full Stack developer.</h1>
            <p className="subtitle">
              I code like I mean it-fast, focused and built to last.
            </p>
            <div className="links">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                  aria-label={link.name}
                >
                  <link.icon aria-hidden="true" />
                </a>
              ))}
              <a className="resume-link" href="/resume.pdf" target="_blank" rel="noreferrer">
                <FaRegFileLines aria-hidden="true" />
                Resume
              </a>
            </div>
          </div>
          <div className="avatar" aria-hidden="true">
            PS
          </div>
        </div>
      </header>

      <section>
        <GithubContributions username={githubUsername} />
      </section>

      <section>
        <h2>About</h2>
        <p className="about-copy">
          A Full Stack Developer, always tinkering with the latest tech. Experienced in building
          scalable, user friendly applications that solve real problems. These days, you&apos;ll
          find me deep in AI model integrations, building intelligent features that actually make
          sense. I build from zero. Whether it&apos;s frontend, backend, full-stack applications, or
          AI-powered experiences, I work across the entire development lifecycle. From UI/UX to
          deployment to user feedback, I care less about technology debates and more about
          delivering results that people love using.
        </p>
      </section>

      <section>
        <span className="projects-pill">Work Experience</span>
        <div className="list">
          {workExperience.map((work) => (
            <article key={work.company} className="card">
              <h3>{work.company}</h3>
              <p className="meta">
                {work.role} · {work.period}
              </p>
              <p>{work.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="education-section">
        <h2 className="education-title">Education</h2>
        <div className="education-card">
          <div>
            <h3 className="education-school">Sunway International College</h3>
            <p className="education-line">
              <FaGraduationCap aria-hidden="true" />
              Bsc(hons.) CSAI
            </p>
            <p className="education-line">
              <FaLocationDot aria-hidden="true" />
              Kathmandu,Nepal
            </p>
          </div>
          <span className="education-badge">
            <FaCalendar aria-hidden="true" /> 2025 - 2029
          </span>
        </div>
      </section>

      <section>
        <h2>Skills</h2>
        <div className="skills-grid">
          {skills.map((skill) => (
            <span key={skill.name} className="skill-pill">
              <img src={skill.icon} alt="" className="skill-icon" aria-hidden="true" />
              {skill.name}
            </span>
          ))}
        </div>
      </section>

      <section>
        <span className="projects-pill">My Projects</span>
        <h2 className="projects-heading">Check out my latest work</h2>
        <p className="section-copy">
          Live GitHub repositories from my latest work, refreshed automatically.
        </p>
        <div className="projects-grid">
          {projectsToRender.map((project) => (
            <article key={project.title} className="project-card aceternity-card">
              <div className="project-image-wrapper">
                <img
                  src={project.image}
                  alt={project.title}
                  className={`project-image${project.logoStyle ? ' project-image-logo' : ''}`}
                />
                <div className="project-overlay" aria-hidden="true">
                  <div className="project-overlay-body">
                    <h3>{project.title}</h3>
                    <p className="meta">{project.year}</p>
                    <p className="overlay-desc">{project.description}</p>
                    <div className="project-tags">
                      {project.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <div className="project-actions">
                      {project.website ? (
                        <a href={project.website} target="_blank" rel="noreferrer">
                          <FaGlobe aria-hidden="true" /> {project.websiteLabel}
                        </a>
                      ) : null}
                      <a href={project.source} target="_blank" rel="noreferrer">
                        <FaGithub aria-hidden="true" /> Source
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="project-body" aria-hidden="true">
                {/* Kept for progressive enhancement and accessibility fallback */}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="contact-section">
        <span className="contact-pill">Contact</span>
        <h2 className="contact-heading">Let&apos;s Connect</h2>
        <p className="contact-copy">
          I&apos;m currently looking for new opportunities, my inbox is always open. Whether you
          have a question or just want to say hi, I&apos;ll try my best to get back to you!{' '}
          <a href="https://x.com/" target="_blank" rel="noreferrer">
            Reach out on Twitter
          </a>{' '}
          or{' '}
          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=prabinsharma923@gmail.com"
            target="_blank"
            rel="noreferrer"
          >
            send me an email
          </a>
          .
        </p>
      </section>
    </main>
  )
}
