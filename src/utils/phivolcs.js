export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://earthquake.phivolcs.dost.gov.ph/",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    const html = await response.text();

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.status(200).send(html);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
}