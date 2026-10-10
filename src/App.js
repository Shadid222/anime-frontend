import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

export default function App() {
  const [anime, setAnime] = useState([]);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selected, setSelected] = useState(null);
  const [ep, setEp] = useState(0);

  useEffect(() => {
    fetchAnime();
    const token = localStorage.getItem('token');
    if (token) {
      const userData = JSON.parse(localStorage.getItem('user'));
      setUser(userData);
    }
  }, []);

  const fetchAnime = async () => {
    try {
      const res = await axios.get(`${API_URL}/anime`);
      setAnime(res.data);
    } catch (err) {
      console.error('Fetch failed:', err);
    }
  };

  const handleAuth = async (isRegister) => {
    try {
      const endpoint = isRegister ? '/register' : '/login';
      const res = await axios.post(`${API_URL}${endpoint}`, { email, password });
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setEmail('');
      setPassword('');
      setShowLogin(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Auth failed');
    }
  };

  const handleWatch = async (animeId, episode) => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    try {
      await axios.post(
        `${API_URL}/watch-history`,
        { animeId, episode },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      const a = anime.find(x => x._id === animeId);
      setSelected(a);
      setEp(episode - 1);
    } catch (err) {
      console.error('Watch failed:', err);
    }
  };

  const handlePremium = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/create-checkout`,
        { email: user.email },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      window.location.href = `https://checkout.stripe.com/pay/${res.data.sessionId}`;
    } catch (err) {
      alert('Subscription failed');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎬 AnimeFlax</h1>
        <div className="header-right">
          {user ? (
            <>
              <span>{user.email}</span>
              <button onClick={handlePremium} className="premium-btn">Premium</button>
              <button onClick={() => { localStorage.clear(); setUser(null); }}>Logout</button>
            </>
          ) : (
            <button onClick={() => setShowLogin(true)} className="login-btn">Login</button>
          )}
        </div>
      </header>

      {showLogin && (
        <div className="modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Login / Register</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={() => handleAuth(false)}>Login</button>
            <button onClick={() => handleAuth(true)}>Register</button>
          </div>
        </div>
      )}

      {!selected ? (
        <div className="container">
          <h2>All Anime</h2>
          <div className="grid">
            {anime.map(a => (
              <div key={a._id} className="card" onClick={() => setSelected(a)}>
                <img src={a.posterUrl || '/placeholder.png'} alt={a.title} />
                <h3>{a.title}</h3>
                <p>⭐ {a.rating}/10</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="player-container">
          <button onClick={() => setSelected(null)}>← Back</button>
          <h1>{selected.title}</h1>
          
          <video width="100%" controls style={{ marginBottom: '20px' }}>
            <source src={selected.episodes[ep]?.videoUrl} type="video/mp4" />
          </video>

          <div className="episodes">
            {selected.episodes.map((e, idx) => (
              <button
                key={idx}
                className={`ep-btn ${idx === ep ? 'active' : ''}`}
                onClick={() => {
                  setEp(idx);
                  handleWatch(selected._id, e.number);
                }}
              >
                Ep {e.number}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}