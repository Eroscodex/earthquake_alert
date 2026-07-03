export const config = {
  runtime: 'edge',
}

export default async function handler(request) {
  try {
    const response = await fetch(
      'https://earthquake.phivolcs.dost.gov.ph/',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'text/html',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      return new Response(`PHIVOLCS returned ${response.status}`, {
        status: response.status,
      })
    }

    const html = await response.text()

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}