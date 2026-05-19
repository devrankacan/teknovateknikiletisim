export type Platform = "instagram" | "whatsapp" | "messenger";

export type MessageStatus = "sent" | "delivered" | "read";

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  sender: "customer" | "agent";
  timestamp: Date;
  status: MessageStatus;
  read: boolean;
}

export interface Conversation {
  id: string;
  platform: Platform;
  customerName: string;
  customerAvatar: string;
  customerHandle: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: "active" | "pending" | "resolved";
  messages: Message[];
  tags: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent";
  avatar: string;
}

export interface Stats {
  totalMessages: number;
  activeConversations: number;
  resolvedToday: number;
  avgResponseTime: string;
}
