import { cookies } from 'next/headers'
import GithubContributions from './components/GithubContributions'
import type { IconType } from 'react-icons'
import {
  FaGithub,
  FaLinkedin,
  FaXTwitter,
  FaRegEnvelope,
  FaPhone,
  FaRegFileLines,
} from 'react-icons/fa6'
import { SiNotion } from 'react-icons/si'

type GithubRepo = {
  id: number
  name: string
  html_url: string
  description: string | null
  stargazers_count: number
  language: string | null
  updated_at: string
  fork: boolean
}

type VercelProject = {
  id: string
  name: string
  framework: string | null
  updatedAt: number
  latestDeployAt?: number
  latestDeployUrl?: string
  domains?: string[]
  link?: {
    repo?: string
  }
}

const githubUsername = process.env.NEXT_PUBLIC_GITHUB_USERNAME ?? 'prabin923'

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

async function getRepos(): Promise<GithubRepo[]> {
  try {
    const response = await fetch(
      `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=8`,
      {
        next: { revalidate: 3600 },
        headers: {
          Accept: 'application/vnd.github+json',
        },
      },
    )

    if (!response.ok) {
      return []
    }

    const repos = (await response.json()) as GithubRepo[]
    return repos.filter((repo) => !repo.fork)
  } catch {
    return []
  }
}

async function getVercelProjects(
  vercelToken: string | undefined,
  vercelTeamId: string | undefined,
): Promise<VercelProject[]> {
  if (!vercelToken) {
    return []
  }

  try {
    const query = new URLSearchParams({ limit: '6' })
    if (vercelTeamId) {
      query.set('teamId', vercelTeamId)
    }

    const response = await fetch(`https://api.vercel.com/v9/projects?${query.toString()}`, {
      next: { revalidate: 3600 },
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    })

    if (!response.ok) {
      return []
    }

    const data = (await response.json()) as { projects?: VercelProject[] }
    const projects = data.projects ?? []

    const projectsWithDeployments = await Promise.all(
      projects.map(async (project) => {
        try {
          const deployQuery = new URLSearchParams({
            projectId: project.id,
            limit: '1',
            state: 'READY',
          })
          if (vercelTeamId) {
            deployQuery.set('teamId', vercelTeamId)
          }

          const deployResponse = await fetch(
            `https://api.vercel.com/v6/deployments?${deployQuery.toString()}`,
            {
              next: { revalidate: 3600 },
              headers: {
                Authorization: `Bearer ${vercelToken}`,
              },
            },
          )

          if (!deployResponse.ok) {
            return project
          }

          const deployData = (await deployResponse.json()) as {
            deployments?: Array<{
              createdAt: number
              url?: string
            }>
          }
          const latest = deployData.deployments?.[0]

          return {
            ...project,
            latestDeployAt: latest?.createdAt,
            latestDeployUrl: latest?.url,
          }
        } catch {
          return project
        }
      }),
    )

    return projectsWithDeployments.sort(
      (a, b) => (b.latestDeployAt ?? b.updatedAt) - (a.latestDeployAt ?? a.updatedAt),
    )
  } catch {
    return []
  }
}

export default async function Home() {
  const cookieStore = await cookies()
  const oauthToken = cookieStore.get('vercel_access_token')?.value
  const oauthTeamId = cookieStore.get('vercel_team_id')?.value
  const vercelToken = oauthToken ?? process.env.VERCEL_TOKEN
  const vercelTeamId = oauthTeamId ?? process.env.VERCEL_TEAM_ID
  const hasOauthVercelConnection = Boolean(oauthToken)

  const repos = await getRepos()
  const vercelProjects = await getVercelProjects(vercelToken, vercelTeamId)

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
        <h2>Work Experience</h2>
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
        <h2>Latest Repositories</h2>
        <div className="list">
          {repos.length === 0 ? (
            <p className="section-copy">Unable to load repositories right now.</p>
          ) : (
            repos.map((repo) => (
              <article key={repo.id} className="card">
                <h3>
                  <a href={repo.html_url} target="_blank" rel="noreferrer">
                    {repo.name}
                  </a>
                </h3>
                <p className="meta">
                  {repo.language ?? 'Code'} · ★ {repo.stargazers_count}
                </p>
                <p>{repo.description ?? 'No description provided.'}</p>
              </article>
            ))
          )}
        </div>
      </section>

      <section>
        <h2>Recent Projects (Vercel)</h2>
        <div className="vercel-actions">
          {hasOauthVercelConnection ? (
            <a href="/api/vercel/disconnect">Disconnect Vercel</a>
          ) : (
            <a href="/api/vercel/connect">Connect Vercel</a>
          )}
        </div>
        <div className="list">
          {vercelProjects.length === 0 ? (
            <p className="section-copy">
              Connect Vercel OAuth or set `VERCEL_TOKEN` (and optional `VERCEL_TEAM_ID`) to load
              recent Vercel projects.
            </p>
          ) : (
            vercelProjects.map((project) => (
              <article key={project.id} className="card">
                <h3>{project.name}</h3>
                <p className="meta">
                  {project.framework ?? 'Framework not set'} · Updated{' '}
                  {new Date(project.latestDeployAt ?? project.updatedAt).toLocaleDateString()}
                </p>
                <p>
                  {project.domains?.[0] ? (
                    <a
                      href={`https://${project.domains[0]}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {project.domains[0]}
                    </a>
                  ) : project.latestDeployUrl ? (
                    <a
                      href={`https://${project.latestDeployUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {project.latestDeployUrl}
                    </a>
                  ) : (
                    'No production domain linked yet.'
                  )}
                </p>
                <p>{project.link?.repo ?? 'Repository link not connected on this Vercel project.'}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
