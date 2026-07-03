export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://earthquake.phivolcs.dost.gov.ph/EQLatest-Monthly/EQLatest.html',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'text/html',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    res.setHeader('Content-Type', 'text/html')
    res.status(200).send(html)
  } catch (err) {
    res.status(500).json({
      error: err.message,
      cause: err.cause?.message,
    })
  }
}