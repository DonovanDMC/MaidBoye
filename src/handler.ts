import { handleRequest as handleInteraction } from './bot'

export async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url)
  // return new Response(`request method: ${request.method}`)
  if (request.method === 'POST') return handleInteraction(request)
  else {
    if (pathname === '/invite')
      return Response.redirect(
        `https://discord.com/api/oauth2/authorize?client_id=${BOT_ID}&scope=applications.commands&redirect_uri=${encodeURIComponent(
          REDIRECT_URI,
        )}`,
      )
    else if (pathname === '/support')
      return Response.redirect('https://api.maid.gay/links/support')
    else return Response.redirect('https://lite.maid.gay/invite')
  }
}
