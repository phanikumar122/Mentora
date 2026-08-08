package com.mentora.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "discussion_posts")
public class DiscussionPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Enumerated(EnumType.STRING)
    private PostCategory category;

    @Column(name = "upvotes_count")
    private Integer upvotesCount = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DiscussionReply> replies = new ArrayList<>();

    public DiscussionPost() {}

    public DiscussionPost(Long id, String title, String content, User author, PostCategory category, Integer upvotesCount, LocalDateTime createdAt, List<DiscussionReply> replies) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.author = author;
        this.category = category;
        this.upvotesCount = upvotesCount != null ? upvotesCount : 0;
        this.createdAt = createdAt;
        this.replies = replies != null ? replies : new ArrayList<>();
    }

    public static DiscussionPostBuilder builder() {
        return new DiscussionPostBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    public PostCategory getCategory() { return category; }
    public void setCategory(PostCategory category) { this.category = category; }

    public Integer getUpvotesCount() { return upvotesCount; }
    public void setUpvotesCount(Integer upvotesCount) { this.upvotesCount = upvotesCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<DiscussionReply> getReplies() { return replies; }
    public void setReplies(List<DiscussionReply> replies) { this.replies = replies; }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public static class DiscussionPostBuilder {
        private Long id;
        private String title;
        private String content;
        private User author;
        private PostCategory category;
        private Integer upvotesCount = 0;
        private LocalDateTime createdAt;
        private List<DiscussionReply> replies = new ArrayList<>();

        public DiscussionPostBuilder id(Long id) { this.id = id; return this; }
        public DiscussionPostBuilder title(String title) { this.title = title; return this; }
        public DiscussionPostBuilder content(String content) { this.content = content; return this; }
        public DiscussionPostBuilder author(User author) { this.author = author; return this; }
        public DiscussionPostBuilder category(PostCategory category) { this.category = category; return this; }
        public DiscussionPostBuilder upvotesCount(Integer upvotesCount) { this.upvotesCount = upvotesCount; return this; }
        public DiscussionPostBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public DiscussionPostBuilder replies(List<DiscussionReply> replies) { this.replies = replies; return this; }

        public DiscussionPost build() {
            return new DiscussionPost(id, title, content, author, category, upvotesCount, createdAt, replies);
        }
    }
}
