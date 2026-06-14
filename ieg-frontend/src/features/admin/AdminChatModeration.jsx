import React, { useState, useEffect } from "react";
import api from "../../config/api";
import {
  Settings,
  MessageSquare,
  AlertTriangle,
  Save,
  ShieldAlert,
  ShieldCheck,
  UserX,
  UserCheck,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function AdminChatModeration() {
  const [activeTab, setActiveTab] = useState("settings");
  const [loading, setLoading] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    chatEnabled: true,
    fileSharingEnabled: true,
    imageSharingEnabled: true,
    readReceiptsEnabled: true,
    typingIndicatorsEnabled: true,
    onlineStatusVisible: true,
    maxFileSize: 10 * 1024 * 1024,
    allowedFileTypes: [],
    presenceTimeout: 5,
    retentionPeriod: 365,
  });

  // Logs / Violations state
  const [conversations, setConversations] = useState([]);
  const [blockedLogs, setBlockedLogs] = useState([]);
  const [selectedChatMessages, setSelectedChatMessages] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    fetchSettings();
    if (activeTab === "logs") fetchChatLogs();
    if (activeTab === "violations") fetchBlockedLogs();
  }, [activeTab]);

  // Fetch settings
  const fetchSettings = async () => {
    try {
      const { data } = await api.get("/admin/chat/settings");
      setSettings(data.data);
    } catch (err) {
      toast.error("Failed to load chat settings");
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await api.put("/admin/chat/settings", settings);
      toast.success("Chat settings updated successfully");
    } catch (err) {
      toast.error("Failed to update chat settings");
    } finally {
      setLoading(false);
    }
  };

  // Fetch conversations (audit logs)
  const fetchChatLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/chat/logs");
      setConversations(data.data || []);
    } catch (err) {
      toast.error("Failed to load chat logs");
    } finally {
      setLoading(false);
    }
  };

  // Fetch contact violations
  const fetchBlockedLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/chat/blocked-logs");
      setBlockedLogs(data.data || []);
    } catch (err) {
      toast.error("Failed to load contact violation logs");
    } finally {
      setLoading(false);
    }
  };

  // Suspend/Unsuspend user chat access
  const handleToggleSuspension = async (userId, currentSuspended) => {
    const action = currentSuspended ? "restore" : "suspend";
    const targetStatus = !currentSuspended;

    try {
      await api.patch(`/admin/chat/users/${userId}/suspend`, {
        isChatSuspended: targetStatus,
      });
      toast.success(`User chat access ${targetStatus ? "suspended" : "restored"}`);

      // Refresh current tab data
      if (activeTab === "logs") fetchChatLogs();
      if (activeTab === "violations") fetchBlockedLogs();
    } catch (err) {
      toast.error(`Failed to ${action} user chat access`);
    }
  };

  // View specific conversation messages
  const handleViewMessages = async (convId) => {
    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/messages/conversations/${convId}`);
      setSelectedChatMessages(data.data || []);
    } catch (err) {
      toast.error("Failed to fetch conversation history");
    } finally {
      setLoadingMessages(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-white">
      {/* Tab Selectors */}
      <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === "settings"
              ? "bg-gold-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Settings size={16} /> Chat Settings
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === "logs"
              ? "bg-gold-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <MessageSquare size={16} /> Chat Logs
        </button>
        <button
          onClick={() => setActiveTab("violations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === "violations"
              ? "bg-gold-500 text-slate-950 shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <AlertTriangle size={16} /> Contact Violations
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="ieg-card p-6 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="font-display font-bold text-lg">Global Chat Configurations</h3>
            <p className="text-xs text-slate-400">Configure global switches, file upload validations, and restrictions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-sm font-semibold">Enable Internal Chat</p>
                  <p className="text-[11px] text-slate-500">Enable or disable the chat system globally for all buyers and exporters.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.chatEnabled}
                  onChange={(e) => setSettings({ ...settings, chatEnabled: e.target.checked })}
                  className="w-4 h-4 accent-gold-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-sm font-semibold">Enable File Sharing</p>
                  <p className="text-[11px] text-slate-500">Allow users to attach documents and sheets in conversations.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.fileSharingEnabled}
                  onChange={(e) => setSettings({ ...settings, fileSharingEnabled: e.target.checked })}
                  className="w-4 h-4 accent-gold-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-sm font-semibold">Enable Image Sharing</p>
                  <p className="text-[11px] text-slate-500">Allow users to upload pictures directly in chat bubbles.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.imageSharingEnabled}
                  onChange={(e) => setSettings({ ...settings, imageSharingEnabled: e.target.checked })}
                  className="w-4 h-4 accent-gold-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5">
                <div>
                  <p className="text-sm font-semibold">Show Read Receipts</p>
                  <p className="text-[11px] text-slate-500">Display ticks indicating whether messages are delivered and read.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.readReceiptsEnabled}
                  onChange={(e) => setSettings({ ...settings, readReceiptsEnabled: e.target.checked })}
                  className="w-4 h-4 accent-gold-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Numeric Values & Input Configs */}
            <div className="space-y-4">
              <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-white/5 border border-white/5">
                <label className="text-sm font-semibold">Max File Upload Size (MB)</label>
                <input
                  type="number"
                  value={settings.maxFileSize / (1024 * 1024)}
                  onChange={(e) => setSettings({ ...settings, maxFileSize: parseFloat(e.target.value) * 1024 * 1024 })}
                  className="px-3 py-2.5 rounded-lg text-white border border-white/10 outline-none focus:border-gold-500/50 bg-[#060D24]/60"
                />
              </div>

              <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-white/5 border border-white/5">
                <label className="text-sm font-semibold">Presence Away Timeout (Minutes)</label>
                <input
                  type="number"
                  value={settings.presenceTimeout}
                  onChange={(e) => setSettings({ ...settings, presenceTimeout: parseInt(e.target.value, 10) })}
                  className="px-3 py-2.5 rounded-lg text-white border border-white/10 outline-none focus:border-gold-500/50 bg-[#060D24]/60"
                />
              </div>

              <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-white/5 border border-white/5">
                <label className="text-sm font-semibold">Log Retention Period (Days)</label>
                <input
                  type="number"
                  value={settings.retentionPeriod}
                  onChange={(e) => setSettings({ ...settings, retentionPeriod: parseInt(e.target.value, 10) })}
                  className="px-3 py-2.5 rounded-lg text-white border border-white/10 outline-none focus:border-gold-500/50 bg-[#060D24]/60"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="btn-gold px-6 py-2.5 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin text-slate-950" />
              ) : (
                <Save size={16} />
              )}
              Save Configurations
            </button>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 ieg-card p-6 space-y-4">
            <div>
              <h3 className="font-display font-bold text-lg">Conversation Audit Trail</h3>
              <p className="text-xs text-slate-400">View platform chat histories, activities, and suspend access.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-xs">
                    <th className="pb-3 font-semibold">Participants</th>
                    <th className="pb-3 font-semibold">Last Message</th>
                    <th className="pb-3 font-semibold">Last Activity</th>
                    <th className="pb-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {conversations.map((conv) => {
                    const u1 = conv.participants[0] || { fullName: "Deleted User" };
                    const u2 = conv.participants[1] || { fullName: "Deleted User" };

                    return (
                      <tr key={conv._id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 pr-2">
                          <p className="font-semibold text-white text-xs">{u1.fullName}</p>
                          <span className="text-[10px] text-slate-500 capitalize">{u1.role}</span>
                          <p className="text-slate-500 text-[10px] border-t border-white/5 mt-1 pt-1">
                            {u2.fullName} <span className="capitalize">({u2.role})</span>
                          </p>
                        </td>
                        <td className="py-3.5 text-xs text-slate-400 max-w-[200px] truncate">
                          {conv.lastMessage || "No messages"}
                        </td>
                        <td className="py-3.5 text-xs text-slate-500">
                          {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), "p, MMM d") : "N/A"}
                        </td>
                        <td className="py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewMessages(conv._id)}
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-gold-500 hover:text-slate-950 text-xs transition"
                            >
                              Audit Messages
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Chat Viewer */}
          <div className="ieg-card p-6 flex flex-col h-[500px]">
            <h4 className="font-display font-bold text-sm border-b border-white/5 pb-2 mb-3">
              Message History View
            </h4>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="animate-spin text-gold-500" />
                </div>
              ) : selectedChatMessages ? (
                selectedChatMessages.map((msg) => (
                  <div key={msg._id} className="p-3 bg-white/5 border border-white/5 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-gold-500">
                        {msg.senderId?.fullName}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {format(new Date(msg.createdAt), "p")}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-300">{msg.content}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-slate-600 text-xs text-center p-4">
                  Select "Audit Messages" to load history.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Violations Tab */}
      {activeTab === "violations" && (
        <div className="ieg-card p-6 space-y-4">
          <div>
            <h3 className="font-display font-bold text-lg text-red-400">Blocked Contact Exchange Attempts</h3>
            <p className="text-xs text-slate-400">
              Review flagged and rejected messages containing phone numbers, emails, or social media bypass identifiers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs">
                  <th className="pb-3 font-semibold">Sender Details</th>
                  <th className="pb-3 font-semibold">Intended Receiver</th>
                  <th className="pb-3 font-semibold">Flagged Content</th>
                  <th className="pb-3 font-semibold">Detected Violations</th>
                  <th className="pb-3 font-semibold">Time</th>
                  <th className="pb-3 font-semibold text-center">Chat Suspension</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {blockedLogs.map((log) => {
                  const sender = log.senderId || { fullName: "Deleted" };
                  const receiver = log.receiverId || { fullName: "Deleted" };

                  return (
                    <tr key={log._id} className="hover:bg-red-500/5 transition-colors">
                      <td className="py-3.5 pr-2">
                        <p className="font-semibold text-white text-xs">{sender.fullName}</p>
                        <span className="text-[10px] text-slate-500">{sender.email}</span>
                      </td>
                      <td className="py-3.5 pr-2">
                        <p className="font-semibold text-slate-300 text-xs">{receiver.fullName}</p>
                        <span className="text-[10px] text-slate-500">{receiver.email}</span>
                      </td>
                      <td className="py-3.5 text-xs text-red-300 max-w-[200px] break-words">
                        "{log.content}"
                      </td>
                      <td className="py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {log.blockedPatterns.map((pat, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-mono"
                            >
                              {pat}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 text-xs text-slate-500">
                        {format(new Date(log.createdAt), "p, MMM d")}
                      </td>
                      <td className="py-3.5 text-center">
                        <button
                          onClick={() => handleToggleSuspension(sender._id, sender.isChatSuspended)}
                          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 mx-auto text-xs transition font-semibold ${
                            sender.isChatSuspended
                              ? "bg-emerald-500 text-slate-950 hover:bg-emerald-600"
                              : "bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-slate-950"
                          }`}
                        >
                          {sender.isChatSuspended ? (
                            <>
                              <ShieldCheck size={14} /> Restore Access
                            </>
                          ) : (
                            <>
                              <ShieldAlert size={14} /> Suspend Chat
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
