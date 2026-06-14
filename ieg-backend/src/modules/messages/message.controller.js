'use strict';

const service = require('./message.service');
const ApiResponse = require('../../utils/ApiResponse');
const path = require('path');

const getConversations = async (req, res) => {
  const data = await service.getConversations(req.user._id);
  ApiResponse.success(res, data, 'Conversations fetched successfully');
};

const getMessages = async (req, res) => {
  const data = await service.getMessages(req.user._id, req.params.conversationId);
  ApiResponse.success(res, data, 'Messages fetched successfully');
};

const initiateConversation = async (req, res) => {
  const data = await service.initiateConversation(req.user._id, req.body.participantId);
  ApiResponse.success(res, data, 'Conversation initiated successfully');
};

const uploadAttachment = async (req, res) => {
  const data = await service.uploadAttachment(req.user._id, req.file);
  ApiResponse.created(res, data, 'Attachment uploaded successfully');
};

const downloadAttachment = async (req, res) => {
  const index = parseInt(req.params.index, 10);
  const result = await service.getAttachmentDetails(
    req.user._id,
    req.params.messageId,
    index,
    req.user.role
  );

  if (result.cloudinaryUrl) {
    return res.json({ url: result.cloudinaryUrl, fileName: result.attachment.fileName });
  }

  res.download(result.localPath, result.attachment.fileName);
};

const viewAttachment = async (req, res) => {
  const index = parseInt(req.params.index, 10);
  const result = await service.getAttachmentDetails(
    req.user._id,
    req.params.messageId,
    index,
    req.user.role
  );

  if (result.cloudinaryUrl) {
    return res.json({ url: result.cloudinaryUrl, fileName: result.attachment.fileName });
  }

  res.setHeader('Content-Type', result.attachment.fileType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(result.attachment.fileName)}"`);
  res.sendFile(path.resolve(result.localPath));
};

module.exports = {
  getConversations,
  getMessages,
  initiateConversation,
  uploadAttachment,
  downloadAttachment,
  viewAttachment,
};
