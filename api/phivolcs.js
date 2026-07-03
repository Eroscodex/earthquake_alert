export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://earthquake.phivolcs.dost.gov.ph/",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "text/html",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`PHIVOLCS returned ${response.status}`)
    }

    const html = await response.text()

    res.setHeader("Cache-Control", "no-store")
    res.status(200).send(html)
  } catch (err) {
    res.status(500).json({
      error: err.message,
      cause: err.cause?.message || null,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    })
  }
}