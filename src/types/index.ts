export interface Message {
  id: string;
  time: string;
  name: string;
  message: string;
}

export interface SocketEvents {
  'chat message': (msg: Message) => void;
  'chat history': (history: Message[]) => void;
  'message updated': (msg: Message) => void;
  'message deleted': (id: string) => void;
  'user joined': (name: string) => void;
  'user left': (name: string) => void;
} 