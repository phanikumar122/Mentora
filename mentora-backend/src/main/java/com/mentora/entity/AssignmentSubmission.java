package com.mentora.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignment_submissions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AssignmentSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "marks_obtained")
    private Double marksObtained;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssignmentStatus status;

    public AssignmentSubmission() {}

    public AssignmentSubmission(Long id, Assignment assignment, Student student, String fileUrl, LocalDateTime submittedAt, Double marksObtained, String feedback, AssignmentStatus status) {
        this.id = id;
        this.assignment = assignment;
        this.student = student;
        this.fileUrl = fileUrl;
        this.submittedAt = submittedAt;
        this.marksObtained = marksObtained;
        this.feedback = feedback;
        this.status = status;
    }

    public static AssignmentSubmissionBuilder builder() {
        return new AssignmentSubmissionBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Assignment getAssignment() { return assignment; }
    public void setAssignment(Assignment assignment) { this.assignment = assignment; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public Double getMarksObtained() { return marksObtained; }
    public void setMarksObtained(Double marksObtained) { this.marksObtained = marksObtained; }

    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }

    public AssignmentStatus getStatus() { return status; }
    public void setStatus(AssignmentStatus status) { this.status = status; }

    @PrePersist
    protected void onCreate() {
        this.submittedAt = LocalDateTime.now();
    }

    public static class AssignmentSubmissionBuilder {
        private Long id;
        private Assignment assignment;
        private Student student;
        private String fileUrl;
        private LocalDateTime submittedAt;
        private Double marksObtained;
        private String feedback;
        private AssignmentStatus status;

        public AssignmentSubmissionBuilder id(Long id) { this.id = id; return this; }
        public AssignmentSubmissionBuilder assignment(Assignment assignment) { this.assignment = assignment; return this; }
        public AssignmentSubmissionBuilder student(Student student) { this.student = student; return this; }
        public AssignmentSubmissionBuilder fileUrl(String fileUrl) { this.fileUrl = fileUrl; return this; }
        public AssignmentSubmissionBuilder submittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; return this; }
        public AssignmentSubmissionBuilder marksObtained(Double marksObtained) { this.marksObtained = marksObtained; return this; }
        public AssignmentSubmissionBuilder feedback(String feedback) { this.feedback = feedback; return this; }
        public AssignmentSubmissionBuilder status(AssignmentStatus status) { this.status = status; return this; }

        public AssignmentSubmission build() {
            return new AssignmentSubmission(id, assignment, student, fileUrl, submittedAt, marksObtained, feedback, status);
        }
    }
}
