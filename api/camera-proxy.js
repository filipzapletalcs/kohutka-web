export default async function handler(req, res) {
  const { url } = req.query;

  if (!url || Array.isArray(url)) {
    res.status(400).send("Missing url");
    return;
  }

  let target;
  try {
    target = new URL(url);
  } catch {
    res.status(400).send("Invalid url");
    return;
  }

  // Only allow proxying our camera images from data.kohutka.ski
  if (
    target.protocol !== "http:" ||
    target.hostname !== "data.kohutka.ski" ||
    !target.pathname.startsWith("/snimky/")
  ) {
    res.status(400).send("Not allowed");
    return;
  }

  try {
    const upstream = await fetch(target.toString());

    if (!upstream.ok) {
      res.status(upstream.status).send("Upstream error");
      return;
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store");

    const arrayBuffer = await upstream.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("camera-proxy error", err);
    res.status(500).send("Proxy error");
  }
}

