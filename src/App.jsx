import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, Video, Phone, MoreVertical, 
  Smile, Paperclip, Camera, Mic, Send, CheckCheck 
} from 'lucide-react';
import './index.css';

const SESSION_ID = "session_" + Math.random().toString(36).substring(7);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3005/api";

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

    // What the user sees in the chat bubble
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

      if (currentUpload && currentUpload.file) {
        // Send file to backend OCR simulator
        const formData = new FormData();
        formData.append('file', currentUpload.file);
        const uploadRes = await axios.post(`${API_URL}/upload`, formData);
        const ocrData = uploadRes.data.data;

        // Build a crystal-clear structured prompt for the LLM
        finalMessage = `The user has uploaded an external prescription/report file named "${currentUpload.fileName}".

This file was scanned and the following data was extracted via OCR:
- Right Eye Power: ${ocrData.right_eye ?? 'N/A'}
- Left Eye Power: ${ocrData.left_eye ?? 'N/A'}
- Axis: ${ocrData.axis ?? 'N/A'}
- Clinical Note: ${ocrData.note ?? 'N/A'}

IMPORTANT: This prescription belongs to the uploaded file and may NOT be Aarav's prescription. 
Please:
1. Describe what this prescription means in simple language for a parent.
2. Explain each field (right eye, left eye, axis, note) clearly.
3. Classify the severity (mild, moderate, or high myopia).
4. If clinically useful, compare with Aarav's profile (but only as a reference, not as the subject).
5. End with your standard identity statement.
${text.trim() ? `\nAdditional note from user: "${text.trim()}"` : ''}`;
      }

      const response = await axios.post(`${API_URL}/chat`, {
        message: finalMessage,
        sessionId: SESSION_ID,
      });

      setMessages([...newMessages, {
        role: 'assistant',
        content: response.data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([...newMessages, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
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
    return lines.map((line, index) => {
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <span key={index}>
          <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
          {index < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div className="app-container">
      <div className="chat-wrapper">
        {/* Header (Android WhatsApp Style) */}
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
          <div className="header-right">
            <button className="icon-btn"><Video size={20} fill="currentColor" /></button>
            <button className="icon-btn"><Phone size={20} fill="currentColor" /></button>
            <button className="icon-btn"><MoreVertical size={20} fill="currentColor" /></button>
          </div>
        </div>

        {/* Messages */}
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
          
          {isTyping && (
            <div className="message-row assistant">
              <div className="message-bubble">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* File Preview */}
        {uploadPreview && (
          <div style={{ padding: '0 10px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '10px', width: '100%', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Paperclip size={20} color="var(--wa-text-secondary)" />
              <div style={{ flex: 1, fontSize: '13px' }}>{uploadPreview.fileName}</div>
              <button onClick={() => setUploadPreview(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'red' }}>✕</button>
            </div>
          </div>
        )}

        {/* Quick Actions (as suggestion chips) */}
        {!inputValue && !uploadPreview && (
          <div className="quick-actions">
            <button className="action-btn" onClick={() => handleQuickAction("Upload Prescription")}>📄 Upload Prescription</button>
            <button className="action-btn" onClick={() => handleQuickAction("When is my next follow-up?")}>📅 Next Follow-up</button>
            <button className="action-btn" onClick={() => handleQuickAction("What is my progress?")}>📊 My Progress</button>
          </div>
        )}

        {/* Input Area */}
        <div className="input-area-wrapper">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
            accept="application/pdf,image/*"
          />
          
          <div className="input-container">
            <div className="input-icon-left">
              <Smile size={24} />
            </div>
            <input
              type="text"
              placeholder="Message"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <div className="input-icon-right" onClick={triggerFileInput}>
              <Paperclip size={20} style={{ transform: 'rotate(45deg)' }} />
            </div>
            {!inputValue && (
              <div className="input-icon-right">
                <Camera size={20} />
              </div>
            )}
          </div>
          
          <div className="send-btn-container" onClick={() => handleSend()}>
            {(inputValue || uploadPreview) ? (
              <Send size={20} style={{ marginLeft: '4px' }} />
            ) : (
              <Mic size={20} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
