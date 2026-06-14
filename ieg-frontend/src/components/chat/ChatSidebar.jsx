import React, { useState } from "react";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { Search, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ChatSidebar() {
  const { conversations, activeConversation, setActiveConversation, onlineUsers } = useChatStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");

  // Filter conversations based on partner name or company
  const filteredConversations = conversations.filter((c) => {
    const partnerName = c.partner?.fullName || "";
    const partnerCompany = c.partner?.companyName || "";
    return (
      partnerName.toLowerCase().includes(search.toLowerCase()) ||
      partnerCompany.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getPartnerPresence = (partnerId) => {
    const presence = onlineUsers.find((u) => u.userId === String(partnerId));
    return presence?.status || "offline";
  };

  const getStatusColor = (status) => {
    if (status === "online") return "bg-emerald-500 shadow-[0_0_8px_#10b981]";
    if (status === "away") return "bg-amber-500 shadow-[0_0_8px_#f59e0b]";
    return "bg-slate-500";
  };

  return (
    <div
      className="w-full md:w-80 flex flex-col border-r border-white/5 h-[calc(100vh-140px)]"
      style={{ background: "rgba(11, 20, 55, 0.4)" }}
    >
      {/* Search Header */}
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <input
            type="text"
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm text-white border border-white/10 outline-none transition-all duration-300 focus:border-gold-500/50"
            style={{ background: "rgba(6, 13, 36, 0.6)" }}
          />
          <Search size={16} className="absolute left-3 top-3 text-slate-500" />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 p-4">
            <MessageSquare size={32} className="mb-2 text-slate-600 animate-pulse" />
            <p className="text-sm">No conversations found</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const partner = conv.partner;
            if (!partner) return null;

            const isSelected = activeConversation?._id === conv._id;
            const presence = getPartnerPresence(partner._id);
            const isUnread = conv.unreadCount > 0;

            return (
              <button
                key={conv._id}
                onClick={() => setActiveConversation(conv)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                  isSelected
                    ? "bg-gold-500/10 border border-gold-500/20 text-white"
                    : "hover:bg-white/5 border border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                {/* Avatar and Presence Badge */}
                <div className="relative flex-shrink-0">
                  {partner.avatarUrl ? (
                    <img
                      src={partner.avatarUrl}
                      alt={partner.fullName}
                      className="w-10 h-10 rounded-xl object-cover border border-white/10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center font-bold text-blue-400 border border-blue-500/20">
                      {partner.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Status Indicator */}
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0B1437] ${getStatusColor(
                      presence
                    )}`}
                  />
                </div>

                {/* Conversation Details */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isUnread ? "text-white font-bold" : "text-slate-300"
                      }`}
                    >
                      {partner.fullName}
                    </p>
                    {conv.lastMessageAt && (
                      <span className="text-[10px] text-slate-500 flex-shrink-0">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })
                          .replace("about ", "")
                          .replace("less than a minute", "now")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-1">
                    {partner.companyName || partner.role}
                  </p>
                  <p
                    className={`text-xs truncate ${
                      isUnread ? "text-gold-400 font-medium" : "text-slate-500"
                    }`}
                  >
                    {conv.lastMessage || "No messages yet"}
                  </p>
                </div>

                {/* Unread Counter Badge */}
                {isUnread && (
                  <span className="w-5 h-5 rounded-full bg-gold-500 text-slate-950 font-bold text-[10px] flex items-center justify-center animate-bounce">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
