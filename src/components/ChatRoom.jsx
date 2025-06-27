import React, { useEffect, useRef, useState } from 'react';
import { PORT, CLIENT, SERVER } from '../utilities/Constants';

function ChatRoom() {
  const [username, setUsername] = useState(null);
  const [messages, setMessages] = useState([]);
  const wsClient = useRef(null);
  const messageRef = useRef(null);

  useEffect(() => {
    // Ask for username only once when component mounts
    const name = prompt('Enter your username:');
    if (name?.trim()) {
      setUsername(name.trim());
    }
  }, []);

  useEffect(() => {
    if (!username) return;

    const URL = `ws://localhost:${PORT}`;
    wsClient.current = new WebSocket(URL);

    wsClient.current.onopen = () => {
      const data = {
        type: CLIENT.MESSAGE.NEW_USER,
        payload: { username },
      };
      wsClient.current.send(JSON.stringify(data));
    };

    wsClient.current.onmessage = (messageEvent) => {
      const { type, payload } = JSON.parse(messageEvent.data);
      switch (type) {
        case SERVER.BROADCAST.NEW_USER_WITH_TIME:
          addMessage(`<em>${payload.username} joined at ${payload.time}</em>`);
          break;
        case CLIENT.MESSAGE.NEW_MESSAGE:
          addMessage(`<strong>${payload.username}</strong>: ${payload.message}`);
          break;
        default:
          break;
      }
    };

    wsClient.current.onerror = (e) => console.error('WebSocket error:', e);
    wsClient.current.onclose = () => addMessage('Connection closed.');

    return () => wsClient.current?.close();
  }, [username]);

  const addMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const msg = messageRef.current.value;
    if (!msg.trim()) return;

    const data = {
      type: CLIENT.MESSAGE.NEW_MESSAGE,
      payload: { message: msg, username },
    };

    wsClient.current.send(JSON.stringify(data));
    addMessage(`<strong>Me:</strong> ${msg}`);
    messageRef.current.value = '';
  };

  if (!username) return null;

  return (
    <div>
      <h2>Welcome, {username}</h2>
      <div className="chat-box">
        {messages.map((msg, idx) => (
          <div
            className="message"
            key={idx}
            dangerouslySetInnerHTML={{ __html: msg }}
          />
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input ref={messageRef} type="text" placeholder="Type a message..." />
        <button type="submit">➤</button>
      </form>
    </div>
  );
}

export default ChatRoom;
