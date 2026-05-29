import { useState, useEffect, useRef } from "react";
import axios from "../../lib/axiosInstance";
import Avatar from "react-avatar";
import { useNavigate } from "react-router-dom";
import "./Search.css";
import { BASE_URL } from "../../lib/config";

function Search({ onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // debounce — wait 400ms after user stops typing before hitting the API
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${BASE_URL}/api/user/search?query=${encodeURIComponent(query)}`,
          { withCredentials: true },
        );
        if (res.data.success) setResults(res.data.users);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    onClose?.();
  };

  return (
    <div className="search-panel">
      <h2 className="search-title">Search</h2>
      <span
        onClick={onClose}
        className="material-symbols-outlined search-icon cross"
      >
        close
      </span>
      <div className="search-input-wrap">
        <span className="material-symbols-outlined search-icon">search</span>
        <input
          type="text"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <span
            className="material-symbols-outlined search-clear"
            onClick={() => setQuery("")}
          >
            cancel
          </span>
        )}
      </div>

      <div className="search-divider" />

      <div className="search-results">
        {loading && <p className="search-status">Searching...</p>}

        {!loading && query && results.length === 0 && (
          <p className="search-status">No results for "{query}"</p>
        )}

        {!loading && !query && (
          <p className="search-status recent-label">Recent</p>
        )}

        {results.map((user) => (
          <div
            key={user._id}
            className="search-user-row"
            onClick={() => handleUserClick(user._id)}
          >
            <Avatar
              src={user.profilePicture}
              name={user.username}
              size="44"
              round={true}
            />
            <div className="search-user-info">
              <span className="search-username">{user.username}</span>
              <span className="search-bio">
                {user.bio || `${user.followers?.length || 0} followers`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Search;
