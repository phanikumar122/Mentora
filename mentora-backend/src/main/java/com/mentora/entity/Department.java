package com.mentora.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "departments")
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    public Department() {}

    public Department(Long id, String code, String name, String description) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.description = description;
    }

    public static DepartmentBuilder builder() {
        return new DepartmentBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public static class DepartmentBuilder {
        private Long id;
        private String code;
        private String name;
        private String description;

        public DepartmentBuilder id(Long id) { this.id = id; return this; }
        public DepartmentBuilder code(String code) { this.code = code; return this; }
        public DepartmentBuilder name(String name) { this.name = name; return this; }
        public DepartmentBuilder description(String description) { this.description = description; return this; }

        public Department build() {
            return new Department(id, code, name, description);
        }
    }
}
