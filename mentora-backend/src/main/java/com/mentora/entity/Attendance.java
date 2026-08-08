package com.mentora.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "attendance")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendanceStatus status;

    private String remarks;

    public Attendance() {}

    public Attendance(Long id, Subject subject, Course course, Student student, Teacher teacher, LocalDate date, AttendanceStatus status, String remarks) {
        this.id = id;
        this.subject = subject;
        this.course = course;
        this.student = student;
        this.teacher = teacher;
        this.date = date;
        this.status = status;
        this.remarks = remarks;
    }

    public static AttendanceBuilder builder() {
        return new AttendanceBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) { this.student = student; }

    public Teacher getTeacher() { return teacher; }
    public void setTeacher(Teacher teacher) { this.teacher = teacher; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public AttendanceStatus getStatus() { return status; }
    public void setStatus(AttendanceStatus status) { this.status = status; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public static class AttendanceBuilder {
        private Long id;
        private Subject subject;
        private Course course;
        private Student student;
        private Teacher teacher;
        private LocalDate date;
        private AttendanceStatus status;
        private String remarks;

        public AttendanceBuilder id(Long id) { this.id = id; return this; }
        public AttendanceBuilder subject(Subject subject) { this.subject = subject; return this; }
        public AttendanceBuilder course(Course course) { this.course = course; return this; }
        public AttendanceBuilder student(Student student) { this.student = student; return this; }
        public AttendanceBuilder teacher(Teacher teacher) { this.teacher = teacher; return this; }
        public AttendanceBuilder date(LocalDate date) { this.date = date; return this; }
        public AttendanceBuilder status(AttendanceStatus status) { this.status = status; return this; }
        public AttendanceBuilder remarks(String remarks) { this.remarks = remarks; return this; }

        public Attendance build() {
            return new Attendance(id, subject, course, student, teacher, date, status, remarks);
        }
    }
}
