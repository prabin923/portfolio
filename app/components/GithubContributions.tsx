'use client'

import dynamic from 'next/dynamic'

const GitHubCalendar = dynamic(
  () => import('react-github-calendar').then((module) => module.GitHubCalendar),
  {
    ssr: false,
    loading: () => <p className="section-copy">Loading contributions...</p>,
  },
)

type GithubContributionsProps = {
  username: string
}

export default function GithubContributions({ username }: GithubContributionsProps) {
  return (
    <div className="github-calendar-wrapper">
      <GitHubCalendar
        username={username}
        blockSize={15}
        blockMargin={4}
        fontSize={14}
        theme={{
          dark: ['#0d1117', '#0f2d1c', '#1a5f3b', '#239a4a', '#39d353'],
          light: ['#0d1117', '#0f2d1c', '#1a5f3b', '#239a4a', '#39d353'],
        }}
        colorScheme="dark"
      />
    </div>
  )
}
