import React, { useState, useEffect, useRef } from "react";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import api, { getAssetUrl } from "../../config/api";
import {
  Send,
  Paperclip,
  X,
  File,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Loader2,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function ChatWindow() {
  const {
    activeConversation,
    messages,
    sendMessage,
    onlineUsers,
    typingUsers,
    sendTyping,
    sendStopTyping,
    loadingMessages,
  } = useChatStore();

  const { user } = useAuthStore();
  const [inputText, setInputText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // Handle typing indicator trigger
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    sendTyping();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      sendStopTyping();
    }, 2000);
  };

  const handleSend = () => {
    if (!inputText.trim() && attachments.length === 0) return;

    sendMessage(inputText.trim(), attachments);
    setInputText("");
    setAttachments([]);
    sendStopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle Attachment Uploads
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side extension validation
    const ext = `.${file.name.split(".").pop().toLowerCase()}`;
    const allowed = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
    ];

    if (!allowed.includes(ext)) {
      toast.error(`File type ${ext} not allowed. Supported: ${allowed.join(", ")}`);
      return;
    }

    // Client-side size validation (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File exceeds maximum allowed size of 10MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const { data } = await api.post("/messages/upload", formData);
      const uploadedFile = data.data; // { fileName, fileUrl, fileType, fileSize, publicId }
      setAttachments((prev) => [...prev, uploadedFile]);
      toast.success("File uploaded successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  // Secure attachment downloader using authorization token
  const handleDownload = async (msgId, index, fileName) => {
    try {
      const response = await api.get(`/messages/attachments/${msgId}/${index}/download`);
      if (response.data?.url) {
        window.open(response.data.url, "_blank");
      } else {
        const fileResponse = await api.get(`/messages/attachments/${msgId}/${index}/download`, {
          responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([fileResponse.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      }
    } catch (err) {
      toast.error("Failed to download attachment");
    }
  };

  const getPartnerPresence = () => {
    if (!activeConversation?.partner) return "offline";
    const presence = onlineUsers.find((u) => u.userId === String(activeConversation.partner._id));
    return presence?.status || "offline";
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#060D24]/30">
        <div className="w-16 h-16 rounded-full bg-gold-500/5 flex items-center justify-center mb-4 border border-gold-500/10">
          <Send size={24} className="text-gold-500/40" />
        </div>
        <h3 className="font-display font-semibold text-lg text-white mb-1">Your Messages</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Send private messages, compliance files, and shipping details to your business contacts.
        </p>
      </div>
    );
  }

  const partner = activeConversation.partner;
  const presence = getPartnerPresence();
  const currentTyping = typingUsers[activeConversation._id] || [];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-140px)] bg-[#060D24]/10 relative">
      {/* Header Info */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0B1437]/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
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
          <div>
            <h4 className="text-sm font-semibold text-white">{partner.fullName}</h4>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 capitalize">
              <span
                className={`w-2 h-2 rounded-full ${
                  presence === "online"
                    ? "bg-emerald-500"
                    : presence === "away"
                    ? "bg-amber-500"
                    : "bg-slate-500"
                }`}
              />
              {presence === "online"
                ? "Online"
                : presence === "away"
                ? "Away"
                : partner.lastSeen
                ? `Last seen ${format(new Date(partner.lastSeen), "p, MMM d")}`
                : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Panel */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {loadingMessages ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin text-gold-500" />
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = String(msg.senderId._id || msg.senderId) === String(user._id);

            return (
              <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] p-3.5 rounded-2xl relative border ${
                    isMe
                      ? "bg-gold-500/10 border-gold-500/20 rounded-tr-none text-slate-200"
                      : "bg-[#111C44]/80 border-white/5 rounded-tl-none text-slate-300"
                  }`}
                >
                  {/* Text Content */}
                  {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}

                  {/* Attachments Section */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.attachments.map((file, idx) => {
                        const isImg = [".jpg", ".jpeg", ".png", ".webp"].some((s) =>
                          file.fileName.toLowerCase().endsWith(s)
                        );

                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10 group max-w-full overflow-hidden"
                          >
                            {isImg ? (
                              <ImageIcon size={18} className="text-gold-400 flex-shrink-0" />
                            ) : (
                              <File size={18} className="text-blue-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">
                                {file.fileName}
                              </p>
                              {file.fileSize && (
                                <p className="text-[10px] text-slate-500">
                                  {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDownload(msg._id, idx, file.fileName)}
                              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-gold-500 hover:text-slate-950 flex items-center justify-center transition flex-shrink-0"
                              title="Download attachment"
                            >
                              <Download size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Timestamp and Visual Ticks Status */}
                  <div className="flex items-center justify-end gap-1.5 mt-1.5">
                    <span className="text-[9px] text-slate-500 select-none">
                      {format(new Date(msg.createdAt), "p")}
                    </span>
                    {isMe && (
                      <span className="select-none">
                        {msg.status === "sending" && (
                          <Loader2 size={10} className="animate-spin text-slate-500" />
                        )}
                        {msg.status === "sent" && <Check size={10} className="text-slate-500" />}
                        {msg.status === "delivered" && (
                          <CheckCheck size={10} className="text-slate-500" />
                        )}
                        {msg.status === "read" && (
                          <CheckCheck size={10} className="text-gold-500" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Dynamic Typing Indicator bubble */}
        {currentTyping.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-[#111C44]/40 border border-white/5 rounded-2xl rounded-tl-none p-3 flex items-center gap-2">
              <span className="text-xs text-slate-500 italic">
                {currentTyping.map((t) => t.name).join(", ")} is typing
              </span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce delay-150" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce delay-300" />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Upload/Attachment Pending Previews */}
      {attachments.length > 0 && (
        <div className="p-3 border-t border-white/5 bg-[#0B1437]/90 backdrop-blur flex flex-wrap gap-2">
          {attachments.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1.5 pr-2.5 text-xs text-slate-300 relative group"
            >
              <File size={14} className="text-gold-500" />
              <span className="truncate max-w-[150px]">{file.fileName}</span>
              <button
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="w-4 h-4 rounded bg-white/10 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Message Composer */}
      <div className="p-4 border-t border-white/5 bg-[#0B1437]/50 backdrop-blur-md flex items-end gap-3">
        {/* Attachment upload button */}
        <label className="w-10 h-10 rounded-xl bg-white/5 hover:bg-gold-500/10 hover:border-gold-500/30 border border-white/10 flex items-center justify-center cursor-pointer transition flex-shrink-0">
          <input type="file" onChange={handleFileUpload} className="hidden" />
          {uploading ? (
            <Loader2 size={16} className="animate-spin text-gold-500" />
          ) : (
            <Paperclip size={16} className="text-slate-400 group-hover:text-gold-500" />
          )}
        </label>

        {/* Input box */}
        <textarea
          rows="1"
          placeholder="Type a message..."
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          className="flex-1 max-h-24 min-h-[40px] pl-4 pr-4 py-2.5 rounded-xl text-sm text-white border border-white/10 outline-none resize-none transition-all duration-300 focus:border-gold-500/50"
          style={{ background: "rgba(6, 13, 36, 0.6)" }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!inputText.trim() && attachments.length === 0}
          className="w-10 h-10 rounded-xl bg-gold-500 text-slate-950 font-semibold flex items-center justify-center transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:active:scale-100 flex-shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
