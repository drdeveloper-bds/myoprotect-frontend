import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant. How can I help you?"
    }
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

    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Error connecting to server" }
      ]);
    }

    setInput("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.chatBox}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.message,
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "#DCF8C6" : "#fff"
            }}
          >
            {msg.content}
          </div>
        ))}
      </div>

      <div style={styles.inputArea}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <button style={styles.button} onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#ece5dd"
  },
  chatBox: {
    flex: 1,
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto"
  },
  message: {
    maxWidth: "70%",
    padding: "10px",
    margin: "5px",
    borderRadius: "10px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
  },
  inputArea: {
    display: "flex",
    padding: "10px",
    background: "#f0f0f0"
  },
  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "20px",
    border: "1px solid #ccc"
  },
  button: {
    marginLeft: "10px",
    padding: "10px 20px",
    borderRadius: "20px",
    background: "#25D366",
    color: "white",
    border: "none"
  }
};

export default App;