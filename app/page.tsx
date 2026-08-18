import GithubContributions from './components/GithubContributions'
import {
  getProjectCardImage,
  getReadmeDescription,
  getReadmeTechnologies,
} from './lib/project-images'
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

const githubHeaders = {
  Accept: 'application/vnd.github+json',
  ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
}

async function getGithubReadme(repository: GithubRepo) {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(repository.owner.login)}/${encodeURIComponent(repository.name)}/readme`,
      {
        next: { revalidate: 21600 },
        headers: {
          ...githubHeaders,
          Accept: 'application/vnd.github.raw+json',
        },
      },
    )

    return response.ok ? (await response.text()).slice(0, 12000) : ''
  } catch {
    return ''
  }
}

async function getGithubProjects(username: string): Promise<ProjectCard[]> {
  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=30&type=owner`,
      {
        next: { revalidate: 21600 },
        headers: githubHeaders,
      },
    )

    if (!response.ok) {
      return []
    }

    const repositories = (await response.json()) as GithubRepo[]

    const filtered = repositories
      .filter(
        (repository) =>
          !repository.fork &&
          !repository.archived &&
          repository.name.toLowerCase() !== username.toLowerCase() &&
          repository.name.toLowerCase() !== 'portfolio',
      )
      .slice(0, 6)

    return Promise.all(
      filtered.map(async (repository) => {
        const readme = await getGithubReadme(repository)
        const homepage = repository.homepage?.trim()
        const description =
          repository.description?.trim() ||
          getReadmeDescription(readme) ||
          'An open-source project from my GitHub profile. Visit the repository for the full build notes.'
        const tags = getReadmeTechnologies(readme, repository.language, repository.topics)
        const title = repository.name

        return {
          title,
          year: new Date(repository.pushed_at ?? repository.updated_at).getFullYear().toString(),
          description,
          tags: tags.length > 0 ? tags : ['Open Source', 'GitHub'],
          website: homepage ? normalizeUrl(homepage) : undefined,
          websiteLabel: homepage ? 'Website' : undefined,
          source: repository.html_url,
          image: getProjectCardImage({ title, name: repository.name, description, tags }),
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
  {
    company: 'MM Digital Garage',
    role: 'Full Stack Developer',
    period: 'Dec 2023 - May 2025',
    summary:
      'Built full-stack web applications and custom software solutions for clients across hospitality, healthcare, real estate, and enterprise sectors.',
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

const fallbackProjectDetails = [
  {
    title: 'Voice-assistant',
    year: '2026',
    description:
      'An intelligent multilingual voice receptionist for hotel guest services, live availability, and autonomous booking.',
    tags: ['Next.js', 'TypeScript', 'Google Gemini', 'Prisma'],
    website: 'https://staynepassistant.vercel.app/',
    websiteLabel: 'Website',
    source: 'https://github.com/prabin923/Voice-assistant',
  },
  {
    title: 'Film-studio-managment',
    year: '2026',
    description:
      'Operations software for wedding and film studios: client projects, expenses, payroll, gear inventory, rentals, and reports.',
    tags: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL'],
    website: 'https://film-studio-managment.vercel.app',
    websiteLabel: 'Website',
    source: 'https://github.com/prabin923/Film-studio-managment',
  },
  {
    title: 'studio-galleries',
    year: '2026',
    description:
      'A multi-tenant studio gallery platform with secure sharing, client favourites, and centralized Google Drive storage.',
    tags: ['Next.js', 'TypeScript', 'Prisma', 'Google Drive'],
    website: 'https://studio-galleries.vercel.app',
    websiteLabel: 'Website',
    source: 'https://github.com/prabin923/studio-galleries',
  },
  {
    title: 'Jeere-Website',
    year: '2026',
    description: 'A live website project built and maintained as part of my recent work.',
    tags: ['HTML', 'CSS', 'JavaScript'],
    website: 'https://jeere.vercel.app',
    websiteLabel: 'Website',
    source: 'https://github.com/prabin923/Jeere-Website',
  },
  {
    title: 'NEPGEOM-StayNEP',
    year: '2026',
    description:
      'A current TypeScript project from my StayNEP work, published and tracked through GitHub.',
    tags: ['TypeScript', 'Next.js', 'React'],
    website: 'https://nepgeom-stay-nep.vercel.app',
    websiteLabel: 'Website',
    source: 'https://github.com/prabin923/NEPGEOM-StayNEP',
  },
  {
    title: 'hearts-of-nepal',
    year: '2026',
    description:
      'A recent TypeScript project from my GitHub work, with its latest source and details available in the repository.',
    tags: ['TypeScript', 'React', 'GitHub'],
    source: 'https://github.com/prabin923/hearts-of-nepal',
  },
] satisfies Omit<ProjectCard, 'image'>[]

const fallbackProjects: ProjectCard[] = fallbackProjectDetails.map((project) => ({
  ...project,
  image: getProjectCardImage({
    name: project.title,
    title: project.title,
    description: project.description,
    tags: project.tags,
  }),
}))

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
          Latest GitHub projects, with README-powered summaries, technologies, and cover artwork.
        </p>
        <div className="projects-grid">
          {projectsToRender.map((project) => (
            <article key={project.title} className="project-card aceternity-card">
              <div className="project-image-wrapper">
                <img
                  src={project.image}
                  alt={project.title}
                  className="project-image"
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
