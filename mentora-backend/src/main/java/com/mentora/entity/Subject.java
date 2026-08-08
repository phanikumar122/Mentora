package com.mentora.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "subjects")
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    public Subject() {}

    public Subject(Long id, String code, String name, Course course, Department department, Teacher teacher) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.course = course;
        this.department = department;
        this.teacher = teacher;
    }

    public static SubjectBuilder builder() {
        return new SubjectBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public Teacher getTeacher() { return teacher; }
    public void setTeacher(Teacher teacher) { this.teacher = teacher; }

    public static class SubjectBuilder {
        private Long id;
        private String code;
        private String name;
        private Course course;
        private Department department;
        private Teacher teacher;

        public SubjectBuilder id(Long id) { this.id = id; return this; }
        public SubjectBuilder code(String code) { this.code = code; return this; }
        public SubjectBuilder name(String name) { this.name = name; return this; }
        public SubjectBuilder course(Course course) { this.course = course; return this; }
        public SubjectBuilder department(Department department) { this.department = department; return this; }
        public SubjectBuilder teacher(Teacher teacher) { this.teacher = teacher; return this; }

        public Subject build() {
            return new Subject(id, code, name, course, department, teacher);
        }
    }
}
