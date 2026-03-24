// Updated: March 24, 2026 - Full version with contacts
import { useState, useRef, useEffect } from "react";

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

async function callClaude(systemPrompt, userContent, maxTokens = 512) {
  try {
    const response = await fetch('https://smartchat-backend-4kan.onrender.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userContent, maxTokens }),
    });
    const data = await response.json();
    if (data.content) return data.content;
    return "Sorry, couldn't get a response.";
  } catch (error) {
    return "Oops! Can't connect to Python backend. Make sure it's running!";
  }
}

const CONTACTS = [
  { id: "u1", name: "Dr. Amara Osei", role: "lecturer", avatar: "AO", color: "#E8A838" },
  { id: "u2", name: "Liam Mwangi", role: "student", avatar: "LM", color: "#4FC3B0" },
  { id: "u3", name: "Priya Sharma", role: "student", avatar: "PS", color: "#A78BFA" },
];

const GROUPS = [
  { id: "g1", name: "CS301 – Data Structures", avatar: "DS", color: "#60A5FA", members: ["u1", "u2", "u3"] },
  { id: "g2", name: "Study Group Alpha", avatar: "SG", color: "#FBBF24", members: ["u2", "u3"] },
];

const SEED_MESSAGES = {
  u2: [
    { id: uid(), from: "u2", text: "Good morning Dr. Osei!", time: "09:12", type: "text" },
    { id: uid(), from: "me", text: "Good morning Liam! How can I help you?", time: "09:15", type: "text" },
  ],
  u1: [
    { id: uid(), from: "me", text: "Please review the lecture slides.", time: "08:00", type: "text" },
    { id: uid(), from: "u1", text: "Will do, Professor!", time: "08:05", type: "text" },
  ],
  u3: [
    { id: uid(), from: "u3", text: "Hi Dr. Osei, I have a question about the assignment.", time: "10:00", type: "text" },
    { id: uid(), from: "me", text: "Sure Priya, what's your question?", time: "10:02", type: "text" },
  ],
  g1: [
    { id: uid(), from: "u1", text: "Welcome to CS301! Please introduce yourselves.", time: "09:00", type: "text" },
    { id: uid(), from: "u2", text: "Hi everyone! I'm Liam.", time: "09:05", type: "text" },
    { id: uid(), from: "u3", text: "Hello! I'm Priya.", time: "09:06", type: "text" },
  ],
  g2: [
    { id: uid(), from: "u2", text: "Anyone want to study together today?", time: "14:00", type: "text" },
    { id: uid(), from: "u3", text: "I'm in! What time?", time: "14:05", type: "text" },
  ],
};

const ME = { id: "me", name: "You (Dr. Amara Osei)", role: "lecturer" };

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

function Bubble({ msg, contact, isMine, onAnalyze }) {
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
    <div style={{ display: "flex", flexDirection: isMine ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, marginBottom: 12 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}>
      {!isMine && <Avatar label={contact?.avatar ?? "?"} color={contact?.color ?? "#888"} size={32} />}
      <div style={{ maxWidth: "70%" }}>
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
        <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
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

export default function SmartChat() {
  const [active, setActive] = useState({ id: "u2", type: "dm" });
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [sideTab, setSideTab] = useState("dm");
  const bottomRef = useRef();

  const activeMessages = messages[active.id] ?? [];
  const activeContact = active.type === "dm" 
    ? CONTACTS.find(c => c.id === active.id) 
    : GROUPS.find(g => g.id === active.id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, active.id]);

  const send = (text) => {
    if (!text.trim()) return;
    const msg = { id: uid(), from: "me", text: text.trim(), time: now(), type: "text" };
    setMessages(prev => ({ ...prev, [active.id]: [...(prev[active.id] ?? []), msg] }));
    setInput("");
  };

  return (
    <div style={{ height: "100vh", display: "flex", background: "#080C12", fontFamily: "sans-serif", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{ width: 280, background: "#0D1117", borderRight: "1px solid #1E293B", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 20, borderBottom: "1px solid #1E293B" }}>
          <h2 style={{ color: "#E8A838", margin: 0 }}>SmartChat</h2>
          <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>Academic Messaging</p>
        </div>
        
        <div style={{ display: "flex", padding: "10px 12px", gap: 8 }}>
          <button onClick={() => setSideTab("dm")} style={{ flex: 1, padding: "8px", background: sideTab === "dm" ? "#E8A838" : "#161B22", color: sideTab === "dm" ? "#0F172A" : "#E2E8F0", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
            Direct
          </button>
          <button onClick={() => setSideTab("groups")} style={{ flex: 1, padding: "8px", background: sideTab === "groups" ? "#E8A838" : "#161B22", color: sideTab === "groups" ? "#0F172A" : "#E2E8F0", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
            Groups
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {sideTab === "dm" && CONTACTS.map(c => {
            const isActive = active.id === c.id && active.type === "dm";
            const lastMsg = messages[c.id]?.[messages[c.id].length - 1];
            return (
              <div key={c.id} onClick={() => setActive({ id: c.id, type: "dm" })} style={{ 
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", 
                background: isActive ? "#1E293B" : "transparent", cursor: "pointer",
                borderLeft: isActive ? "3px solid #E8A838" : "3px solid transparent"
              }}>
                <Avatar label={c.avatar} color={c.color} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#E2E8F0" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{c.role === "lecturer" ? "Lecturer" : "Student"}</div>
                  {lastMsg && <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{lastMsg.text.substring(0, 30)}</div>}
                </div>
              </div>
            );
          })}
          
          {sideTab === "groups" && GROUPS.map(g => {
            const isActive = active.id === g.id && active.type === "group";
            return (
              <div key={g.id} onClick={() => setActive({ id: g.id, type: "group" })} style={{ 
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", 
                background: isActive ? "#1E293B" : "transparent", cursor: "pointer",
                borderLeft: isActive ? "3px solid #E8A838" : "3px solid transparent"
              }}>
                <Avatar label={g.avatar} color={g.color} size={40} />
                <div>
                  <div style={{ fontWeight: 600, color: "#E2E8F0" }}>{g.name}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{g.members.length} members</div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1E293B", background: "#0D1117", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ color: "#F8FAFC", margin: 0 }}>{activeContact?.name ?? "—"}</h3>
            <p style={{ fontSize: 12, color: "#64748B", margin: "4px 0 0" }}>
              {active.type === "group" ? `${activeContact?.members?.length} members` : (activeContact?.role === "lecturer" ? "Lecturer" : "Student")}
            </p>
          </div>
          <button onClick={() => setShowAI(!showAI)} style={{ 
            background: showAI ? "#E8A838" : "#161B22", color: showAI ? "#0F172A" : "#E8A838",
            border: "1px solid #E8A838", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600
          }}>
            ✦ AI Tools
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {activeMessages.map(msg => {
            const contact = active.type === "dm" 
              ? CONTACTS.find(c => c.id === msg.from) 
              : CONTACTS.find(c => c.id === msg.from) || { name: "Unknown", avatar: "?", color: "#888" };
            return <Bubble key={msg.id} msg={msg} contact={contact} isMine={msg.from === "me"} onAnalyze={() => setShowAI(true)} />;
          })}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid #1E293B", background: "#0D1117", display: "flex", gap: 12 }}>
          <textarea 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} 
            placeholder="Type a message..." 
            rows={1} 
            style={{ flex: 1, background: "#161B22", border: "1px solid #2D3748", borderRadius: 20, color: "#E2E8F0", padding: "12px 16px", resize: "none", fontFamily: "sans-serif", fontSize: 14 }}
          />
          <button onClick={() => send(input)} disabled={!input.trim()} style={{ background: "#E8A838", border: "none", borderRadius: 20, width: 44, height: 44, fontSize: 18, cursor: "pointer" }}>
            ➤
          </button>
        </div>

        {showAI && <AIPanel messages={activeMessages} onClose={() => setShowAI(false)} />}
      </main>
    </div>
  );
}