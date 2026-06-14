import React, { useEffect } from "react";
import { useChatStore } from "../../store/chatStore";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";

export default function ChatPage() {
  const { connectSocket, disconnectSocket, fetchConversations } = useChatStore();

  useEffect(() => {
    // Connect to WebSocket server and fetch active user conversations on page mount
    connectSocket();
    fetchConversations();

    // Clean up connections when page is unmounted
    return () => {
      disconnectSocket();
    };
  }, [connectSocket, disconnectSocket, fetchConversations]);

  return (
    <div
      className="ieg-card flex flex-col md:flex-row overflow-hidden rounded-2xl border border-white/5 backdrop-blur-xl"
      style={{
        background: "linear-gradient(135deg, rgba(11, 20, 55, 0.4) 0%, rgba(6, 13, 36, 0.4) 100%)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
      }}
    >
      <ChatSidebar />
      <ChatWindow />
    </div>
  );
}
