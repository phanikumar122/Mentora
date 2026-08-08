package com.mentora.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "announcements")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NoticePriority priority;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_department_id")
    private Department targetDepartment;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Announcement() {}

    public Announcement(Long id, String title, String content, User author, NoticePriority priority, Department targetDepartment, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.author = author;
        this.priority = priority;
        this.targetDepartment = targetDepartment;
        this.createdAt = createdAt;
    }

    public static AnnouncementBuilder builder() {
        return new AnnouncementBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    public NoticePriority getPriority() { return priority; }
    public void setPriority(NoticePriority priority) { this.priority = priority; }

    public Department getTargetDepartment() { return targetDepartment; }
    public void setTargetDepartment(Department targetDepartment) { this.targetDepartment = targetDepartment; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public static class AnnouncementBuilder {
        private Long id;
        private String title;
        private String content;
        private User author;
        private NoticePriority priority;
        private Department targetDepartment;
        private LocalDateTime createdAt;

        public AnnouncementBuilder id(Long id) { this.id = id; return this; }
        public AnnouncementBuilder title(String title) { this.title = title; return this; }
        public AnnouncementBuilder content(String content) { this.content = content; return this; }
        public AnnouncementBuilder author(User author) { this.author = author; return this; }
        public AnnouncementBuilder priority(NoticePriority priority) { this.priority = priority; return this; }
        public AnnouncementBuilder targetDepartment(Department targetDepartment) { this.targetDepartment = targetDepartment; return this; }
        public AnnouncementBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Announcement build() {
            return new Announcement(id, title, content, author, priority, targetDepartment, createdAt);
        }
    }
}
