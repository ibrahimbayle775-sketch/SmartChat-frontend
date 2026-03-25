import { useState, useEffect } from "react";

// API calls with authentication
async function apiCall(endpoint, options = {}) {
  const response = await fetch(`https://smartchat-backend-4kan.onrender.com${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  return response.json();
}

// Login/Signup Component
function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const endpoint = isLogin ? '/api/login' : '/api/register';
    const data = isLogin ? { username, password } : { username, email, password };
    
    const result = await apiCall(endpoint, { method: 'POST', body: JSON.stringify(data) });
    
    if (result.error) {
      setError(result.error);
    } else {
      onLogin(result.user);
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: "#080C12",
      fontFamily: "sans-serif"
    }}>
      <div style={{
        background: "#0D1117",
        padding: "40px",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "400px",
        border: "1px solid #1E293B"
      }}>
        <h1 style={{ color: "#E8A838", marginBottom: "30px", textAlign: "center" }}>SmartChat</h1>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "12px",
              background: "#161B22",
              border: "1px solid #2D3748",
              borderRadius: "8px",
              color: "#E2E8F0",
              fontSize: "14px"
            }}
          />
          
          {!isLogin && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "12px",
                background: "#161B22",
                border: "1px solid #2D3748",
                borderRadius: "8px",
                color: "#E2E8F0",
                fontSize: "14px"
              }}
            />
          )}
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "20px",
              background: "#161B22",
              border: "1px solid #2D3748",
              borderRadius: "8px",
              color: "#E2E8F0",
              fontSize: "14px"
            }}
          />
          
          {error && <p style={{ color: "#F87171", marginBottom: "12px", fontSize: "14px" }}>{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: "#E8A838",
              border: "none",
              borderRadius: "8px",
              color: "#0F172A",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            {loading ? "Loading..." : (isLogin ? "Login" : "Sign Up")}
          </button>
        </form>
        
        <p style={{ textAlign: "center", marginTop: "20px", color: "#64748B" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            style={{ background: "none", border: "none", color: "#E8A838", cursor: "pointer" }}
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

// Main Chat Component (simplified for now)
function ChatApp({ user, onLogout }) {
  return (
    <div style={{ padding: "20px", textAlign: "center", color: "#E2E8F0" }}>
      <h1>Welcome, {user.username}!</h1>
      <p>Your chat app is ready. Add your full chat component here!</p>
      <button
        onClick={onLogout}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "#F87171",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        Logout
      </button>
    </div>
  );
}

// Main App
export default function SmartChat() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    fetch('https://smartchat-backend-4kan.onrender.com/api/me', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ color: "#E2E8F0", textAlign: "center", marginTop: "50px" }}>Loading...</div>;
  }

  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }

  return <ChatApp user={user} onLogout={() => setUser(null)} />;
}