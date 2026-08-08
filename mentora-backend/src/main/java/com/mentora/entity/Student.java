package com.mentora.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "students")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "roll_number", nullable = false, unique = true)
    private String rollNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "advisor_teacher_id")
    private Teacher advisor;

    private Integer semester;

    private Double cgpa;

    public Student() {}

    public Student(Long id, User user, String rollNumber, Department department, Course course, Teacher advisor, Integer semester, Double cgpa) {
        this.id = id;
        this.user = user;
        this.rollNumber = rollNumber;
        this.department = department;
        this.course = course;
        this.advisor = advisor;
        this.semester = semester;
        this.cgpa = cgpa;
    }

    public static StudentBuilder builder() {
        return new StudentBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getRollNumber() { return rollNumber; }
    public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public Course getCourse() { return course; }
    public void setCourse(Course course) { this.course = course; }

    public Teacher getAdvisor() { return advisor; }
    public void setAdvisor(Teacher advisor) { this.advisor = advisor; }

    public Integer getSemester() { return semester; }
    public void setSemester(Integer semester) { this.semester = semester; }

    public Double getCgpa() { return cgpa; }
    public void setCgpa(Double cgpa) { this.cgpa = cgpa; }

    public static class StudentBuilder {
        private Long id;
        private User user;
        private String rollNumber;
        private Department department;
        private Course course;
        private Teacher advisor;
        private Integer semester;
        private Double cgpa;

        public StudentBuilder id(Long id) { this.id = id; return this; }
        public StudentBuilder user(User user) { this.user = user; return this; }
        public StudentBuilder rollNumber(String rollNumber) { this.rollNumber = rollNumber; return this; }
        public StudentBuilder department(Department department) { this.department = department; return this; }
        public StudentBuilder course(Course course) { this.course = course; return this; }
        public StudentBuilder advisor(Teacher advisor) { this.advisor = advisor; return this; }
        public StudentBuilder semester(Integer semester) { this.semester = semester; return this; }
        public StudentBuilder cgpa(Double cgpa) { this.cgpa = cgpa; return this; }

        public Student build() {
            return new Student(id, user, rollNumber, department, course, advisor, semester, cgpa);
        }
    }
}
