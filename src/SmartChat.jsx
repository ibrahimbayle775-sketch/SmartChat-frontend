/* eslint-disable */
import { useState, useRef, useEffect } from "react";

// Helper functions
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`https://smartchat-backend-4kan.onrender.com${endpoint}`, {
    ...options,
    headers,
  });
  
  return response;
}

async function callClaude(systemPrompt, userContent, maxTokens = 512) {
  try {
    const response = await apiCall('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ systemPrompt, userContent, maxTokens }),
    });
    const data = await response.json();
    if (data.content) return data.content;
    return "Sorry, couldn't get a response.";
  } catch (error) {
    return "Oops! Can't connect to backend.";
  }
}

// Avatar Component
function Avatar({ label, color, size = 38 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: color + "22",
      border: `2px solid ${color}55`, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.35, fontWeight: 700,
      color: color, flexShrink: 0
    }}>
      {label}
    </div>
  );
}

// Message Bubble Component
function Bubble({ msg, contact, isMine }) {
  const [tone, setTone] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const detectTone = async () => {
    if (tone) return;
    setDetecting(true);
    const result = await callClaude(
      "Describe the emotional tone in ONE word: Formal, Friendly, Urgent, Confused, Neutral, Anxious, or Appreciative.",
      msg.text, 30
    );
    setTone(result.trim());
    setDetecting(false);
  };

  return (
    <div style={{ 
      marginBottom: "16px",
      clear: "both",
      overflow: "hidden"
    }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}>
      <div style={{ 
        float: isMine ? "right" : "left",
        maxWidth: "70%",
        clear: "both"
      }}>
        {!isMine && <span style={{ fontSize: 11, color: "#64748B", marginBottom: 2, display: "block" }}>{contact?.name}</span>}
        <div style={{
          background: isMine ? "#E8A838" : "#1E293B",
          color: isMine ? "#0F172A" : "#E2E8F0",
          borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          padding: "10px 14px",
          fontSize: 14,
          wordWrap: "break-word"
        }}>
          {msg.text}
        </div>
        <div style={{ 
          display: "flex", 
          gap: 8, 
          marginTop: 4, 
          alignItems: "center", 
          justifyContent: isMine ? "flex-end" : "flex-start",
          flexWrap: "wrap"
        }}>
          <span style={{ fontSize: 10, color: "#475569" }}>{msg.time}</span>
          {tone && <span style={{ fontSize: 10, background: "#1e3a5f", color: "#60A5FA", padding: "2px 8px", borderRadius: 20 }}>{tone}</span>}
          {showActions && msg.type === "text" && msg.from !== "me" && (
            <button onClick={detectTone} disabled={detecting}
              style={{ fontSize: 10, background: "#1E293B", color: "#60A5FA", border: "1px solid #334155", borderRadius: 10, padding: "2px 8px", cursor: "pointer" }}>
              {detecting ? "..." : "🎯 tone"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// AI Panel Component
function AIPanel({ messages, onClose }) {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const transcript = messages.map(m => m.text).join("\n");

  const runSummary = async () => {
    setLoading(true);
    const r = await callClaude("Summarize this conversation in 2-3 bullet points.", transcript, 300);
    setResult(r);
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 320, background: "#0D1117", borderLeft: "1px solid #1E293B", padding: 20, zIndex: 1000, overflowY: "auto" }}>
      <button onClick={onClose} style={{ float: "right", background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>✕</button>
      <h3 style={{ color: "#E8A838", marginTop: 0 }}>AI Assistant</h3>
      <button onClick={runSummary} disabled={loading} style={{ background: "#E8A838", border: "none", borderRadius: 8, padding: "10px", cursor: "pointer", width: "100%" }}>
        {loading ? "Loading..." : "Summarize Conversation"}
      </button>
      {result && <div style={{ marginTop: 20, background: "#161B22", padding: 12, borderRadius: 8, color: "#E2E8F0", whiteSpace: "pre-wrap" }}>{result}</div>}
    </div>
  );
}

// Login Component
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
    
    try {
      localStorage.removeItem('token');
      
      const response = await fetch(`https://smartchat-backend-4kan.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok || result.error) {
        setError(result.error || "Something went wrong");
      } else {
        if (result.token) {
          localStorage.setItem('token', result.token);
        }
        onLogin(result.user);
      }
    } catch (err) {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080C12" }}>
      <div style={{ background: "#0D1117", padding: "40px", borderRadius: "16px", width: "100%", maxWidth: "400px", border: "1px solid #1E293B" }}>
        <h1 style={{ color: "#E8A838", marginBottom: "30px", textAlign: "center" }}>SmartChat</h1>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required
            style={{ width: "100%", padding: "12px", marginBottom: "12px", background: "#161B22", border: "1px solid #2D3748", borderRadius: "8px", color: "#E2E8F0" }} 
          />
          {!isLogin && (
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
              style={{ width: "100%", padding: "12px", marginBottom: "12px", background: "#161B22", border: "1px solid #2D3748", borderRadius: "8px", color: "#E2E8F0" }} 
            />
          )}
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required
            style={{ width: "100%", padding: "12px", marginBottom: "20px", background: "#161B22", border: "1px solid #2D3748", borderRadius: "8px", color: "#E2E8F0" }} 
          />
          {error && <p style={{ color: "#F87171", marginBottom: "12px" }}>{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: "100%", padding: "12px", background: "#E8A838", border: "none", borderRadius: "8px", color: "#0F172A", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Loading..." : (isLogin ? "Login" : "Sign Up")}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: "20px", color: "#64748B" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(""); }} 
            style={{ background: "none", border: "none", color: "#E8A838", cursor: "pointer" }}>
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

// Main Chat Component
function ChatApp({ user, onLogout }) {
  const [active, setActive] = useState({ id: null, type: "dm", name: null });
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const bottomRef = useRef();
  const pollingRef = useRef(null);

  // Fetch all users
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    apiCall('/api/users')
      .then(async res => {
        const data = await res.json();
        if (res.ok && data.users) {
          setAllUsers(data.users);
        }
      })
      .catch(err => console.error("Fetch error:", err));
  }, []);

  // FIXED: loadMessages function - gets messages for the conversation
  const loadMessages = async (otherUserId) => {
    if (!otherUserId || !user) return;

    try {
      const response = await apiCall(`/api/load-messages/${otherUserId}`);
      const data = await response.json();

      if (!data.messages) return;

      const formattedMessages = data.messages.map(msg => ({
        id: msg.id,
        from: msg.sender === user.id.toString() ? "me" : otherUserId,
        text: msg.text,
        time: msg.timestamp,
        type: "text"
      }));

      formattedMessages.sort((a, b) => a.id - b.id);

      setMessages(prev => ({
        ...prev,
        [otherUserId]: formattedMessages
      }));

    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  // Load messages when selected user changes
  useEffect(() => {
    if (active.id && user) {
      loadMessages(active.id);
    }
  }, [active.id, user]);

  // Poll for new messages every 2 seconds
  useEffect(() => {
    if (!active.id || !user) return;
    
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    pollingRef.current = setInterval(() => {
      loadMessages(active.id);
    }, 2000);
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [active.id, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, active.id]);

  // FIXED: send function - saves message correctly
  const send = async (text) => {
    if (!text.trim() || !active.id) return;

    const msg = {
      id: uid(),
      from: "me",
      text: text.trim(),
      time: now(),
      type: "text"
    };

    setMessages(prev => ({
      ...prev,
      [active.id]: [...(prev[active.id] ?? []), msg]
    }));

    setInput("");

    try {
      await apiCall('/api/save-message', {
        method: 'POST',
        body: JSON.stringify({
          conversation_id: active.id,
          sender: user.id.toString(),
          text: text.trim()
        })
      });

      await loadMessages(active.id);

    } catch (err) {
      console.error("Error saving message:", err);
      setMessages(prev => ({
        ...prev,
        [active.id]: (prev[active.id] ?? []).filter(m => m.id !== msg.id)
      }));
    }
  };

  const handleLogout = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    localStorage.removeItem('token');
    onLogout();
  };

  const activeMessages = active.id ? (messages[active.id] ?? []) : [];
  const activeName = active.name || (allUsers.find(u => u.id.toString() === active.id)?.username) || "Select a chat";

  return (
    <div style={{ height: "100vh", display: "flex", background: "#080C12", fontFamily: "sans-serif", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{ width: 280, background: "#0D1117", borderRight: "1px solid #1E293B", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: 20, borderBottom: "1px solid #1E293B" }}>
          <h2 style={{ color: "#E8A838", margin: 0 }}>SmartChat</h2>
          <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>Welcome, {user.username}!</p>
        </div>
        
        <div style={{ padding: "0 16px", borderBottom: "1px solid #1E293B", marginBottom: "10px" }}>
          <h4 style={{ color: "#64748B", margin: "8px 0", fontSize: "12px" }}>ALL USERS</h4>
        </div>
        
        <div style={{ flex: 1, overflowY: "auto" }}>
          {allUsers.filter(u => u.username !== user.username).map(otherUser => {
            const isActive = active.id === otherUser.id.toString();
            const hasMessages = messages[otherUser.id] && messages[otherUser.id].length > 0;
            const lastMsg = hasMessages ? messages[otherUser.id][messages[otherUser.id].length - 1] : null;
            
            return (
              <div 
                key={otherUser.id} 
                onClick={() => {
                  setActive({ id: otherUser.id.toString(), type: "dm", name: otherUser.username });
                  if (!messages[otherUser.id]) {
                    setMessages(prev => ({ ...prev, [otherUser.id]: [] }));
                  }
                }}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 12, 
                  padding: "12px 16px", 
                  background: isActive ? "#1E293B" : "transparent", 
                  cursor: "pointer",
                  borderLeft: isActive ? "3px solid #E8A838" : "3px solid transparent"
                }}>
                <Avatar label={otherUser.username.substring(0,2).toUpperCase()} color="#E8A838" size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#E2E8F0" }}>{otherUser.username}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>
                    {lastMsg ? lastMsg.text.substring(0, 30) : "Click to start chatting"}
                  </div>
                </div>
                {!hasMessages && (
                  <span style={{ fontSize: 10, background: "#E8A838", color: "#0F172A", padding: "2px 6px", borderRadius: 10 }}>new</span>
                )}
              </div>
            );
          })}
          {allUsers.filter(u => u.username !== user.username).length === 0 && (
            <div style={{ textAlign: "center", color: "#64748B", padding: "20px" }}>
              No other users yet. Create another account in a different browser!
            </div>
          )}
        </div>
        
        <button 
          onClick={handleLogout} 
          style={{ margin: "16px", padding: "10px", background: "#F87171", border: "none", borderRadius: 8, color: "#0F172A", cursor: "pointer", fontWeight: "bold" }}>
          Logout
        </button>
      </aside>

      {/* Main Chat Area */}
      <main style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column",
        minHeight: 0,
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ 
          padding: "16px 20px", 
          borderBottom: "1px solid #1E293B", 
          background: "#0D1117", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          flexShrink: 0
        }}>
          <div>
            <h3 style={{ color: "#F8FAFC", margin: 0 }}>{activeName}</h3>
            {active.id && <p style={{ fontSize: 11, color: "#64748B", margin: "4px 0 0" }}>Online</p>}
          </div>
          <div>
            <button 
              onClick={() => active.id && loadMessages(active.id)} 
              style={{ background: "#161B22", color: "#E8A838", border: "1px solid #E8A838", borderRadius: 8, padding: "8px 12px", cursor: "pointer", marginRight: "8px" }}
              title="Refresh messages"
            >
              🔄
            </button>
            <button onClick={() => setShowAI(!showAI)} style={{ background: showAI ? "#E8A838" : "#161B22", color: showAI ? "#0F172A" : "#E8A838", border: "1px solid #E8A838", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>
              ✦ AI Tools
            </button>
          </div>
        </div>

        <div style={{ 
          flex: 1, 
          overflowY: "auto", 
          padding: "20px 24px",
          minHeight: 0,
          maxHeight: "100%",
          background: "#080C12"
        }}>
          {!active.id ? (
            <div style={{ textAlign: "center", color: "#64748B", marginTop: "100px" }}>
              <h2 style={{ color: "#E8A838" }}>Welcome to SmartChat!</h2>
              <p>Click any user from the sidebar to start chatting.</p>
            </div>
          ) : activeMessages.length === 0 ? (
            <div style={{ textAlign: "center", color: "#64748B", marginTop: "100px" }}>
              <p>No messages yet. Send a message to start the conversation!</p>
            </div>
          ) : (
            activeMessages.map(msg => {
              const isMine = msg.from === "me";
              const contactName = isMine ? "You" : activeName;
              const contactAvatar = isMine ? "ME" : activeName.substring(0,2).toUpperCase();
              return <Bubble key={msg.id} msg={msg} contact={{ name: contactName, avatar: contactAvatar, color: isMine ? "#E8A838" : "#4FC3B0" }} isMine={isMine} />;
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ 
          padding: "16px 20px", 
          borderTop: "1px solid #1E293B", 
          background: "#0D1117", 
          display: "flex", 
          gap: 12,
          flexShrink: 0
        }}>
          <textarea 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && active.id) { e.preventDefault(); send(input); } }} 
            placeholder={active.id ? "Type a message..." : "Select a user to start messaging"}
            disabled={!active.id}
            rows={1} 
            style={{ flex: 1, background: "#161B22", border: "1px solid #2D3748", borderRadius: 20, color: "#E2E8F0", padding: "12px 16px", resize: "none", fontFamily: "sans-serif", fontSize: 14, opacity: active.id ? 1 : 0.5 }} 
          />
          <button onClick={() => send(input)} disabled={!input.trim() || !active.id} style={{ background: "#E8A838", border: "none", borderRadius: 20, width: 44, height: 44, fontSize: 18, cursor: "pointer", opacity: (!input.trim() || !active.id) ? 0.5 : 1 }}>
            ➤
          </button>
        </div>

        {showAI && <AIPanel messages={activeMessages} onClose={() => setShowAI(false)} />}
      </main>
    </div>
  );
}

// Main App
export default function SmartChat() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      return;
    }
    
    apiCall('/api/me')
      .then(async res => {
        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: "#E2E8F0", textAlign: "center", marginTop: "50px" }}>Loading...</div>;
  if (!user) return <AuthPage onLogin={setUser} />;
  return <ChatApp user={user} onLogout={() => setUser(null)} />;
}