package com.mentora.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "recipient_id")
    private User recipient;

    @Column(name = "room_id")
    private String roomId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "is_read")
    private Boolean isRead = false;

    public ChatMessage() {}

    public ChatMessage(Long id, User sender, User recipient, String roomId, String content, LocalDateTime sentAt, Boolean isRead) {
        this.id = id;
        this.sender = sender;
        this.recipient = recipient;
        this.roomId = roomId;
        this.content = content;
        this.sentAt = sentAt;
        this.isRead = isRead != null ? isRead : false;
    }

    public static ChatMessageBuilder builder() {
        return new ChatMessageBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }

    public User getRecipient() { return recipient; }
    public void setRecipient(User recipient) { this.recipient = recipient; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }

    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }

    @PrePersist
    protected void onCreate() {
        this.sentAt = LocalDateTime.now();
    }

    public static class ChatMessageBuilder {
        private Long id;
        private User sender;
        private User recipient;
        private String roomId;
        private String content;
        private LocalDateTime sentAt;
        private Boolean isRead = false;

        public ChatMessageBuilder id(Long id) { this.id = id; return this; }
        public ChatMessageBuilder sender(User sender) { this.sender = sender; return this; }
        public ChatMessageBuilder recipient(User recipient) { this.recipient = recipient; return this; }
        public ChatMessageBuilder roomId(String roomId) { this.roomId = roomId; return this; }
        public ChatMessageBuilder content(String content) { this.content = content; return this; }
        public ChatMessageBuilder sentAt(LocalDateTime sentAt) { this.sentAt = sentAt; return this; }
        public ChatMessageBuilder isRead(Boolean isRead) { this.isRead = isRead; return this; }

        public ChatMessage build() {
            return new ChatMessage(id, sender, recipient, roomId, content, sentAt, isRead);
        }
    }
}
