package com.mentora.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "courses")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    private Integer credits;

    public Course() {}

    public Course(Long id, String code, String name, Department department, Integer credits) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.department = department;
        this.credits = credits;
    }

    public static CourseBuilder builder() {
        return new CourseBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public Integer getCredits() { return credits; }
    public void setCredits(Integer credits) { this.credits = credits; }

    public static class CourseBuilder {
        private Long id;
        private String code;
        private String name;
        private Department department;
        private Integer credits;

        public CourseBuilder id(Long id) { this.id = id; return this; }
        public CourseBuilder code(String code) { this.code = code; return this; }
        public CourseBuilder name(String name) { this.name = name; return this; }
        public CourseBuilder department(Department department) { this.department = department; return this; }
        public CourseBuilder credits(Integer credits) { this.credits = credits; return this; }

        public Course build() {
            return new Course(id, code, name, department, credits);
        }
    }
}
