export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'ai';
  timestamp: Date;
}

export interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isTyping?: boolean;
  disabled?: boolean;
}