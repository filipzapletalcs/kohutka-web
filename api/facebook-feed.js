export default async function handler(req, res) {
  const pageId = process.env.VITE_FACEBOOK_PAGE_ID || 'SKI.CENTRUM.KOHUTKA';
  const accessToken = process.env.VITE_FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!accessToken) {
    return res.status(500).json({ error: 'Facebook access token not configured' });
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time,full_picture,permalink_url&limit=5&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.error?.message || 'Facebook API error' });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch Facebook posts' });
  }
}
