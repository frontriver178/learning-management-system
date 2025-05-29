import React, { useEffect, useRef, useState } from 'react';
import { useSocket } from './hooks/useSocket';
import type { Message } from './types';
import './App.css';

interface AppProps {
  roomName: string;
}

const ChatBubble: React.FC<{ msg: Message; isOwn: boolean }> = ({ msg, isOwn }) => (
  <div
    style={{
      alignSelf: isOwn ? 'flex-end' : 'flex-start',
      background: isOwn ? '#000' : '#F7F7F7',
      color: isOwn ? '#fff' : '#000',
      borderRadius: 16,
      padding: '12px 16px',
      margin: '4px 0',
      maxWidth: '60%',
      fontSize: 16,
      fontFamily: 'Inter',
      fontWeight: 400,
      wordBreak: 'break-word',
    }}
  >
    {msg.message}
  </div>
);

const ChatHeader: React.FC<{ roomName: string; userName: string }> = ({ roomName, userName }) => (
  <div style={{ display: 'flex', alignItems: 'center', padding: '24px 32px', borderBottom: '1px solid #E0E0E0', height: 80 }}>
    <img src="/assets/avatar-placeholder.png" alt="avatar" style={{ width: 48, height: 48, borderRadius: 1000, marginRight: 16 }} />
    <div>
      <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 20 }}>{roomName}</div>
      <div style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, color: '#828282' }}>{userName}（あなた）</div>
    </div>
  </div>
);

const App: React.FC<AppProps> = ({ roomName }) => {
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [name, setName] = useState<string>(() => localStorage.getItem('chatName') || '');
  const [users, setUsers] = useState<string[]>([]);
  const [contextMenuMsgId, setContextMenuMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLUListElement | null>(null);

  // 名前登録
  useEffect(() => {
    if (!name) {
      const n = window.prompt('あなたの名前を入力してください') || '匿名';
      setName(n);
      localStorage.setItem('chatName', n);
      socket?.emit('register name', n);
    } else {
      socket?.emit('register name', name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // ルーム参加
  useEffect(() => {
    if (socket && roomName) {
      socket.emit('join room', roomName);
      setUsers([]);
    }
  }, [socket, roomName]);

  // メッセージ受信
  useEffect(() => {
    if (!socket) return;
    const handleHistory = (history: Message[]) => {
      console.log('chat history received:', history);
      setMessages(history);
    };
    const handleMessage = (msg: Message) => {
      console.log('chat message received:', msg);
      setMessages(prev => [...prev, msg]);
    };
    const handleUpdate = (msg: Message) => {
      console.log('message updated:', msg);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...msg } : m));
    };
    const handleDelete = (id: string) => {
      console.log('message deleted:', id);
      setMessages(prev => prev.filter(m => m.id !== id));
    };
    const handleUserJoined = (n: string) => {
      console.log('user joined:', n);
      systemMessage(`${n} が入室しました`);
      setUsers(prev => [...prev, n]);
    };
    const handleUserLeft = (n: string) => {
      console.log('user left:', n);
      systemMessage(`${n} が退室しました`);
      setUsers(prev => prev.filter(u => u !== n));
    };

    socket.on('chat history', handleHistory);
    socket.on('chat message', handleMessage);
    socket.on('message updated', handleUpdate);
    socket.on('message deleted', handleDelete);
    socket.on('user joined', handleUserJoined);
    socket.on('user left', handleUserLeft);

    return () => {
      socket.off('chat history', handleHistory);
      socket.off('chat message', handleMessage);
      socket.off('message updated', handleUpdate);
      socket.off('message deleted', handleDelete);
      socket.off('user joined', handleUserJoined);
      socket.off('user left', handleUserLeft);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // スクロールを一番下に
  useEffect(() => {
    messagesEndRef.current?.scrollTo(0, messagesEndRef.current.scrollHeight);
  }, [messages]);

  // 右クリック以外でメニューを閉じる
  useEffect(() => {
    const handleClick = () => setContextMenuMsgId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // システムメッセージ追加
  const systemMessage = (text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        time: new Date().toISOString(),
        name: 'system',
        message: text,
      },
    ]);
  };

  // メッセージ送信
  const sendMessage = () => {
    if (input.trim() && socket) {
      socket.emit('chat message', { text: input.trim(), room: roomName });
      setInput('');
    }
  };

  // メッセージ編集
  const editMessage = (msg: Message) => {
    const newMsg = window.prompt('メッセージを編集してください', msg.message);
    if (newMsg && newMsg !== msg.message && socket) {
      socket.emit('edit message', { id: msg.id, newText: newMsg, room: roomName });
    }
    setContextMenuMsgId(null);
  };

  // メッセージ削除
  const deleteMessage = (msg: Message) => {
    if (window.confirm('このメッセージを削除しますか？') && socket) {
      socket.emit('delete message', { id: msg.id, room: roomName });
    }
    setContextMenuMsgId(null);
  };

  useEffect(() => {
    if (!socket) return;
    const handleUserList = (list: string[]) => {
      console.log('user list received:', list);
      setUsers(list);
    };
    socket.on('user list', handleUserList);
    return () => {
      socket.off('user list', handleUserList);
    };
  }, [socket]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'stretch',
      alignItems: 'stretch',
      height: '100vh',
      background: '#f9fafb',
      width: '100vw',
      padding: 0,
      margin: 0,
    }}>
      <div style={{
        width: '100%',
        background: '#fff',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        boxSizing: 'border-box',
      }}>
        <div className="chat-header">
          <img src="/assets/avatar-placeholder.png" alt="avatar" />
          <h2 style={{ margin: 0 }}>チャット - {roomName}</h2>
        </div>
        <div style={{ display: 'flex', gap: 32, flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <ul
              id="messages"
              ref={messagesEndRef}
              style={{ flex: 1, minHeight: 0, maxHeight: '100%', marginBottom: 0 }}
            >
              {messages.map(msg => {
                const isOwn = msg.name === name;
                return (
                  <li
                    key={msg.id}
                    className={`message-item${isOwn ? ' message-own' : ' message-other'}`}
                    onContextMenu={e => {
                      e.preventDefault();
                      if (isOwn && msg.name !== 'system') setContextMenuMsgId(msg.id);
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
                      [{new Date(msg.time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}] {msg.name}
                    </span>
                    <div className="message-bubble">
                      {msg.message}
                    </div>
                    {contextMenuMsgId === msg.id && (
                      <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                        <button onClick={() => editMessage(msg)}>編集</button>
                        <button onClick={() => deleteMessage(msg)}>削除</button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <form
              className="chat-input-form"
              onSubmit={e => e.preventDefault()}
              style={{ margin: 16 }}
            >
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="メッセージを入力"
                style={{ fontSize: 16, borderRadius: 16, padding: '16px 18px' }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              />
              <button
                type="button"
                style={{ fontSize: 16, borderRadius: 16, padding: '16px 24px', fontWeight: 600 }}
                onClick={() => {
                  sendMessage();
                }}
              >送信</button>
            </form>
          </div>
          <div style={{ width: 240, margin: 16 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontWeight: 600, fontSize: 18 }}>ユーザーリスト</h3>
            <ul className="user-list">
              {users.map(user => (
                <li key={user}>
                  {user}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
