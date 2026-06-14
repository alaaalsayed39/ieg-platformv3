const mongoose = require('mongoose');

const chatSettingSchema = new mongoose.Schema(
  {
    chatEnabled: {
      type: Boolean,
      default: true,
    },
    fileSharingEnabled: {
      type: Boolean,
      default: true,
    },
    imageSharingEnabled: {
      type: Boolean,
      default: true,
    },
    readReceiptsEnabled: {
      type: Boolean,
      default: true,
    },
    typingIndicatorsEnabled: {
      type: Boolean,
      default: true,
    },
    onlineStatusVisible: {
      type: Boolean,
      default: true,
    },
    maxFileSize: {
      type: Number,
      default: 10 * 1024 * 1024, // 10MB default
    },
    allowedFileTypes: {
      type: [String],
      default: ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
    },
    presenceTimeout: {
      type: Number,
      default: 5, // 5 minutes inactivity
    },
    retentionPeriod: {
      type: Number,
      default: 365, // 365 days retention
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ChatSetting', chatSettingSchema);
