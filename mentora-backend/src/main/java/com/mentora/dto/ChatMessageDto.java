package com.mentora.dto;

import java.time.LocalDateTime;

public class ChatMessageDto {
    private Long id;
    private String senderId;
    private String senderName;
    private String recipientId;
    private String roomId;
    private String content;
    private LocalDateTime sentAt;
    private Boolean isRead;

    public ChatMessageDto() {}

    public ChatMessageDto(Long id, String senderId, String senderName, String recipientId, String roomId, String content, LocalDateTime sentAt, Boolean isRead) {
        this.id = id;
        this.senderId = senderId;
        this.senderName = senderName;
        this.recipientId = recipientId;
        this.roomId = roomId;
        this.content = content;
        this.sentAt = sentAt;
        this.isRead = isRead;
    }

    public static ChatMessageDtoBuilder builder() {
        return new ChatMessageDtoBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public String getRecipientId() { return recipientId; }
    public void setRecipientId(String recipientId) { this.recipientId = recipientId; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }

    public static class ChatMessageDtoBuilder {
        private Long id;
        private String senderId;
        private String senderName;
        private String recipientId;
        private String roomId;
        private String content;
        private LocalDateTime sentAt;
        private Boolean isRead;

        public ChatMessageDtoBuilder id(Long id) { this.id = id; return this; }
        public ChatMessageDtoBuilder senderId(String senderId) { this.senderId = senderId; return this; }
        public ChatMessageDtoBuilder senderName(String senderName) { this.senderName = senderName; return this; }
        public ChatMessageDtoBuilder recipientId(String recipientId) { this.recipientId = recipientId; return this; }
        public ChatMessageDtoBuilder roomId(String roomId) { this.roomId = roomId; return this; }
        public ChatMessageDtoBuilder content(String content) { this.content = content; return this; }
        public ChatMessageDtoBuilder sentAt(LocalDateTime sentAt) { this.sentAt = sentAt; return this; }
        public ChatMessageDtoBuilder isRead(Boolean isRead) { this.isRead = isRead; return this; }

        public ChatMessageDto build() {
            return new ChatMessageDto(id, senderId, senderName, recipientId, roomId, content, sentAt, isRead);
        }
    }
}
