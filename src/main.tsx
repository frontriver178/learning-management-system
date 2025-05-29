import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import avatarPlaceholder from './assets/avatar-placeholder.png'; // ダミーアバター画像（適宜用意）

const RoomApp = () => {
  const { roomName } = useParams();
  return <App roomName={roomName || ''} />;
};

const RoomListItem = ({ room, onClick }: { room: string, onClick: () => void }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      padding: '12px 16px',
      gap: 16,
      width: 400,
      height: 88,
      background: '#F7F7F7',
      borderRadius: 8,
      marginBottom: 8,
      cursor: 'pointer',
    }}
    onClick={onClick}
  >
    <img
      src={avatarPlaceholder}
      alt="avatar"
      style={{ width: 64, height: 64, borderRadius: 1000, background: '#F7F7F7', marginRight: 16 }}
    />
    <div style={{ display: 'flex', flexDirection: 'column', width: 288, height: 54 }}>
      <span style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 20, color: '#000', height: 30 }}>{room}</span>
      <span style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: 16, color: '#454545', height: 24 }}>最新メッセージ...</span>
    </div>
  </div>
);

const RoomsPage = () => {
  const [rooms, setRooms] = useState<string[]>([]);
  const [newRoom, setNewRoom] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/rooms')
      .then(res => res.json())
      .then(setRooms);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoom.trim()) {
      navigate(`/room/${encodeURIComponent(newRoom.trim())}`);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>ルーム一覧</h2>
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          value={newRoom}
          onChange={e => setNewRoom(e.target.value)}
          placeholder="新しいルーム名"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit">作成</button>
      </form>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {rooms.map(room => (
          <li key={room}>
            <button
              style={{ width: '100%', textAlign: 'left', padding: 8, marginBottom: 4 }}
              onClick={() => navigate(`/room/${encodeURIComponent(room)}`)}
            >
              {room}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/room/:roomName" element={<RoomApp />} />
        <Route path="*" element={<Navigate to="/rooms" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
