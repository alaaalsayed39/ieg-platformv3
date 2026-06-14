# Technical Documentation — Real-Time Internal Chat System

This document provides a comprehensive technical overview of the real-time internal chat system implemented between Importers (Buyers) and Exporters on the IEG Platform.

---

## Architecture Overview

The system uses a hybrid model of **REST API** (for history queries and file uploads) and **WebSockets / Socket.IO** (for instant messaging status propagation, typing states, and real-time presence indicators).

```
 ┌────────────────┐           WebSocket (Socket.io)           ┌────────────────┐
 │                │ ◄───────────────────────────────────────► │                │
 │  Buyer Client  │                                           │ Exporter Client│
 │   (Frontend)   │ ◄──────────┐                 ┌──────────► │   (Frontend)   │
 └───────┬────────┘            │                 │            └───────┬────────┘
         │                     ▼                 ▼                    │
         │ REST Upload    ┌───────────────────────────┐               │ REST Upload
         └──────────────► │  Node.js + Express + S.IO │ ◄─────────────┘
                          │      Backend Server       │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
                               ┌─────────────────┐
                               │   MongoDB DB    │
                               └─────────────────┘
```

1. **Authentication Handshake**: Socket.IO connections are authenticated at handshake using JWT access tokens passed via the auth payload.
2. **Presence Sync**: User presence is stored dynamically in Mongoose (`online`, `away`, `offline`) and matched with an in-memory session mapping inside the socket service for high-performance status broadcasts.
3. **Delivery Lifecycle**:
   - **Sending**: Message is emitted or saved.
   - **Sent**: Saved to MongoDB.
   - **Delivered**: Emitted to recipient socket and acknowledged (if online).
   - **Read**: Read receipt emitted when recipient enters the conversation window.

---

## Database Schema

### `Conversation`
- `participants`: `[ObjectId]` (ref: `'User'`) — Indexed array.
- `lastMessage`: `String` — Preview of the latest message.
- `lastMessageAt`: `Date` — Timestamp of last activity (for sorting conversations).

### `Message`
- `conversationId`: `ObjectId` (ref: `'Conversation'`) — Compound index with `createdAt`.
- `senderId`: `ObjectId` (ref: `'User'`).
- `receiverId`: `ObjectId` (ref: `'User'`) — Indexed with `isRead` for fast unread counters.
- `content`: `String` — Text content.
- `isRead`: `Boolean` — Flag for read status (synced with `status === 'read'`).
- `status`: `String` (`'sending'`, `'sent'`, `'delivered'`, `'read'`).
- `attachments`: `Array` of `{ fileName, fileUrl, fileType, fileSize, publicId }`.
- `deliveredAt`: `Date` — Set when recipient is online.
- `readAt`: `Date` — Set when recipient opens conversation.
- `createdAt`: `Date` — Message time.

### `ChatSetting` (Global Singleton)
- `chatEnabled`: `Boolean` — Global kill switch.
- `fileSharingEnabled`: `Boolean` — Global document toggle.
- `imageSharingEnabled`: `Boolean` — Global image toggle.
- `readReceiptsEnabled`: `Boolean` — Enables status check ticks.
- `typingIndicatorsEnabled`: `Boolean` — Enables typing indicators.
- `onlineStatusVisible`: `Boolean` — Enables presence indicator dots.
- `maxFileSize`: `Number` — Upload size cap (default: 10MB).
- `allowedFileTypes`: `[String]` — Supported extensions.
- `presenceTimeout`: `Number` — Minutes before marking inactive users as `away`.
- `retentionPeriod`: `Number` — Logs retention limit (days).

### `BlockedLog` (Moderation Audit Logs)
- `senderId`: `ObjectId` (ref: `'User'`).
- `receiverId`: `ObjectId` (ref: `'User'`).
- `content`: `String` — Raw blocked message content.
- `blockedPatterns`: `[String]` — Flagged text snippets (phones, emails, etc.).
- `createdAt`: `Date`.

---

##  REST API Endpoints

All endpoints are prefix-mounted at `/api/v1` and require an `Authorization: Bearer <token>` header.

### Messaging API (`/messages`)
- `GET /conversations`: Returns a list of conversations for the logged-in user, populated with partner profile info and live unread counts.
- `GET /conversations/:conversationId`: Retrieves the last 100 messages of the conversation and automatically marks incoming unread messages as read.
- `POST /conversations/initiate`: Starts or retrieves a conversation with a specified participant ID (Exporter or Buyer).
- `POST /upload`: Uploads an attachment to disk or Cloudinary (supports pdf, doc, xls, images).
- `GET /attachments/:messageId/:index/download`: Checks permissions and streams local files or returns Cloudinary URLs.
- `GET /attachments/:messageId/:index/view`: Checks permissions and streams inline files for in-browser preview.

### Admin Moderation API (`/admin/chat`)
- `GET /chat/settings`: Fetch current chat configuration settings.
- `PUT /chat/settings`: Modify settings.
- `GET /chat/logs`: Lists all conversations for manual admin audit.
- `GET /chat/blocked-logs`: Lists all contact bypass attempts block history.
- `PATCH /chat/users/:id/suspend`: Toggle user suspension state `isChatSuspended`.

---

##  Socket.IO Event Reference

### Emitters (Client to Server)
- `join:conversation`: `conversationId` — Joins conversation room and marks messages as read.
- `message:send`: `{ conversationId, receiverId, content, attachments }` — Sends message.
- `message:typing`: `{ conversationId }` — Emits typing status.
- `message:stop_typing`: `{ conversationId }` — Clears typing status.
- `presence:away`: — Updates user presence status to away.
- `presence:active`: — Restores presence status to online.

### Listeners (Server to Client)
- `presence:initial`: `[{ userId, status }]` — Initial presence status list of online users.
- `presence:update`: `{ userId, status, lastSeen }` — Emitted on partner status shifts.
- `message:new`: `Message` — Receives new message in room.
- `message:status_update`: `{ conversationId, messageIds, status, readAt }` — Syncs ticks.
- `message:typing`: `{ userId, name }` — Shows writing status.
- `message:stop_typing`: `{ userId }` — Removes writing bubble.
- `message:notification`: `{ from, content, conversationId }` — Triggers alert badge.

---

##  Security Decisions

1. **Strict Token Verification**: WebSocket handshakes are guarded using the same JWT access token verification middleware used by Express.
2. **Scope Isolation**: Users can only query conversation lists, messages, and attachments where they are explicitly registered as one of the two participants.
3. **Contact Sharing Protection**: Client-side blocks prevent instant emission, while server-side regex scans check messages for spaced/obfuscated emails, phone numbers, and social media handles. Flagged attempts are discarded, and blocked logs are saved for admin review.
4. **File validation**: Extension, MIME-type, and file-size constraints are validated dynamically against `ChatSetting` specifications on upload. Script, executable, and archive types are banned.
5. **Channel Suspension**: Suspended users are booted from the WebSocket server and blocked from executing any chat REST requests.
