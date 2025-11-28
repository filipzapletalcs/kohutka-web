import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
  full_picture?: string;
  permalink_url: string;
}

const FacebookFeed = () => {
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchPosts = async (cursor?: string) => {
    try {
      const pageId = import.meta.env.VITE_FACEBOOK_PAGE_ID || '385566021470850';
      const token = import.meta.env.VITE_FACEBOOK_PAGE_ACCESS_TOKEN;

      let url = `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time,full_picture,permalink_url&limit=6&access_token=${token}`;
      if (cursor) {
        url += `&after=${cursor}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }
      const data = await response.json();

      if (cursor) {
        setPosts(prev => [...prev, ...(data.data || [])]);
      } else {
        setPosts(data.data || []);
      }

      setNextCursor(data.paging?.cursors?.after || null);
    } catch {
      setError('Nepodařilo se načíst příspěvky');
    }
  };

  useEffect(() => {
    fetchPosts().finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    await fetchPosts(nextCursor);
    setLoadingMore(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <section className="pb-8 bg-muted/20">
      <div className="container mx-auto max-w-7xl px-4 mb-12">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Novinky z Kohútky
          </h2>
          <p className="text-lg text-muted-foreground">
            Aktuální příspěvky a novinky z našeho Facebooku
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        )}

        {error && (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">{error}</p>
            <a
              href="https://www.facebook.com/SKI.CENTRUM.KOHUTKA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Navštivte náš Facebook
            </a>
          </Card>
        )}

        {!loading && !error && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.id} className="glass overflow-hidden border-white/20">
                {post.full_picture && (
                  <img
                    src={post.full_picture}
                    alt=""
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    {formatDate(post.created_time)}
                  </p>
                  {post.message && (
                    <p className="line-clamp-4 text-sm">
                      {post.message}
                    </p>
                  )}
                  <a
                    href={post.permalink_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-sm text-primary hover:underline"
                  >
                    Zobrazit na Facebooku
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          {nextCursor && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'Načítám...' : 'Načíst další příspěvky'}
            </button>
          )}
          <a
            href="https://www.facebook.com/SKI.CENTRUM.KOHUTKA"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Sledujte nás na Facebooku
          </a>
        </div>
      </div>
    </section>
  );
};

export default FacebookFeed;
