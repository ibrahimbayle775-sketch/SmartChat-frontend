/* eslint-disable */
import { useState, useRef, useEffect } from "react";

// Helper functions
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// API call function with token
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log("✅ Adding token to request:", endpoint);
  } else {
    console.log("❌ No token found for:", endpoint);
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
    console.error("Claude error:", error);
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

// Message Bubble Component with multimedia support
function Bubble({ msg, contact, isMine }) {
  const [tone, setTone] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const detectTone = async () => {
    if (tone || msg.type !== "text") return;
    setDetecting(true);
    try {
      const result = await callClaude(
        "Describe the emotional tone in ONE word: Formal, Friendly, Urgent, Confused, Neutral, Anxious, or Appreciative.",
        msg.text, 30
      );
      setTone(result.trim());
    } catch (error) {
      console.error("Error detecting tone:", error);
      setTone("Error");
    }
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
          padding: msg.type === "image" ? "4px" : "10px 14px",
          fontSize: 14,
          wordWrap: "break-word"
        }}>
          {msg.type === "image" && (
            <img 
              src={msg.src} 
              alt="shared" 
              style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: "8px", cursor: "pointer" }}
              onClick={() => window.open(msg.src, "_blank")}
            />
          )}
          {msg.type === "file" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "24px" }}>📎</span>
              <a 
                href={msg.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: isMine ? "#0F172A" : "#60A5FA", textDecoration: "underline" }}
              >
                {msg.filename}
              </a>
            </div>
          )}
          {msg.type === "text" && msg.text}
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

  const transcript = messages.filter(m => m.type === "text").map(m => m.text).join("\n");

  const runSummary = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    try {
      const r = await callClaude("Summarize this conversation in 2-3 bullet points.", transcript, 300);
      setResult(r);
    } catch (error) {
      console.error("Error getting summary:", error);
      setResult("Error getting summary");
    }
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
          console.log("💾 Saving NEW token to localStorage");
          localStorage.setItem('token', result.token);
        }
        onLogin(result.user);
      }
    } catch (err) {
      console.error("Fetch error:", err);
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
  const [groups, setGroups] = useState([]);
  const [sideTab, setSideTab] = useState("dm");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [addingMember, setAddingMember] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const bottomRef = useRef();
  const pollingRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Fetch all users
  useEffect(() => {
    console.log("🔍 Fetching users...");
    const token = localStorage.getItem('token');
    if (!token) return;
    
    apiCall('/api/users')
      .then(async res => {
        const data = await res.json();
        if (res.ok && data.users) {
          console.log("✅ Found users:", data.users);
          setAllUsers(data.users);
        }
      })
      .catch(err => console.error("Fetch error:", err));
  }, []);

  // Fetch groups
  const fetchGroups = async () => {
    try {
      const res = await apiCall('/api/groups');
      const data = await res.json();
      if (data.groups) {
        setGroups(data.groups);
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  // Fetch group members
  const fetchGroupMembers = async (groupId) => {
    try {
      const res = await apiCall(`/api/groups/${groupId}/members`);
      const data = await res.json();
      if (data.members) {
        setGroupMembers(data.members);
      }
    } catch (err) {
      console.error("Error fetching group members:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  // Create group
  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);
    try {
      const res = await apiCall('/api/groups', {
        method: 'POST',
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc
        })
      });
      const data = await res.json();
      if (data.group) {
        setGroups([...groups, data.group]);
        setShowCreateGroup(false);
        setNewGroupName("");
        setNewGroupDesc("");
        alert("✅ Group created successfully!");
      }
    } catch (err) {
      console.error("Error creating group:", err);
      alert("Failed to create group");
    } finally {
      setCreatingGroup(false);
    }
  };

  // Add member to group
  const addMemberToGroup = async (groupId, userId, username) => {
    setAddingMember(true);
    try {
      const res = await apiCall(`/api/groups/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      if (data.message) {
        alert(`✅ ${username} added to group!`);
        fetchGroupMembers(groupId);
        // Refresh groups list for the added member
        fetchGroups();
        setShowAddMember(false);
      } else if (data.error) {
        alert(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error("Error adding member:", err);
      alert("Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  // File upload handlers
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const fileUrl = URL.createObjectURL(file);
      const msg = {
        id: uid(),
        from: "me",
        type: "file",
        filename: file.name,
        url: fileUrl,
        size: file.size,
        time: now()
      };
      setMessages(prev => ({ 
        ...prev, 
        [active.id]: [...(prev[active.id] ?? []), msg] 
      }));
    });
    e.target.value = "";
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const msg = {
          id: uid(),
          from: "me",
          type: "image",
          src: ev.target.result,
          filename: file.name,
          time: now()
        };
        setMessages(prev => ({ 
          ...prev, 
          [active.id]: [...(prev[active.id] ?? []), msg] 
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  // Load messages function
  const loadMessages = async (otherUserId) => {
    if (!otherUserId || !user) return;
    console.log("🔍 Loading messages with user:", otherUserId);

    try {
      const res = await apiCall(`/api/load-messages/${otherUserId}`);
      const data = await res.json();
      
      if (!data.messages) return;
      
      const formatted = data.messages.map(msg => ({
        id: msg.id,
        from: msg.sender === user.id.toString() ? "me" : msg.sender,
        text: msg.text,
        time: msg.timestamp || now(),
        type: "text"
      })).sort((a, b) => a.id - b.id);
      
      setMessages(prev => ({ ...prev, [otherUserId]: formatted }));
      console.log(`✅ Loaded ${formatted.length} messages for user ${otherUserId}`);
      
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  // Load messages when selected user changes
  useEffect(() => {
    if (active.id && user && active.type === "dm") {
      loadMessages(active.id);
    }
  }, [active.id, user]);

  // Poll for new messages every 2 seconds
  useEffect(() => {
    if (!active.id || !user || active.type !== "dm") return;
    
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

  // Send message function
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
      if (active.type === "dm") {
        await apiCall('/api/save-message', {
          method: 'POST',
          body: JSON.stringify({
            sender: user.id.toString(),
            receiver: active.id.toString(),
            text: text.trim()
          })
        });
        await loadMessages(active.id);
      } else if (active.type === "group") {
        const groupId = active.id.split('_')[1];
        await apiCall(`/api/groups/${groupId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ text: text.trim() })
        });
        const res = await apiCall(`/api/groups/${groupId}/messages`);
        const data = await res.json();
        if (data.messages) {
          const formatted = data.messages.map(msg => ({
            id: msg.id,
            from: msg.sender === user.id.toString() ? "me" : msg.sender,
            text: msg.text,
            time: msg.timestamp,
            type: "text"
          }));
          setMessages(prev => ({ ...prev, [active.id]: formatted }));
        }
      }
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
  const activeContact = active.type === "dm" 
    ? allUsers.find(u => u.id.toString() === active.id) 
    : active.type === "group" 
      ? groups.find(g => `group_${g.id}` === active.id)
      : null;
  const activeName = activeContact?.username || activeContact?.name || active.name || "Select a chat";

  return (
    <div style={{ height: "100vh", display: "flex", background: "#080C12", fontFamily: "sans-serif", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{ width: 280, background: "#0D1117", borderRight: "1px solid #1E293B", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: 20, borderBottom: "1px solid #1E293B" }}>
          <h2 style={{ color: "#E8A838", margin: 0 }}>SmartChat</h2>
          <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>Welcome, {user.username}!</p>
        </div>
        
        <div style={{ display: "flex", padding: "10px 12px", gap: 8 }}>
          <button 
            onClick={() => setSideTab("dm")} 
            style={{ 
              flex: 1, padding: "8px", 
              background: sideTab === "dm" ? "#E8A838" : "#161B22", 
              color: sideTab === "dm" ? "#0F172A" : "#E2E8F0", 
              border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 
            }}>
            Direct
          </button>
          <button 
            onClick={() => setSideTab("groups")} 
            style={{ 
              flex: 1, padding: "8px", 
              background: sideTab === "groups" ? "#E8A838" : "#161B22", 
              color: sideTab === "groups" ? "#0F172A" : "#E2E8F0", 
              border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 
            }}>
            Groups
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: "auto" }}>
          {sideTab === "dm" && (
            <>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #1E293B", marginBottom: "8px" }}>
                <div style={{ fontSize: "12px", color: "#64748B" }}>ALL REGISTERED USERS</div>
                <div style={{ fontSize: "10px", color: "#475569" }}>Click any user to start chatting</div>
              </div>
              
              {allUsers.filter(u => u.username !== user.username).map(otherUser => {
                const isActive = active.id === otherUser.id.toString() && active.type === "dm";
                const hasMessages = messages[otherUser.id.toString()] && messages[otherUser.id.toString()].length > 0;
                const lastMsg = hasMessages 
                  ? messages[otherUser.id.toString()][messages[otherUser.id.toString()].length - 1] 
                  : null;
                
                return (
                  <div 
                    key={otherUser.id} 
                    onClick={() => {
                      console.log(`🖱️ Clicked on user: ${otherUser.username} (ID: ${otherUser.id})`);
                      setActive({ id: otherUser.id.toString(), type: "dm", name: otherUser.username });
                      if (!messages[otherUser.id.toString()]) {
                        setMessages(prev => ({ ...prev, [otherUser.id.toString()]: [] }));
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
                        {lastMsg && lastMsg.type === "text" ? lastMsg.text.substring(0, 30) : "Click to start chatting"}
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
                  No other users yet. Share this app with friends to start chatting!
                </div>
              )}
            </>
          )}
          
          {sideTab === "groups" && (
            <>
              <div style={{ padding: "10px 16px" }}>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#E8A838",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  ➕ Create New Group
                </button>
              </div>
              
              {groups.map(g => {
                const isActive = active.id === `group_${g.id}` && active.type === "group";
                const hasMessages = messages[`group_${g.id}`] && messages[`group_${g.id}`].length > 0;
                const lastMsg = hasMessages ? messages[`group_${g.id}`][messages[`group_${g.id}`].length - 1] : null;
                
                return (
                  <div 
                    key={g.id} 
                    onClick={() => {
                      setActive({ id: `group_${g.id}`, type: "group", name: g.name });
                      if (!messages[`group_${g.id}`]) {
                        setMessages(prev => ({ ...prev, [`group_${g.id}`]: [] }));
                      }
                      fetchGroupMembers(g.id);
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
                    <Avatar label={g.name.substring(0,2).toUpperCase()} color="#60A5FA" size={40} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#E2E8F0" }}>{g.name}</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>
                        {lastMsg && lastMsg.type === "text" ? lastMsg.text.substring(0, 30) : `${g.members?.length || 0} members`}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {groups.length === 0 && (
                <div style={{ textAlign: "center", color: "#64748B", padding: "20px" }}>
                  No groups yet. Create one to start group chats!
                </div>
              )}
            </>
          )}
        </div>
        
        <button 
          onClick={handleLogout} 
          style={{ margin: "16px", padding: "10px", background: "#F87171", border: "none", borderRadius: 8, color: "#0F172A", cursor: "pointer", fontWeight: "bold" }}>
          Logout
        </button>
      </aside>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#0D1117",
          border: "1px solid #1E293B",
          borderRadius: "12px",
          padding: "24px",
          width: "320px",
          zIndex: 2000,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ color: "#E8A838", margin: 0 }}>Create New Group</h3>
            <button onClick={() => setShowCreateGroup(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}>✕</button>
          </div>
          
          <input
            type="text"
            placeholder="Group Name"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "12px",
              background: "#161B22",
              border: "1px solid #2D3748",
              borderRadius: "8px",
              color: "#E2E8F0"
            }}
          />
          
          <textarea
            placeholder="Description (optional)"
            value={newGroupDesc}
            onChange={e => setNewGroupDesc(e.target.value)}
            rows="3"
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "16px",
              background: "#161B22",
              border: "1px solid #2D3748",
              borderRadius: "8px",
              color: "#E2E8F0",
              resize: "none"
            }}
          />
          
          <button
            onClick={createGroup}
            disabled={creatingGroup || !newGroupName.trim()}
            style={{
              width: "100%",
              padding: "10px",
              background: "#E8A838",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              opacity: (creatingGroup || !newGroupName.trim()) ? 0.5 : 1
            }}
          >
            {creatingGroup ? "Creating..." : "Create Group"}
          </button>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#0D1117",
          border: "1px solid #1E293B",
          borderRadius: "12px",
          padding: "24px",
          width: "320px",
          zIndex: 2000,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ color: "#E8A838", margin: 0 }}>Add Members</h3>
            <button onClick={() => setShowAddMember(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }}>✕</button>
          </div>
          
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "8px" }}>Current Members:</div>
            {groupMembers.map(m => (
              <div key={m.id} style={{ padding: "4px 0", color: "#E2E8F0", fontSize: "13px" }}>
                👤 {m.username}
              </div>
            ))}
          </div>
          
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "8px" }}>Add New Member:</div>
            <select 
              onChange={(e) => {
                const userId = e.target.value;
                const userToAdd = allUsers.find(u => u.id.toString() === userId);
                if (userToAdd && userId) {
                  addMemberToGroup(parseInt(selectedGroupForMembers), parseInt(userId), userToAdd.username);
                }
              }}
              disabled={addingMember}
              style={{
                width: "100%",
                padding: "10px",
                background: "#161B22",
                border: "1px solid #2D3748",
                borderRadius: "8px",
                color: "#E2E8F0",
                cursor: "pointer"
              }}
            >
              <option value="">Select a user to add...</option>
              {allUsers.filter(u => u.username !== user.username && !groupMembers.some(m => m.id === u.id)).map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
            {allUsers.filter(u => u.username !== user.username && !groupMembers.some(m => m.id === u.id)).length === 0 && (
              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "8px" }}>
                No other users available to add
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowAddMember(false)}
            style={{
              width: "100%",
              padding: "10px",
              background: "#1E293B",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#E2E8F0"
            }}
          >
            Close
          </button>
        </div>
      )}

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
            {active.id && <p style={{ fontSize: 11, color: "#64748B", margin: "4px 0 0" }}>
              {active.type === "group" ? `${groupMembers.length} members` : "Online"}
            </p>}
          </div>
          <div>
            {active.type === "group" && active.id && (
              <button 
                onClick={() => {
                  const groupId = active.id.split('_')[1];
                  setSelectedGroupForMembers(groupId);
                  setShowAddMember(true);
                  fetchGroupMembers(groupId);
                }}
                style={{ 
                  background: "#161B22", 
                  color: "#E8A838", 
                  border: "1px solid #E8A838", 
                  borderRadius: 8, 
                  padding: "8px 12px", 
                  cursor: "pointer",
                  marginRight: "8px"
                }}
              >
                👥 Add Member
              </button>
            )}
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
              <p>Click a user from Direct or create a group to start chatting.</p>
            </div>
          ) : activeMessages.length === 0 ? (
            <div style={{ textAlign: "center", color: "#64748B", marginTop: "100px" }}>
              <p>No messages yet. Send a message to start the conversation!</p>
            </div>
          ) : (
            activeMessages.map(msg => {
              let contact;
              if (active.type === "dm") {
                if (msg.from === "me") {
                  contact = { name: "You", avatar: "ME", color: "#E8A838" };
                } else {
                  const otherUser = allUsers.find(u => u.id.toString() === msg.from);
                  contact = otherUser 
                    ? { name: otherUser.username, avatar: otherUser.username.substring(0,2).toUpperCase(), color: "#E8A838" }
                    : { name: msg.from, avatar: msg.from.substring(0,2).toUpperCase(), color: "#888" };
                }
              } else {
                if (msg.from === "me") {
                  contact = { name: "You", avatar: "ME", color: "#E8A838" };
                } else {
                  const userFromMsg = allUsers.find(u => u.id.toString() === msg.from);
                  contact = userFromMsg 
                    ? { name: userFromMsg.username, avatar: userFromMsg.username.substring(0,2).toUpperCase(), color: "#888" }
                    : { name: msg.from, avatar: msg.from.substring(0,2).toUpperCase(), color: "#888" };
                }
              }
              const isMine = msg.from === "me";
              return <Bubble key={msg.id} msg={msg} contact={contact} isMine={isMine} />;
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
          flexShrink: 0,
          alignItems: "flex-end"
        }}>
          <input 
            type="file" 
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileUpload}
            multiple
          />
          <input 
            type="file" 
            ref={imageInputRef}
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageUpload}
            multiple
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              background: "#161B22", 
              border: "1px solid #2D3748", 
              borderRadius: "20px", 
              width: "40px", 
              height: "40px",
              cursor: "pointer",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Upload file"
          >
            📎
          </button>
          
          <button 
            onClick={() => imageInputRef.current?.click()}
            style={{ 
              background: "#161B22", 
              border: "1px solid #2D3748", 
              borderRadius: "20px", 
              width: "40px", 
              height: "40px",
              cursor: "pointer",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Upload image"
          >
            🖼️
          </button>
          
          <textarea 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && active.id && active.type === "dm") { e.preventDefault(); send(input); } }} 
            placeholder={active.id && active.type === "dm" ? "Type a message..." : "Select a direct chat to message"}
            disabled={!active.id || active.type !== "dm"}
            rows={1} 
            style={{ flex: 1, background: "#161B22", border: "1px solid #2D3748", borderRadius: 20, color: "#E2E8F0", padding: "12px 16px", resize: "none", fontFamily: "sans-serif", fontSize: 14, opacity: (active.id && active.type === "dm") ? 1 : 0.5 }} 
          />
          <button onClick={() => send(input)} disabled={!input.trim() || !active.id || active.type !== "dm"} style={{ background: "#E8A838", border: "none", borderRadius: 20, width: 44, height: 44, fontSize: 18, cursor: "pointer", opacity: (!input.trim() || !active.id || active.type !== "dm") ? 0.5 : 1 }}>
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