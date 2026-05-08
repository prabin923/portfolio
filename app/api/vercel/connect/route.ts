import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'

function getAppBaseUrl(requestUrl: string): string {
  const configured = process.env.APP_BASE_URL
  if (configured) {
    return configured
  }
  return new URL(requestUrl).origin
}

function getRedirectUri(requestUrl: string): string {
  const configured = process.env.VERCEL_OAUTH_REDIRECT_URI
  if (configured) {
    return configured
  }
  return `${getAppBaseUrl(requestUrl)}/api/vercel/callback`
}

export async function GET(request: Request) {
  const clientId = process.env.VERCEL_CLIENT_ID

  if (!clientId) {
    return NextResponse.redirect(new URL('/?vercel=missing_client_id', getAppBaseUrl(request.url)))
  }

  const state = randomUUID()
  const redirectUri = getRedirectUri(request.url)

  const authorizeUrl = new URL('https://vercel.com/oauth/authorize')
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('scope', 'projects.read deployments.read')
  authorizeUrl.searchParams.set('state', state)

  const response = NextResponse.redirect(authorizeUrl)
  response.cookies.set('vercel_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  })

  return response
}
