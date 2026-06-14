const router = require('express').Router();
const ctrl = require('./message.controller');
const authenticate = require('../../middleware/authenticate');
const multer = require('multer');

// Setup generic memory storage multer for chat attachment handling.
// Validation rules (file size, extensions, mime-types) are executed inside the service layers.
const attachmentParser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB raw multipart parser limit
});

// Protect all messaging routes
router.use(authenticate);

router.get('/conversations', ctrl.getConversations);
router.get('/conversations/:conversationId', ctrl.getMessages);
router.post('/conversations/initiate', ctrl.initiateConversation);
router.post('/upload', attachmentParser.single('file'), ctrl.uploadAttachment);

router.get('/attachments/:messageId/:index/download', ctrl.downloadAttachment);
router.get('/attachments/:messageId/:index/view', ctrl.viewAttachment);

module.exports = router;
