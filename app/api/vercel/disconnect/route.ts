import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/', request.url))
  response.cookies.delete('vercel_access_token')
  response.cookies.delete('vercel_team_id')
  response.cookies.delete('vercel_oauth_state')
  return response
}
