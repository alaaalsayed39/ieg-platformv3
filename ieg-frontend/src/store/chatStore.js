import { create } from "zustand";
import { io } from "socket.io-client";
import api, { API_ORIGIN } from "../config/api";
import { useAuthStore } from "./authStore";
import toast from "react-hot-toast";

export const useChatStore = create((set, get) => ({
  socket: null,
  conversations: [],
  messages: [],
  activeConversation: null,
  onlineUsers: [], // [{ userId, status }]
  typingUsers: {}, // { conversationId: [ { userId, name } ] }
  loadingConversations: false,
  loadingMessages: false,

  // 1. Fetch Conversations via REST
  fetchConversations: async () => {
    set({ loadingConversations: true });
    try {
      const { data } = await api.get("/messages/conversations");
      set({ conversations: data.data || [] });
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      set({ loadingConversations: false });
    }
  },

  // 2. Fetch Message History via REST & Mark Read
  fetchMessages: async (conversationId) => {
    set({ loadingMessages: true });
    try {
      const { data } = await api.get(`/messages/conversations/${conversationId}`);
      set({ messages: data.data || [] });

      // Mark the conversation as read locally in the list
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c._id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
      }));
    } catch (err) {
      console.error("Failed to load message history", err);
    } finally {
      set({ loadingMessages: false });
    }
  },

  // 3. Set Active Conversation and Join Room
  setActiveConversation: (conv) => {
    const { socket, activeConversation } = get();
    if (activeConversation?._id === conv?._id) return;

    set({ activeConversation: conv, messages: [] });

    if (conv) {
      if (socket) {
        socket.emit("join:conversation", conv._id);
      }
      get().fetchMessages(conv._id);
    }
  },

  // 4. Initiate Conversation
  initiateConversation: async (participantId) => {
    try {
      const { data } = await api.post("/messages/conversations/initiate", {
        participantId,
      });
      const conv = data.data;

      // Update conversations list locally if not present
      const { conversations } = get();
      if (!conversations.some((c) => c._id === conv._id)) {
        set({ conversations: [conv, ...conversations] });
      }

      get().setActiveConversation(conv);
      return conv;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start conversation");
      throw err;
    }
  },

  // 5. Connect Socket
  connectSocket: () => {
    const { socket } = get();
    if (socket) return; // already connected

    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const newSocket = io(API_ORIGIN, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("[Socket] Connected to server");
    });

    newSocket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
      if (err.message.toLowerCase().includes("suspended")) {
        toast.error("Your chat access has been suspended.");
      }
    });

    // Receive initial presence list
    newSocket.on("presence:initial", (users) => {
      set({ onlineUsers: users || [] });
    });

    // Handle user presence updates
    newSocket.on("presence:update", ({ userId, status }) => {
      set((state) => {
        const list = [...state.onlineUsers];
        const idx = list.findIndex((u) => u.userId === userId);
        if (idx > -1) {
          list[idx] = { ...list[idx], status };
        } else {
          list.push({ userId, status });
        }
        return { onlineUsers: list };
      });
    });

    // Handle incoming messages
    newSocket.on("message:new", (message) => {
      const { activeConversation } = get();

      // If the message is in the active conversation, append it
      if (activeConversation && message.conversationId === activeConversation._id) {
        set((state) => ({ messages: [...state.messages, message] }));

        // Emit read state back to mark it read immediately since active
        newSocket.emit("join:conversation", activeConversation._id);
      } else {
        // Increment unread count for the conversation
        const currentUserId = useAuthStore.getState().user?._id;
        const forMe = String(message.receiverId._id || message.receiverId) === String(currentUserId);

        if (forMe) {
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c._id === message.conversationId ? { ...c, unreadCount: (c.unreadCount || 0) + 1 } : c
            ),
          }));
        }
      }

      // Update last message in conversation preview
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c._id === message.conversationId
            ? { ...c, lastMessage: message.content || "Sent an attachment", lastMessageAt: message.createdAt }
            : c
        ),
      }));
    });

    // Handle message status updates (sent -> delivered -> read)
    newSocket.on("message:status_update", ({ conversationId, messageIds, status, readAt }) => {
      const { activeConversation } = get();
      if (activeConversation && conversationId === activeConversation._id) {
        set((state) => ({
          messages: state.messages.map((m) =>
            messageIds.includes(m._id) ? { ...m, status, readAt: readAt || m.readAt } : m
          ),
        }));
      }
    });

    // Handle typing indicators
    newSocket.on("message:typing", ({ userId, name }) => {
      const { activeConversation } = get();
      if (!activeConversation) return;
      set((state) => {
        const typingList = state.typingUsers[activeConversation._id] || [];
        if (!typingList.some((t) => t.userId === userId)) {
          return {
            typingUsers: {
              ...state.typingUsers,
              [activeConversation._id]: [...typingList, { userId, name }],
            },
          };
        }
        return {};
      });
    });

    newSocket.on("message:stop_typing", ({ userId }) => {
      const { activeConversation } = get();
      if (!activeConversation) return;
      set((state) => {
        const typingList = state.typingUsers[activeConversation._id] || [];
        return {
          typingUsers: {
            ...state.typingUsers,
            [activeConversation._id]: typingList.filter((t) => t.userId !== userId),
          },
        };
      });
    });

    newSocket.on("message:notification", ({ from, content }) => {
      toast(`New message from ${from}: ${content}`, { icon: "💬" });
      get().fetchConversations();
    });

    newSocket.on("error", (msg) => {
      toast.error(msg);
    });

    set({ socket: newSocket });
  },

  // 6. Disconnect Socket
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [], typingUsers: {} });
    }
  },

  // 7. Send Message
  sendMessage: (content, attachments = []) => {
    const { socket, activeConversation } = get();
    if (!socket || !activeConversation) {
      toast.error("Not connected to chat");
      return;
    }

    const currentUserId = useAuthStore.getState().user?._id;
    const partner = activeConversation.participants.find((p) => String(p._id || p) !== String(currentUserId));
    const partnerId = partner?._id || partner;

    socket.emit(
      "message:send",
      {
        conversationId: activeConversation._id,
        receiverId: partnerId,
        content,
        attachments,
      },
      (response) => {
        if (!response.success) {
          toast.error(response.error || "Failed to send message");
        }
      }
    );
  },

  // 8. Typing Emits
  sendTyping: () => {
    const { socket, activeConversation } = get();
    if (socket && activeConversation) {
      socket.emit("message:typing", { conversationId: activeConversation._id });
    }
  },

  sendStopTyping: () => {
    const { socket, activeConversation } = get();
    if (socket && activeConversation) {
      socket.emit("message:stop_typing", { conversationId: activeConversation._id });
    }
  },
}));
