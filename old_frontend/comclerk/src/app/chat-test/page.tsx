"use client";

import * as React from "react";
import ChatPanel from "@/components/ChatPanel";
import type { ChatMessage } from "@/types/chat";

// Simulate AI response delay
const simulateAIResponse = (message: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const responses = [
        `I received your message: "${message}". How can I help you further?`,
        "That's interesting! Tell me more about that.",
        "I understand. Let me think about that for a moment...",
        "Great question! Here's what I think...",
        "Thanks for sharing that with me. What would you like to know next?",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      resolve(randomResponse);
    }, Math.random() * 2000 + 1000); // 1-3 seconds delay
  });
};

export default function ChatTestPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "1",
      content: "Hello! I'm your AI assistant. How can I help you today?",
      role: "ai",
      timestamp: new Date(Date.now() - 60000), // 1 minute ago
    },
  ]);
  const [isTyping, setIsTyping] = React.useState(false);

  const handleSendMessage = React.useCallback(async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content,
      role: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate AI typing
    setIsTyping(true);

    try {
      // Get AI response
      const aiResponse = await simulateAIResponse(content);

      // Add AI message
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        content: aiResponse,
        role: "ai",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: "Sorry, I encountered an error. Please try again.",
        role: "ai",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  // Add some test messages after component mounts
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const testMessages: ChatMessage[] = [
        {
          id: "test-1",
          content: "This is a test message from the user to check the chat functionality.",
          role: "user",
          timestamp: new Date(Date.now() - 30000),
        },
        {
          id: "test-2",
          content: "This is a longer message from the AI assistant to test how longer messages are displayed in the chat interface. It should wrap properly and maintain good readability.",
          role: "ai",
          timestamp: new Date(Date.now() - 20000),
        },
        {
          id: "test-3",
          content: "Great! The chat is working well. Let me test with some\nmulti-line\nmessages too.",
          role: "user",
          timestamp: new Date(Date.now() - 10000),
        },
      ];

      setMessages(prev => [...prev, ...testMessages]);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">Chat Panel Test</h1>
        <p className="text-muted-foreground">
          Testing the ChatPanel component with simulated AI responses.
        </p>
        <div className="mt-2 text-sm text-muted-foreground">
          <p>Total messages: {messages.length}</p>
          <p>Typing: {isTyping ? "Yes" : "No"}</p>
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
        />
      </div>
    </div>
  );
}