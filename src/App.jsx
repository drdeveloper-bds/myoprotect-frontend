import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! How can I help you?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await axios.post(`${API_URL}/api/chat`, {
        message: input,
        sessionId: "user-1"
      });

      const botMsg = {
        role: "assistant",
        content: res.data.reply
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Server error. Try again." }
      ]);
    }

    setInput("");
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto" }}>
      <h2>Chat App</h2>

      <div style={{ border: "1px solid #ccc", padding: 10, minHeight: 300 }}>
        {messages.map((msg, i) => (
          <div key={i}>
            <b>{msg.role}:</b> {msg.content}
          </div>
        ))}
      </div>

      <input
        style={{ width: "80%", padding: 10 }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type message"
      />

      <button onClick={handleSend} style={{ padding: 10 }}>
        Send
      </button>
    </div>
  );
}

export default App;