package com.mentora.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignments")
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    @Column(name = "due_date", nullable = false)
    private LocalDateTime dueDate;

    @Column(name = "max_marks")
    private Integer maxMarks;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Assignment() {}

    public Assignment(Long id, String title, String description, Subject subject, Teacher teacher, LocalDateTime dueDate, Integer maxMarks, String attachmentUrl, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.subject = subject;
        this.teacher = teacher;
        this.dueDate = dueDate;
        this.maxMarks = maxMarks;
        this.attachmentUrl = attachmentUrl;
        this.createdAt = createdAt;
    }

    public static AssignmentBuilder builder() {
        return new AssignmentBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

    public Teacher getTeacher() { return teacher; }
    public void setTeacher(Teacher teacher) { this.teacher = teacher; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public Integer getMaxMarks() { return maxMarks; }
    public void setMaxMarks(Integer maxMarks) { this.maxMarks = maxMarks; }

    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public static class AssignmentBuilder {
        private Long id;
        private String title;
        private String description;
        private Subject subject;
        private Teacher teacher;
        private LocalDateTime dueDate;
        private Integer maxMarks;
        private String attachmentUrl;
        private LocalDateTime createdAt;

        public AssignmentBuilder id(Long id) { this.id = id; return this; }
        public AssignmentBuilder title(String title) { this.title = title; return this; }
        public AssignmentBuilder description(String description) { this.description = description; return this; }
        public AssignmentBuilder subject(Subject subject) { this.subject = subject; return this; }
        public AssignmentBuilder teacher(Teacher teacher) { this.teacher = teacher; return this; }
        public AssignmentBuilder dueDate(LocalDateTime dueDate) { this.dueDate = dueDate; return this; }
        public AssignmentBuilder maxMarks(Integer maxMarks) { this.maxMarks = maxMarks; return this; }
        public AssignmentBuilder attachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; return this; }
        public AssignmentBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public Assignment build() {
            return new Assignment(id, title, description, subject, teacher, dueDate, maxMarks, attachmentUrl, createdAt);
        }
    }
}
