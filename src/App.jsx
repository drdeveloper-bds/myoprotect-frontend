import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, Video, Phone, MoreVertical, 
  Smile, Paperclip, Camera, Mic, Send, CheckCheck 
} from 'lucide-react';
import './index.css';

const SESSION_ID = "session_" + Math.random().toString(36).substring(7);
const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hello! I'm your pediatric myopia assistant. I have Aarav's latest clinical data. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text = inputValue) => {
    if (!text.trim() && !uploadPreview) return;

    const displayMessage = uploadPreview
      ? `📎 ${uploadPreview.fileName}${text.trim() ? `\n${text}` : ''}`
      : text;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMessages = [...messages, { role: 'user', content: displayMessage, time: timeString }];
    setMessages(newMessages);
    setInputValue('');
    const currentUpload = uploadPreview;
    setUploadPreview(null);
    setIsTyping(true);

    try {
      let finalMessage = text.trim() || '';

      // 🔥 FIXED: correct upload endpoint
      if (currentUpload && currentUpload.file) {
        const formData = new FormData();
        formData.append('file', currentUpload.file);

        const uploadRes = await axios.post(`${API_URL}/api/upload`, formData);
        const ocrData = uploadRes.data.data;

        finalMessage = `The user has uploaded an external prescription/report file named "${currentUpload.fileName}".

Extracted data:
- Right Eye: ${ocrData.right_eye ?? 'N/A'}
- Left Eye: ${ocrData.left_eye ?? 'N/A'}
- Axis: ${ocrData.axis ?? 'N/A'}
- Note: ${ocrData.note ?? 'N/A'}

Explain this in simple language for a parent.`;
      }

      // 🔥 FIXED: correct chat endpoint
      const response = await axios.post(`${API_URL}/api/chat`, {
        message: finalMessage,
        sessionId: SESSION_ID,
      });

      setMessages([...newMessages, {
        role: 'assistant',
        content: response.data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);

    } catch (error) {
      console.error('Error:', error);

      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Server error. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleQuickAction = (action) => {
    handleSend(action);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadPreview({
      file,
      fileName: file.name,
      status: "Ready to send"
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const formatMessageContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, index) => (
      <span key={index}>
        {line}
        {index < lines.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="app-container">
      <div className="chat-wrapper">

        <div className="chat-header">
          <div className="header-left">
            <button className="back-btn"><ArrowLeft size={24} /></button>
            <div className="avatar">
              <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" />
            </div>
            <div className="header-info">
              <h2>Sarah</h2>
              <p>online</p>
            </div>
          </div>
        </div>

        <div className="messages-container">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-row ${msg.role}`}>
              <div className="message-bubble">
                <div className="message-content">
                  {formatMessageContent(msg.content)}
                </div>
                <div className="message-meta">
                  <span>{msg.time}</span>
                  {msg.role === 'user' && (
                    <span className="tick"><CheckCheck size={14} /></span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && <div>Typing...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area-wrapper">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />

          <input
            type="text"
            placeholder="Message"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />

          <button onClick={triggerFileInput}>📎</button>

          <button onClick={() => handleSend()}>
            {(inputValue || uploadPreview) ? <Send size={20} /> : <Mic size={20} />}
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;