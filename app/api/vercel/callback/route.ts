import { NextRequest, NextResponse } from 'next/server'

type TokenResponse = {
  access_token?: string
  token_type?: string
  team_id?: string
}

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

export async function GET(request: NextRequest) {
  const clientId = process.env.VERCEL_CLIENT_ID
  const clientSecret = process.env.VERCEL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/?vercel=missing_oauth_config', getAppBaseUrl(request.url)),
    )
  }

  const url = new URL(request.url)
  const state = url.searchParams.get('state')
  const code = url.searchParams.get('code')

  const response = NextResponse.redirect(new URL('/?vercel=connected', getAppBaseUrl(request.url)))
  const cookieState = request.cookies.get('vercel_oauth_state')?.value

  if (!state || !code || !cookieState || state !== cookieState) {
    return NextResponse.redirect(new URL('/?vercel=state_mismatch', getAppBaseUrl(request.url)))
  }

  const redirectUri = getRedirectUri(request.url)

  try {
    const tokenExchange = await fetch('https://api.vercel.com/v2/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenExchange.ok) {
      return NextResponse.redirect(new URL('/?vercel=token_error', getAppBaseUrl(request.url)))
    }

    const data = (await tokenExchange.json()) as TokenResponse
    if (!data.access_token) {
      return NextResponse.redirect(new URL('/?vercel=token_missing', getAppBaseUrl(request.url)))
    }

    response.cookies.set('vercel_access_token', data.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    if (data.team_id) {
      response.cookies.set('vercel_team_id', data.team_id, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      })
    }

    response.cookies.delete('vercel_oauth_state')
    return response
  } catch {
    return NextResponse.redirect(new URL('/?vercel=oauth_failed', getAppBaseUrl(request.url)))
  }
}
