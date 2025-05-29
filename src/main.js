import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import avatarPlaceholder from './assets/avatar-placeholder.png'; // ダミーアバター画像（適宜用意）
const RoomApp = () => {
    const { roomName } = useParams();
    return _jsx(App, { roomName: roomName || '' });
};
const RoomListItem = ({ room, onClick }) => (_jsxs("div", { style: {
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
    }, onClick: onClick, children: [_jsx("img", { src: avatarPlaceholder, alt: "avatar", style: { width: 64, height: 64, borderRadius: 1000, background: '#F7F7F7', marginRight: 16 } }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', width: 288, height: 54 }, children: [_jsx("span", { style: { fontFamily: 'Inter', fontWeight: 500, fontSize: 20, color: '#000', height: 30 }, children: room }), _jsx("span", { style: { fontFamily: 'Inter', fontWeight: 400, fontSize: 16, color: '#454545', height: 24 }, children: "\u6700\u65B0\u30E1\u30C3\u30BB\u30FC\u30B8..." })] })] }));
const RoomsPage = () => {
    const [rooms, setRooms] = useState([]);
    const [newRoom, setNewRoom] = useState('');
    const navigate = useNavigate();
    useEffect(() => {
        fetch('/api/rooms')
            .then(res => res.json())
            .then(setRooms);
    }, []);
    const handleCreate = (e) => {
        e.preventDefault();
        if (newRoom.trim()) {
            navigate(`/room/${encodeURIComponent(newRoom.trim())}`);
        }
    };
    return (_jsxs("div", { style: { maxWidth: 400, margin: '40px auto', fontFamily: 'sans-serif' }, children: [_jsx("h2", { children: "\u30EB\u30FC\u30E0\u4E00\u89A7" }), _jsxs("form", { onSubmit: handleCreate, style: { display: 'flex', gap: 8, marginBottom: 20 }, children: [_jsx("input", { value: newRoom, onChange: e => setNewRoom(e.target.value), placeholder: "\u65B0\u3057\u3044\u30EB\u30FC\u30E0\u540D", style: { flex: 1, padding: 8 } }), _jsx("button", { type: "submit", children: "\u4F5C\u6210" })] }), _jsx("ul", { style: { listStyle: 'none', padding: 0 }, children: rooms.map(room => (_jsx("li", { children: _jsx("button", { style: { width: '100%', textAlign: 'left', padding: 8, marginBottom: 4 }, onClick: () => navigate(`/room/${encodeURIComponent(room)}`), children: room }) }, room))) })] }));
};
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/rooms", element: _jsx(RoomsPage, {}) }), _jsx(Route, { path: "/room/:roomName", element: _jsx(RoomApp, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/rooms", replace: true }) })] }) }) }));
