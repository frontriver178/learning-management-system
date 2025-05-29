import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
// PATHを動的に生成する関数
const getRoomPath = (room) => {
  // ルーム名がundefinedの場合は'general'を使用
  const roomName = room || 'general';
  return path.join(__dirname, 'logs', `${roomName}.json`);
};

// Reactのビルド成果物を配信
app.use(express.static(path.join(__dirname, 'dist')));

// 保存用ユーティリティ
function saveMessageToJson(obj, room) {
  const roomPath = getRoomPath(room);
  fs.readFile(roomPath, 'utf8', (err, data) => {
    const messages = err ? [] : JSON.parse(data || '[]');
    messages.push(obj);
    fs.writeFile(roomPath, JSON.stringify(messages, null, 2), (err) => {
      if (err) console.error('保存失敗:', err);
    });
  });
}

// 接続ごとのユーザー名を記録
const users = new Map();
// ルームごとのユーザーリストを管理
const roomUsers = new Map();

io.on('connection', socket => {
  console.log('ユーザーが接続しました', socket.id);

  // 名前登録
  socket.on('register name', name => {
    console.log('register name:', name, 'for', socket.id);
    users.set(socket.id, name);
    console.log(`${name} が接続しました`);
  });

  // ルーム参加
  socket.on('join room', room => {
    const roomName = room || 'general';
    socket.join(roomName);
    console.log(`${users.get(socket.id)} が ${roomName} に参加しました`);
    console.log('roomUsers before:', Array.from(roomUsers.get(roomName) || []));
    if (!roomUsers.has(roomName)) {
      roomUsers.set(roomName, new Set());
    }
    roomUsers.get(roomName).add(users.get(socket.id));
    console.log('roomUsers after:', Array.from(roomUsers.get(roomName)));
    io.to(roomName).emit('user joined', users.get(socket.id));
    io.to(roomName).emit('user list', Array.from(roomUsers.get(roomName)));
    const roomPath = getRoomPath(roomName);
    try {
      if (fs.existsSync(roomPath)) {
        const data = fs.readFileSync(roomPath, 'utf8');
        const messages = JSON.parse(data);
        console.log('sending chat history:', messages.length, 'messages');
        socket.emit('chat history', messages);
      }
    } catch (err) {
      console.error('履歴の読み込みに失敗しました:', err);
    }
  });

  // メッセージ送信
  socket.on('chat message', ({ text, image, room }) => {
    const roomName = room || 'general';
    console.log('chat message:', text, 'from', users.get(socket.id), 'to', roomName);
    const message = {
      id: randomUUID(),
      time: new Date().toISOString(),
      name: users.get(socket.id),
      message: text,
      image: image || null, // 画像データも保存
    };

    // メッセージを保存
    saveMessageToJson(message, roomName);

    // 同じルームの全員にメッセージを送信
    io.to(roomName).emit('chat message', message);
  });

  // メッセージ編集
  socket.on('edit message', ({ id, newText, room }) => {
    const roomName = room || 'general';
    console.log('edit message:', id, 'to', newText, 'in', roomName);
    const roomPath = getRoomPath(roomName);
    try {
      if (fs.existsSync(roomPath)) {
        const data = fs.readFileSync(roomPath, 'utf8');
        const messages = JSON.parse(data);
        const messageIndex = messages.findIndex(m => m.id === id);
        if (messageIndex !== -1) {
          messages[messageIndex].message = newText;
          fs.writeFileSync(roomPath, JSON.stringify(messages, null, 2));
          io.to(roomName).emit('message updated', messages[messageIndex]);
        }
      }
    } catch (err) {
      console.error('メッセージの編集に失敗しました:', err);
    }
  });

  // メッセージ削除
  socket.on('delete message', ({ id, room }) => {
    const roomName = room || 'general';
    console.log('delete message:', id, 'in', roomName);
    const roomPath = getRoomPath(roomName);
    try {
      if (fs.existsSync(roomPath)) {
        const data = fs.readFileSync(roomPath, 'utf8');
        const messages = JSON.parse(data);
        const filteredMessages = messages.filter(m => m.id !== id);
        fs.writeFileSync(roomPath, JSON.stringify(filteredMessages, null, 2));
        io.to(roomName).emit('message deleted', id);
      }
    } catch (err) {
      console.error('メッセージの削除に失敗しました:', err);
    }
  });

  // 切断時
  socket.on('disconnect', () => {
    const userName = users.get(socket.id);
    console.log('disconnect:', userName, socket.id);
    if (userName) {
      // ユーザーが参加していた全ルームから退出
      for (const [roomName, userSet] of roomUsers.entries()) {
        if (userSet.has(userName)) {
          userSet.delete(userName);
          io.to(roomName).emit('user left', userName);
          // 最新ユーザーリストを全員に送信
          io.to(roomName).emit('user list', Array.from(userSet));
        }
      }
      users.delete(socket.id);
      console.log(`${userName} が切断しました`);
    }
  });
});

// ルーム一覧API
app.get('/api/rooms', (req, res) => {
  const logsDir = path.join(__dirname, 'logs');
  fs.readdir(logsDir, (err, files) => {
    if (err) {
      res.status(500).json({ error: 'ルーム一覧の取得に失敗しました' });
      return;
    }
    // .json拡張子を除いたファイル名のみ返す
    const rooms = files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace(/\.json$/, ''));
    res.json(rooms);
  });
});

// ルーム削除API
app.delete('/api/rooms/:roomName', (req, res) => {
  const roomName = req.params.roomName;
  const logsDir = path.join(__dirname, 'logs');
  const filePath = path.join(logsDir, `${roomName}.json`);
  fs.unlink(filePath, (err) => {
    if (err) {
      res.status(500).json({ error: '削除に失敗しました' });
      return;
    }
    res.json({ success: true });
  });
});

// ここでcatch-allルートをapp.useで一番最後に追加
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

httpServer.listen(3000, () => console.log('http://localhost:3000 でチャット開始')); 