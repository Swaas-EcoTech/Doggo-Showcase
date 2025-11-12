import React, { useEffect, useState, useRef } from "react";
import "./App.css";

function parseBreedFromUrl(url) {
  try {
    const parts = new URL(url).pathname.split("/");
    const breedPart = parts.find(
      (p) => p && p !== "breeds" && !p.includes(".jpg") && !p.includes(".png")
    );
    if (!breedPart) return "Unknown";
    const bits = breedPart.split("-");
    if (bits.length === 1) {
      return bits[0]
        .split(/(?=[A-Z])|[^\w]/)
        .join(" ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    } else {
      const name = bits.reverse().join(" ");
      return name
        .split(" ")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");
    }
  } catch {
    return "Unknown";
  }
}

export default function App() {
  const [dogUrl, setDogUrl] = useState("");
  const [breed, setBreed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dog-favs") || "[]");
    } catch {
      return [];
    }
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const timerRef = useRef(null);

  async function fetchRandomDog() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://dog.ceo/api/breeds/image/random");
      if (!res.ok) throw new Error("Network response not OK");
      const data = await res.json();
      if (data.status !== "success") throw new Error("API error");
      setDogUrl(data.message);
      setBreed(parseBreedFromUrl(data.message));
    } catch (err) {
      setError("Could not fetch dog. Try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRandomDog();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        fetchRandomDog();
      }, 4000);
    }
    return () => clearInterval(timerRef.current);
  }, [autoRefresh]);

  function toggleFavorite() {
    if (!dogUrl) return;
    const exists = favorites.includes(dogUrl);
    const next = exists
      ? favorites.filter((x) => x !== dogUrl)
      : [dogUrl, ...favorites];
    setFavorites(next);
    localStorage.setItem("dog-favs", JSON.stringify(next));
  }

  function copyLink() {
    if (!dogUrl) return;
    navigator.clipboard?.writeText(dogUrl);
    alert("Image link copied to clipboard!");
  }

  function removeFav(url) {
    const next = favorites.filter((x) => x !== url);
    setFavorites(next);
    localStorage.setItem("dog-favs", JSON.stringify(next));
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>Dogg Gallery 🐶</h1>
          <p className="byline">
            A tiny project by <strong>Shyla Arora</strong>
          </p>
        </div>
        <div className="controls-top">
          <button className="btn" onClick={fetchRandomDog}>
            New Dog
          </button>
          <button
            className="btn outline"
            onClick={toggleFavorite}
            disabled={!dogUrl}
          >
            {favorites.includes(dogUrl)
              ? "★ Favorited"
              : "☆ Add to Favorites"}
          </button>
        </div>
      </header>

      <main className="main">
        <section className="viewer">
          {loading && <div className="loader">Loading dog...</div>}
          {error && <div className="error">{error}</div>}

          {dogUrl && !loading && (
            <div className="card">
              <div className="imgWrap">
                <img src={dogUrl} alt={`A ${breed}`} />
              </div>
              <div className="meta">
                <h2 className="breed">{breed}</h2>
                <div className="metaBtns">
                  <button className="btn" onClick={copyLink}>
                    Copy Link
                  </button>
                  <button className="btn outline" onClick={toggleFavorite}>
                    {favorites.includes(dogUrl) ? "Remove Fav" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="extras">
            <label className="switch">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span className="slider" />
            </label>
            <span className="small">Auto-refresh (slideshow)</span>
            <button
              className="btn ghost"
              onClick={() => {
                document.body.classList.toggle("vibe");
              }}
            >
              Change Vibe
            </button>
          </div>
        </section>

        <aside className="sidebar">
          <h3>Favorites</h3>
          {favorites.length === 0 && (
            <p className="small">No favorites yet — click "Save".</p>
          )}
          <div className="favGrid">
            {favorites.map((url) => (
              <div key={url} className="favCard">
                <img
                  src={url}
                  alt="fav dog"
                  onClick={() => {
                    setDogUrl(url);
                    setBreed(parseBreedFromUrl(url));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
                <div className="favActions">
                  <button
                    className="btn tiny"
                    onClick={() => {
                      setDogUrl(url);
                      setBreed(parseBreedFromUrl(url));
                    }}
                  >
                    Open
                  </button>
                  <button
                    className="btn tiny outline"
                    onClick={() => removeFav(url)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </main>

      <footer className="footer">
        <small>Made with ❤️ by Shyla</small>
      </footer>
    </div>
  );
}