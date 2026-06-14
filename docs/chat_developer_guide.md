# Developer Guide — Real-Time Internal Chat System

This developer guide contains description details of every created and modified file, database model, controller, service, route, socket event, and utility helper. Each section includes an English Explanation and a detailed Egyptian Arabic ("الشرح ") version.

---

## 1. Database Models (Mongoose Schemas)

### 1.1 `message.model.js`
**Path:** `ieg-backend/src/modules/messages/message.model.js`  
**Purpose:** Defines the `Conversation` and `Message` collections.

- **English Explanation:**
  The `Conversation` schema keeps track of the `participants` list (both buyers and exporters) and records the `lastMessage` with its timestamp. The `Message` schema logs specific chat bubbles, attachment details, delivery statuses (`sending`, `sent`, `delivered`, `read`), and timestamps for delivery and reading. It features a Mongoose `pre-save` hook to sync the legacy `isRead` boolean with the `status` enum so that database seeds and lookups remain consistent.
  
- **الشرح :**
  الملف ده بيعرّف جداول الداتابيز (الموديلز) بتاعة الشات. أول جدول هو `Conversation` وده بيسجل الغرف أو المحادثات بين الأطراف (المستورد والمصدر) ومين هما المشتركين فيها، وآخر رسالة اتبعتت ووقتها عشان الترتيب. تاني جدول هو `Message` وده بيسجل تفاصيل كل رسالة بتتبعت: المحتوى، مين بعتها ومين استقبلها، الفايلات المرفقة (لو فيه)، وحالتها الحالية زي (sent لو اتبعتت، delivered لو وصلت لموبايل/كمبيوتر الطرف التاني، و read لو فتح الشات وشافها). كمان فيه `pre-save hook` بيشتغل تلقائيًا عشان يظبط حالة الـ `isRead` والـ `status` مع بعض عشان الداتا تفضل متناسقة.

---

### 1.2 `chatSetting.model.js`
**Path:** `ieg-backend/src/modules/messages/chatSetting.model.js`  
**Purpose:** Holds global settings configurations.

- **English Explanation:**
  Implements a singleton config model to manage administrative controls over chat permissions, image/file sharing toggle states, visual ticks, presence timers, allowed MIME extensions, and file size limits.
  
- **الشرح :**
  ده موديل لإعدادات الشات العامة اللي بيتحكم فيها الأدمن من لوحة التحكم بتاعته. بيسمحله يقفل الشات خالص أو يفتحه، يوقف رفع الفايلات أو يفعله، يحدد الحد الأقصى لحجم الفايل المرفوع (مثلاً 10 ميجا)، ويحدد الامتدادات المسموح بيها (زي pdf أو docx). كمان فيه وقت الخمول اللي بعده اليوزر يتحول لـ "Away" تلقائيًا.

---

### 1.3 `blockedLog.model.js`
**Path:** `ieg-backend/src/modules/messages/blockedLog.model.js`  
**Purpose:** Stores rejected contact exchange attempts.

- **English Explanation:**
  Logs messages rejected because they contain phone numbers, obfuscated emails, or social media handles. This provides admins with direct evidence of violation attempts for user suspension decisions.
  
- **الشرح :**
  الملف ده بيسجل "محاولات المخالفة" لما يوزر يحاول يبعت رقم تليفونه أو إيميله أو حساب تليجرام/واتساب للطرف التاني. السيستم بيمسكها، يمنع الرسالة من الوصول، ويسجل في الموديل ده بيانات الراسل والمستقبل، نص الرسالة الأصلي، والحاجات اللي اتمسكت عشان الأدمن يقدر يراجعها وياخد قرار بوقف حساب اليوزر ده.

---

## 2. Core Backend Services & Logic

### 2.1 `contactEngine.js`
**Path:** `ieg-backend/src/modules/messages/contactEngine.js`  
**Purpose:** Scans and filters out contact-sharing details.

- **English Explanation:**
  Maintains the regex verification rules. It converts English and Arabic word numbers into digits, strips formatting spaces/punctuation, and runs verification checks for standard email paths, obfuscated emails (e.g. `[at]`, `dot`), direct handles, and numeric sequences of 8 or more digits.
  
- **الشرح :**
  ده محرك الفلترة اللي بيمسك أي محاولة لتبادل أرقام التواصل. بيشتغل كالتالي: بيحول الكلمات المكتوبة لأرقام (زي "zero" أو "واحد" يخليها "0" و "1")، بعدين بيشيل المسافات والنقط والشرطات من الأرقام، ولو لقى 8 أرقام أو أكتر ورا بعض بيمسكها كـ "رقم تليفون". كمان فيه ريجيكس (Regex) ذكي بيمسك الإيميلات العادية والمخفية (زي name at gmail dot com) وروابط السوشيال ميديا وتليجرام.

---

### 2.2 `socket.js`
**Path:** `ieg-backend/src/sockets/socket.js`  
**Purpose:** Powering the Socket.IO server.

- **English Explanation:**
  - `init(server)`: Attaches Socket.IO, checks and verifies JWT token handshakes, sets up connection events.
  - `join:conversation`: Marks unread messages as read and emits status updates.
  - `message:send`: Validates limits, scans for contact sharing via `contactEngine`, registers message record, sets status (read/delivered/sent), and emits events.
  - `presence:away` / `presence:active`: Broadcasts live user active status changes.
  
- **الشرح :**
  ده قلب السيستم الفعلي للوقت الحقيقي (Real-time).
  - ميثود `init`: بتشغل سوكت آي أو مع السيرفر وتتأكد من توكن الدخول (JWT) الخاص باليوزر وتمنعه لو حسابه محظور.
  - حدث `join:conversation`: لما اليوزر يدخل شات معين، السيستم بيحول كل الرسائل اللي مبعوتاله في الشات ده لـ "قُرأت" ويبعت إشعار للطرف التاني.
  - حدث `message:send`: بياخد الرسالة من السوكت، يتأكد إن الشات شغال، يفلترها ضد تبادل الأرقام، يسجلها في الداتابيز، ويبعتها فورًا للمستقبل لو فاتح، أو يحطها كـ "وصلت" (delivered) لو أونلاين بس مش فاتح المحادثة دي، أو "اتبعتت" (sent) لو أوفلاين.

---

### 2.3 `message.service.js`
**Path:** `ieg-backend/src/modules/messages/message.service.js`  
**Purpose:** Handles DB queries, downloads, and uploads.

- **English Explanation:**
  Contains services to query active lists (`getConversations`), load message logs (`getMessages`), handle conversation creation requests (`initiateConversation`), and manage secure attachment streams (`getAttachmentDetails`) with JWT scope checking.
  
- **الشرح :**
  السيرفيس دي مسؤولة عن جلب البيانات وتجهيزها:
  - `getConversations`: بتجيب لليوزر لستة الشاتات بتاعته وتجيب مع كل شات صورة واسم الطرف التاني وحالته (أونلاين/أوفلاين) وعدد الرسائل اللي لسة مقراهاش.
  - `getMessages`: بتجيب تاريخ الرسايل (آخر 100 رسالة) وتغير حالة الرسايل الغير مقروءة لـ "مقروءة".
  - `uploadAttachment`: بتتأكد من شروط رفع الملفات (الحجم والنوع) وترفعها إما على لوكال سيرفر أو كلاوديناري.
  - `getAttachmentDetails`: بتتحقق إن اليوزر اللي بيحاول يحمل الملف هو فعلاً طرف في المحادثة أو أدمن، عشان ميبقاش فيه أي تسريب للملفات.

---

## 3. Frontend Store & Views

### 3.1 `chatStore.js`
**Path:** `ieg-frontend/src/store/chatStore.js`  
**Purpose:** Frontend Zustand state manager.

- **English Explanation:**
  Connects to the Socket.IO client using the current auth accessToken, subscribes to socket presence/message streams, handles state updates for conversations and messages, and dispatches typing indicator states.
  
- **الشرح :**
  ده مخزن الحالة (Zustand Store) في الفرونت إند. بيفتح اتصال السوكت باستخدام التوكن بتاع اليوزر، وبيسمع لكل الأحداث اللي جاية من السيرفر (زي رسالة جديدة، تغير حالة يوزر لأونلاين/أوفلاين، حد بيكتب دلوقتي "typing"، أو إشعار برسالة جديدة). وبيحدث الشاشة فورًا بدون ما تحتاج تعمل ريفريش.

---

###3.2 `ChatPage.jsx`, `ChatSidebar.jsx`, `ChatWindow.jsx`
**Path:** `ieg-frontend/src/components/chat/`  
**Purpose:** Beautiful responsive UI views.

- **English Explanation:**
  - `ChatPage`: Initializes the socket connection on mount and cleans up on unmount.
  - `ChatSidebar`: Implements conversation search, avatars, and online status badges.
  - `ChatWindow`: Renders scrollable message bubbles with dynamic tick marks (sent, delivered, read), file upload forms, attachment previews, and typing indicators.
  
- **الشرح :**
  - `ChatPage`: الشل أو الحاوية الكبيرة اللي بتفتح اتصال السوكت أول ما تفتح الصفحة وتقفله أول ما تخرج منها.
  - `ChatSidebar`: القائمة الجانبية اللي بتعرض الأشخاص اللي بتكلمهم، وفيها بحث بالاسم، وصورة اليوزر، ونقطة خضرا منورة لو أونلاين، وعداد للرسائل الجديدة.
  - `ChatWindow`: شباك الدردشة نفسه. بيعرض الرسايل بشكل شيك (يمين للمبعوت وشمال للمستقبل) وتحت كل رسالة وقتها وعلامات الصح الصح الزرقا والرمادية. كمان فيه زرار رفع الفايلات، مكان الكتابة، ومؤشر "يكتب الآن...".

---

### 4. Admin Control Panel

### 4.1 `AdminChatModeration.jsx`
**Path:** `ieg-frontend/src/features/admin/AdminChatModeration.jsx`  
**Purpose:** Admin dashboard console controls.

- **English Explanation:**
  Provides the admin with toggles to enable/disable features, edit limitations, view active platform chat lists with message auditer frames, review contact sharing violations table, and suspend chat permissions for specific users.
  
- **الشرح :**
  لوحة تحكم الأدمن الخاصة بالشات. بتنقسم لتلات أقسام:
  1. الإعدادات: يقدر يقفل الشات، يغير حجم الملف الأقصى، يعدل أنواع الفايلات المقبولة.
  2. سجل المحادثات: بيعرض كل المحادثات اللي بتدور في المنصة ويقدر يدوس على أي واحدة عشان يقرأ تاريخ الشات (مراقبة لضمان الأمان).
  3. المخالفات: بتجيب جدول بكل الرسائل المخالفة اللي اتمسكت وفيها زرار "حظر الشات" أو "فك الحظر" لليوزر المخالف.
