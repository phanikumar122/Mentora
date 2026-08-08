package com.mentora.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "parents")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Parent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_user_id")
    private User studentWard;

    private String relationship;

    public Parent() {}

    public Parent(Long id, User user, User studentWard, String relationship) {
        this.id = id;
        this.user = user;
        this.studentWard = studentWard;
        this.relationship = relationship;
    }

    public static ParentBuilder builder() {
        return new ParentBuilder();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public User getStudentWard() { return studentWard; }
    public void setStudentWard(User studentWard) { this.studentWard = studentWard; }

    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }

    public static class ParentBuilder {
        private Long id;
        private User user;
        private User studentWard;
        private String relationship;

        public ParentBuilder id(Long id) { this.id = id; return this; }
        public ParentBuilder user(User user) { this.user = user; return this; }
        public ParentBuilder studentWard(User studentWard) { this.studentWard = studentWard; return this; }
        public ParentBuilder relationship(String relationship) { this.relationship = relationship; return this; }

        public Parent build() {
            return new Parent(id, user, studentWard, relationship);
        }
    }
}
