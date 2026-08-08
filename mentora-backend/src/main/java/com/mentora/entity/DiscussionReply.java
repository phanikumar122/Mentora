package com.mentora.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "discussion_replies")
public class DiscussionReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private DiscussionPost post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "is_accepted_answer")
    private Boolean isAcceptedAnswer = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public DiscussionReply() {}

    public DiscussionReply(Long id, DiscussionPost post, User author, String content, Boolean isAcceptedAnswer, LocalDateTime createdAt) {
        this.id = id;
        this.post = post;
        this.author = author;
        this.content = content;
        this.isAcceptedAnswer = isAcceptedAnswer != null ? isAcceptedAnswer : false;
        this.createdAt = createdAt;
    }

    public static DiscussionReplyBuilder builder() {
        return new DiscussionReplyBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public DiscussionPost getPost() { return post; }
    public void setPost(DiscussionPost post) { this.post = post; }

    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Boolean getIsAcceptedAnswer() { return isAcceptedAnswer; }
    public void setIsAcceptedAnswer(Boolean isAcceptedAnswer) { this.isAcceptedAnswer = isAcceptedAnswer; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public static class DiscussionReplyBuilder {
        private Long id;
        private DiscussionPost post;
        private User author;
        private String content;
        private Boolean isAcceptedAnswer = false;
        private LocalDateTime createdAt;

        public DiscussionReplyBuilder id(Long id) { this.id = id; return this; }
        public DiscussionReplyBuilder post(DiscussionPost post) { this.post = post; return this; }
        public DiscussionReplyBuilder author(User author) { this.author = author; return this; }
        public DiscussionReplyBuilder content(String content) { this.content = content; return this; }
        public DiscussionReplyBuilder isAcceptedAnswer(Boolean isAcceptedAnswer) { this.isAcceptedAnswer = isAcceptedAnswer; return this; }
        public DiscussionReplyBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public DiscussionReply build() {
            return new DiscussionReply(id, post, author, content, isAcceptedAnswer, createdAt);
        }
    }
}
