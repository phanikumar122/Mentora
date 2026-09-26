package com.mentora.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "study_materials")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StudyMaterial {

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

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_size")
    private String fileSize;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "material_type")
    private MaterialType materialType;

    @Lob
    @Column(name = "file_data", columnDefinition = "LONGBLOB")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private byte[] fileData;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    public StudyMaterial() {}

    public StudyMaterial(Long id, String title, String description, Subject subject, Teacher teacher, String fileName, String fileSize, String fileUrl, MaterialType materialType, LocalDateTime uploadedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.subject = subject;
        this.teacher = teacher;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.fileUrl = fileUrl;
        this.materialType = materialType;
        this.uploadedAt = uploadedAt;
    }

    public static StudyMaterialBuilder builder() {
        return new StudyMaterialBuilder();
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

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileSize() { return fileSize; }
    public void setFileSize(String fileSize) { this.fileSize = fileSize; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public MaterialType getMaterialType() { return materialType; }
    public void setMaterialType(MaterialType materialType) { this.materialType = materialType; }

    public byte[] getFileData() { return fileData; }
    public void setFileData(byte[] fileData) { this.fileData = fileData; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }

    @PrePersist
    protected void onCreate() {
        this.uploadedAt = LocalDateTime.now();
    }

    public static class StudyMaterialBuilder {
        private Long id;
        private String title;
        private String description;
        private Subject subject;
        private Teacher teacher;
        private String fileName;
        private String fileSize;
        private String fileUrl;
        private MaterialType materialType;
        private LocalDateTime uploadedAt;

        public StudyMaterialBuilder id(Long id) { this.id = id; return this; }
        public StudyMaterialBuilder title(String title) { this.title = title; return this; }
        public StudyMaterialBuilder description(String description) { this.description = description; return this; }
        public StudyMaterialBuilder subject(Subject subject) { this.subject = subject; return this; }
        public StudyMaterialBuilder teacher(Teacher teacher) { this.teacher = teacher; return this; }
        public StudyMaterialBuilder fileName(String fileName) { this.fileName = fileName; return this; }
        public StudyMaterialBuilder fileSize(String fileSize) { this.fileSize = fileSize; return this; }
        public StudyMaterialBuilder fileUrl(String fileUrl) { this.fileUrl = fileUrl; return this; }
        public StudyMaterialBuilder materialType(MaterialType materialType) { this.materialType = materialType; return this; }
        public StudyMaterialBuilder uploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; return this; }

        public StudyMaterial build() {
            return new StudyMaterial(id, title, description, subject, teacher, fileName, fileSize, fileUrl, materialType, uploadedAt);
        }
    }
}
