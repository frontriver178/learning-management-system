import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { useNavigate } from 'react-router-dom';
import './App.css';

const ChatBubble = ({ msg, isOwn }) => (_jsx("div", { style: {
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
    }, children: msg.message }));

const ChatHeader = ({ roomName, userName }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', padding: '24px 32px', borderBottom: '1px solid #E0E0E0', height: 80 }}>
            <img src="/assets/avatar-placeholder.png" alt="avatar" style={{ width: 48, height: 48, borderRadius: 1000, marginRight: 16 }} />
            <div>
                <div style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 20 }}>{roomName}</div>
                <div style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 14, color: '#828282' }}>{userName}（あなた）</div>
            </div>
        </div>
    );
};

const App = ({ roomName }) => {
    const socket = useSocket();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [image, setImage] = useState(null);
    const fileInputRef = useRef();
    const [name, setName] = useState(() => localStorage.getItem('chatName') || '');
    const [contextMenuMsgId, setContextMenuMsgId] = useState(null);
    const [rooms, setRooms] = useState([]);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    const [contextMenuRoom, setContextMenuRoom] = useState(null);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

    // 名前登録
    useEffect(() => {
        if (!name) {
            const n = window.prompt('あなたの名前を入力してください') || '匿名';
            setName(n);
            localStorage.setItem('chatName', n);
            socket?.emit('register name', n);
        }
        else {
            socket?.emit('register name', name);
        }
    }, [socket, name]);

    // ルーム参加
    useEffect(() => {
        if (socket && roomName) {
            socket.emit('join room', roomName);
        }
    }, [socket, roomName]);

    // メッセージ受信
    useEffect(() => {
        if (!socket)
            return;
        const handleHistory = (history) => {
            console.log('chat history received:', history);
            setMessages(history);
        };
        const handleMessage = (msg) => {
            console.log('chat message received:', msg);
            setMessages(prev => [...prev, msg]);
        };
        const handleUpdate = (msg) => {
            console.log('message updated:', msg);
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...msg } : m));
        };
        const handleDelete = (id) => {
            console.log('message deleted:', id);
            setMessages(prev => prev.filter(m => m.id !== id));
        };
        const handleUserJoined = (n) => {
            console.log('user joined:', n);
            systemMessage(`${n} が入室しました`);
        };
        const handleUserLeft = (n) => {
            console.log('user left:', n);
            systemMessage(`${n} が退室しました`);
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
    }, [socket]);

    // スクロールを一番下に
    useEffect(() => {
        messagesEndRef.current?.scrollTo(0, messagesEndRef.current.scrollHeight);
    }, [messages]);

    // 右クリック以外でメニューを閉じる
    useEffect(() => {
        const handleClick = () => {
            setContextMenuMsgId(null);
            setContextMenuRoom(null);
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // システムメッセージ追加
    const systemMessage = (text) => {
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

    // 画像選択時
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result); // Base64データ
            };
            reader.readAsDataURL(file);
        }
    };

    // メッセージ送信
    const sendMessage = () => {
        if ((input.trim() || image) && socket) {
            socket.emit('chat message', { text: input.trim(), image, room: roomName });
            setInput('');
            setImage(null);
        }
    };

    // メッセージ編集
    const editMessage = (msg) => {
        const newMsg = window.prompt('メッセージを編集してください', msg.message);
        if (newMsg && newMsg !== msg.message && socket) {
            socket.emit('edit message', { id: msg.id, newText: newMsg, room: roomName });
        }
        setContextMenuMsgId(null);
    };

    // メッセージ削除
    const deleteMessage = (msg) => {
        if (window.confirm('このメッセージを削除しますか？') && socket) {
            socket.emit('delete message', { id: msg.id, room: roomName });
        }
        setContextMenuMsgId(null);
    };

    // ルーム一覧取得
    useEffect(() => {
        fetch('/api/rooms')
            .then(res => res.json())
            .then(setRooms);
    }, []);

    // 新しいルーム作成
    const createRoom = () => {
        const newRoom = window.prompt('新しいルーム名を入力してください');
        if (newRoom) {
            navigate(`/room/${encodeURIComponent(newRoom)}`);
            setTimeout(() => {
                if (socket) {
                    socket.emit('chat message', { text: 'ルームが作成されました', room: newRoom });
                }
            }, 500);
        }
    };

    // ルーム削除
    const deleteRoom = async (room) => {
        if (!window.confirm(`${room} を削除しますか？`)) return;
        await fetch(`/api/rooms/${encodeURIComponent(room)}`, { method: 'DELETE' });
        setRooms(rooms => rooms.filter(r => r !== room));
    };

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#f9fafb' }}>
            {/* サイドバー */}
            <div style={{
                width: 240,
                background: '#f4f6fa',
                borderRight: '1px solid #e0e0e0',
                display: 'flex',
                flexDirection: 'column',
                padding: '16px 0'
            }}>
                <button
                    onClick={() => navigate('/rooms')}
                    style={{
                        margin: '0 0 16px 24px',
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#fff',
                        color: '#007aff',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                        transition: 'background 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#e6f0ff'}
                    onMouseOut={e => e.currentTarget.style.background = '#fff'}
                >
                    ←トップへ
                </button>
                <h3 style={{ margin: '0 0 16px 24px', fontWeight: 700, fontSize: 18, color: '#000' }}>チャット一覧</h3>
                <button
                    onClick={createRoom}
                    style={{
                        margin: '0 0 16px 24px',
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#007aff',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#005bb5'}
                    onMouseOut={e => e.currentTarget.style.background = '#007aff'}
                >
                    ＋ 新しいルーム
                </button>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {rooms.map(room => (
                        <li
                            key={room}
                            style={{
                                padding: '12px 24px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                position: 'relative',
                            }}
                            onClick={() => navigate(`/room/${encodeURIComponent(room)}`)}
                            onContextMenu={e => {
                                e.preventDefault();
                                setContextMenuRoom(room);
                            }}
                        >
                            <span style={{ flex: 1 }}>{room}</span>
                            {contextMenuRoom === room && (
                                <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            deleteRoom(room);
                                            setContextMenuRoom(null);
                                        }}
                                        style={{
                                            background: '#ff4d4f',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 6,
                                            padding: '4px 10px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        削除
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {/* チャット画面 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                            <ul id="messages" ref={messagesEndRef} style={{ flex: 1, minHeight: 0, maxHeight: '100%', marginBottom: 0 }}>
                                {messages.map(msg => {
                                    const isOwn = msg.name === name;
                                    return (
                                        <li key={msg.id} className={`message-item${isOwn ? ' message-own' : ' message-other'}`} onContextMenu={e => {
                                            e.preventDefault();
                                            if (isOwn && msg.name !== 'system')
                                                setContextMenuMsgId(msg.id);
                                        }}>
                                            <span style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
                                                [{new Date(msg.time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}] {msg.name}
                                            </span>
                                            <div className="message-bubble">
                                                {msg.message.split('\n').map((line, i) => (
                                                    <div key={i}>{line}</div>
                                                ))}
                                                {msg.image && (
                                                    <img src={msg.image} alt="img" style={{ maxWidth: 200, marginTop: 8, borderRadius: 8 }} />
                                                )}
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
                            <form className="chat-input-form" onSubmit={e => e.preventDefault()} style={{ margin: 16, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                                <textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="メッセージを入力"
                                    rows={2}
                                    style={{
                                        fontSize: 16,
                                        borderRadius: 16,
                                        padding: '12px 16px',
                                        width: '60%',
                                        resize: 'vertical',
                                        minHeight: 36,
                                        maxHeight: 120,
                                        lineHeight: 1.5,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                />
                                {/* 画像添付ボタン */}
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: 22,
                                        marginRight: 4,
                                    }}
                                    title="画像を添付"
                                >
                                    🖼️
                                </button>
                                {/* プレビュー */}
                                {image && (
                                    <img src={image} alt="preview" style={{ maxWidth: 60, maxHeight: 60, borderRadius: 8, marginRight: 4 }} />
                                )}
                                <button
                                    type="button"
                                    style={{ fontSize: 16, borderRadius: 16, padding: '16px 24px', fontWeight: 600 }}
                                    onClick={sendMessage}
                                >
                                    送信
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
