import { useState } from "react";

async function callClaude(systemPrompt, userContent, maxTokens = 512) {
  try {
    const response = await fetch('https://smartchat-backend-4kan.onrender.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userContent, maxTokens }),
    });
    const data = await response.json();
    if (data.content) return data.content;
    return "Sorry, no response";
  } catch (error) {
    return "Error connecting to backend";
  }
}

export default function SmartChat() {
  const [messages, setMessages] = useState([
    { id: 1, from: "other", text: "Good morning! How are you?", time: "09:12" },
    { id: 2, from: "me", text: "Good morning! I'm great!", time: "09:15" },
  ]);
  const [input, setInput] = useState("");
  const [tone, setTone] = useState(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg = { id: Date.now(), from: "me", text: input, time: new Date().toLocaleTimeString() };
    setMessages([...messages, newMsg]);
    setInput("");
  };

  const analyzeTone = async (text) => {
    const result = await callClaude("Describe the emotional tone in ONE word.", text, 30);
    setTone(result);
    setTimeout(() => setTone(null), 3000);
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#E8A838" }}>SmartChat</h1>
      
      <div style={{ border: "1px solid #ccc", height: 400, overflowY: "auto", padding: 10, marginBottom: 10 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ textAlign: msg.from === "me" ? "right" : "left", margin: 10 }}>
            <div style={{
              display: "inline-block",
              background: msg.from === "me" ? "#E8A838" : "#1E293B",
              color: msg.from === "me" ? "#0F172A" : "#E2E8F0",
              padding: "8px 12px",
              borderRadius: 12,
              maxWidth: "70%"
            }}>
              {msg.text}
            </div>
            <div style={{ fontSize: 10, color: "#666", marginTop: 4 }}>
              {msg.time}
              {msg.from !== "me" && (
                <button onClick={() => analyzeTone(msg.text)} style={{ marginLeft: 10, fontSize: 10 }}>
                  🎯 tone
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {tone && (
        <div style={{ background: "#1e3a5f", color: "#60A5FA", padding: 8, borderRadius: 8, marginBottom: 10, textAlign: "center" }}>
          Tone: {tone}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <button onClick={sendMessage} style={{ background: "#E8A838", border: "none", borderRadius: 8, padding: "0 20px", cursor: "pointer" }}>
          Send
        </button>
      </div>
    </div>
  );
}