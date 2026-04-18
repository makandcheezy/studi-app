// friend activity feed — shows recent completed sessions from friends (US-8)
import { useEffect, useState } from "react";
import { getFriendActivity } from "../services/api";

const LIMIT = 20;

function formatRelativeTime(startTime) {
  if (!startTime) return "";

  const then = new Date(startTime);
  const now = new Date();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThen = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const dayDiff = Math.round((startOfToday - startOfThen) / (1000 * 60 * 60 * 24));

  if (dayDiff === 1) return "yesterday";
  if (dayDiff < 7) return `${dayDiff} days ago`;

  return then.toLocaleDateString();
}

export default function FriendActivityFeed() {
  const [activity, setActivity] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadFirstPage = async () => {
      const response = await getFriendActivity(1, LIMIT);
      if (ignore) return;

      if (!response?.success) {
        setError(response?.error?.message || "Unable to load activity.");
        setActivity([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      setActivity(response.data.activity || []);
      setHasMore(Boolean(response.data.pagination?.hasMore));
      setPage(1);
      setLoading(false);
    };

    loadFirstPage();

    return () => {
      ignore = true;
    };
  }, []);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    const response = await getFriendActivity(nextPage, LIMIT);
    setLoadingMore(false);

    if (!response?.success) {
      setError(response?.error?.message || "Unable to load more activity.");
      return;
    }

    setActivity((prev) => [...prev, ...(response.data.activity || [])]);
    setHasMore(Boolean(response.data.pagination?.hasMore));
    setPage(nextPage);
  };

  if (loading) {
    return <p className="friends-muted">Loading...</p>;
  }

  if (error) {
    return <p className="friends-message">{error}</p>;
  }

  if (activity.length === 0) {
    return <p className="friends-muted">No friend activity yet.</p>;
  }

  return (
    <div className="friends-stack">
      {activity.map((item) => (
        <div key={item.id} className="friends-row">
          <div>
            <h3>{item.displayName}</h3>
            <p>Studied {item.subject}</p>
            <p>
              {item.durationMinutes} min • {item.pointsEarned} XP
            </p>
            <p className="friends-muted">{formatRelativeTime(item.startTime)}</p>
          </div>
        </div>
      ))}

      {hasMore ? (
        <button
          type="button"
          className="friends-secondary-btn"
          onClick={handleLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      ) : null}
    </div>
  );
}
