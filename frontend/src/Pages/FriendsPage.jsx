import { useEffect, useState } from "react";
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriendActivity,
  getFriendRequests,
  getFriends,
  removeFriend,
  searchUsers,
  sendFriendRequest,
} from "../services/api";
import "./FriendsPage.css";

export default function FriendsPage() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");

  const fetchFriendsData = async () => {
    const [friendsRes, requestsRes, activityRes] = await Promise.all([
      getFriends(),
      getFriendRequests(),
      getFriendActivity(),
    ]);

    if (!friendsRes?.success || !requestsRes?.success || !activityRes?.success) {
      setMessage("Unable to load friends right now.");
      setFriends([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setActivity([]);
      return false;
    }

    setFriends(friendsRes.data.friends || []);
    setIncomingRequests(requestsRes.data.incoming || []);
    setOutgoingRequests(requestsRes.data.outgoing || []);
    setActivity(activityRes.data.activity || []);
    return true;
  };

  useEffect(() => {
    let ignore = false;

    const loadInitialData = async () => {
      const [friendsRes, requestsRes, activityRes] = await Promise.all([
        getFriends(),
        getFriendRequests(),
        getFriendActivity(),
      ]);

      if (ignore) return;

      if (!friendsRes?.success || !requestsRes?.success || !activityRes?.success) {
        setMessage("Unable to load friends right now.");
        setFriends([]);
        setIncomingRequests([]);
        setOutgoingRequests([]);
        setActivity([]);
        setLoading(false);
        return;
      }

      setFriends(friendsRes.data.friends || []);
      setIncomingRequests(requestsRes.data.incoming || []);
      setOutgoingRequests(requestsRes.data.outgoing || []);
      setActivity(activityRes.data.activity || []);
      setLoading(false);
    };

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setMessage("");
    const response = await searchUsers(query.trim());
    setSearching(false);

    if (!response?.success) {
      setMessage(response?.error?.message || "Search failed.");
      setSearchResults([]);
      return;
    }

    setSearchResults(response.data.users || []);
  };

  const refreshSearch = async () => {
    if (!query.trim()) return;
    const response = await searchUsers(query.trim());
    if (response?.success) {
      setSearchResults(response.data.users || []);
    }
  };

  const handleSendRequest = async (recipientId) => {
    const response = await sendFriendRequest(recipientId);
    if (!response?.success) {
      setMessage(response?.error?.message || "Unable to send friend request.");
      return;
    }

    setMessage("Friend request sent.");
    setLoading(true);
    await fetchFriendsData();
    setLoading(false);
    await refreshSearch();
  };

  const handleAccept = async (friendshipId) => {
    const response = await acceptFriendRequest(friendshipId);
    if (!response?.success) {
      setMessage(response?.error?.message || "Unable to accept request.");
      return;
    }

    setMessage("Friend request accepted.");
    setLoading(true);
    await fetchFriendsData();
    setLoading(false);
    await refreshSearch();
  };

  const handleDecline = async (friendshipId) => {
    const response = await declineFriendRequest(friendshipId);
    if (!response?.success) {
      setMessage(response?.error?.message || "Unable to decline request.");
      return;
    }

    setMessage("Friend request declined.");
    setLoading(true);
    await fetchFriendsData();
    setLoading(false);
    await refreshSearch();
  };

  const handleRemove = async (friendshipId) => {
    const response = await removeFriend(friendshipId);
    if (!response?.success) {
      setMessage(response?.error?.message || "Unable to remove friend.");
      return;
    }

    setMessage("Friend removed.");
    setLoading(true);
    await fetchFriendsData();
    setLoading(false);
    await refreshSearch();
  };

  const renderRelationshipLabel = (relationship) => {
    if (!relationship) return "Not connected";
    if (relationship.status === "accepted") return "Already friends";
    if (relationship.direction === "incoming") return "Incoming request";
    if (relationship.direction === "outgoing") return "Request sent";
    return relationship.status;
  };

  return (
    <div className="page friends-page">
      <section className="friends-card">
        <h1 className="friends-header">Friends</h1>
      </section>

      <section className="friends-card">
        <h2 className="friends-section-title">Search Friends</h2>

        <form className="friends-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="friends-search-input"
            placeholder="Search by display name or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="friends-primary-btn" disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {message ? <p className="friends-message">{message}</p> : null}

        {searchResults.length > 0 ? (
          <div className="friends-stack">
            {searchResults.map((user) => (
              <div key={user.id} className="friends-row">
                <div>
                  <h3>{user.displayName}</h3>
                  <p>{user.email}</p>
                  <p>{renderRelationshipLabel(user.relationship)}</p>
                </div>

                {!user.relationship ? (
                  <button
                    type="button"
                    className="friends-primary-btn"
                    onClick={() => handleSendRequest(user.id)}
                  >
                    Add Friend
                  </button>
                ) : null}

                {user.relationship?.status === "pending" &&
                user.relationship.direction === "incoming" ? (
                  <div className="friends-action-group">
                    <button
                      type="button"
                      className="friends-primary-btn"
                      onClick={() => handleAccept(user.relationship.id)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="friends-secondary-btn"
                      onClick={() => handleDecline(user.relationship.id)}
                    >
                      Decline
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="friends-muted">Search results will appear here.</p>
        )}
      </section>

      <section className="friends-card">
        <h2 className="friends-section-title">Incoming Requests</h2>

        {loading ? (
          <p className="friends-muted">Loading...</p>
        ) : incomingRequests.length === 0 ? (
          <p className="friends-muted">No pending requests.</p>
        ) : (
          <div className="friends-stack">
            {incomingRequests.map((request) => (
              <div key={request.id} className="friends-row">
                <div>
                  <h3>{request.user.displayName}</h3>
                  <p>{request.user.email}</p>
                </div>

                <div className="friends-action-group">
                  <button
                    type="button"
                    className="friends-primary-btn"
                    onClick={() => handleAccept(request.id)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="friends-secondary-btn"
                    onClick={() => handleDecline(request.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="friends-card">
        <h2 className="friends-section-title">Outgoing Requests</h2>

        {loading ? (
          <p className="friends-muted">Loading...</p>
        ) : outgoingRequests.length === 0 ? (
          <p className="friends-muted">No outgoing requests.</p>
        ) : (
          <div className="friends-stack">
            {outgoingRequests.map((request) => (
              <div key={request.id} className="friends-row">
                <div>
                  <h3>{request.user.displayName}</h3>
                  <p>{request.user.email}</p>
                </div>
                <span className="friends-badge">Pending</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="friends-card">
        <h2 className="friends-section-title">Friend List</h2>

        {loading ? (
          <p className="friends-muted">Loading...</p>
        ) : friends.length === 0 ? (
          <p className="friends-muted">No friends added yet.</p>
        ) : (
          <div className="friends-stack">
            {friends.map((friend) => (
              <div key={friend.id} className="friends-row">
                <div>
                  <h3>{friend.user.displayName}</h3>
                  <p>{friend.user.email}</p>
                  <p>{friend.user.totalPoints} XP • {friend.user.currentStreak} day streak</p>
                </div>
                <button
                  type="button"
                  className="friends-secondary-btn"
                  onClick={() => handleRemove(friend.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="friends-card">
        <h2 className="friends-section-title">Recent Friend Activity</h2>

        {loading ? (
          <p className="friends-muted">Loading...</p>
        ) : activity.length === 0 ? (
          <p className="friends-muted">No friend activity yet.</p>
        ) : (
          <div className="friends-stack">
            {activity.map((item) => (
              <div key={item.id} className="friends-row">
                <div>
                  <h3>{item.displayName}</h3>
                  <p>{item.subject}</p>
                  <p>{item.durationMinutes} min • {item.pointsEarned} XP</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
