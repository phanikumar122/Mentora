package com.mentora.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "teachers")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Teacher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "employee_id", nullable = false, unique = true)
    private String employeeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    private String designation;

    private String qualification;

    public Teacher() {}

    public Teacher(Long id, User user, String employeeId, Department department, String designation, String qualification) {
        this.id = id;
        this.user = user;
        this.employeeId = employeeId;
        this.department = department;
        this.designation = designation;
        this.qualification = qualification;
    }

    public static TeacherBuilder builder() {
        return new TeacherBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public static class TeacherBuilder {
        private Long id;
        private User user;
        private String employeeId;
        private Department department;
        private String designation;
        private String qualification;

        public TeacherBuilder id(Long id) { this.id = id; return this; }
        public TeacherBuilder user(User user) { this.user = user; return this; }
        public TeacherBuilder employeeId(String employeeId) { this.employeeId = employeeId; return this; }
        public TeacherBuilder department(Department department) { this.department = department; return this; }
        public TeacherBuilder designation(String designation) { this.designation = designation; return this; }
        public TeacherBuilder qualification(String qualification) { this.qualification = qualification; return this; }

        public Teacher build() {
            return new Teacher(id, user, employeeId, department, designation, qualification);
        }
    }
}
