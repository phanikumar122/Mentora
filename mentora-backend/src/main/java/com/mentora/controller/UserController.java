package com.mentora.controller;

import com.mentora.dto.UserDto;
import com.mentora.entity.Parent;
import com.mentora.entity.Role;
import com.mentora.entity.Student;
import com.mentora.entity.Teacher;
import com.mentora.entity.User;
import com.mentora.repository.AttendanceRepository;
import com.mentora.repository.ParentRepository;
import com.mentora.repository.StudentRepository;
import com.mentora.repository.TeacherRepository;
import com.mentora.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final ParentRepository parentRepository;
    private final AttendanceRepository attendanceRepository;

    public UserController(UserRepository userRepository,
                          StudentRepository studentRepository,
                          TeacherRepository teacherRepository,
                          ParentRepository parentRepository,
                          AttendanceRepository attendanceRepository) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.parentRepository = parentRepository;
        this.attendanceRepository = attendanceRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .phoneNumber(user.getPhoneNumber())
                .profilePictureUrl(user.getProfilePictureUrl())
                .isEnabled(user.getIsEnabled())
                .build());
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userRepository.findAll().stream()
                .map(u -> UserDto.builder()
                        .id(u.getId())
                        .email(u.getEmail())
                        .firstName(u.getFirstName())
                        .lastName(u.getLastName())
                        .role(u.getRole())
                        .phoneNumber(u.getPhoneNumber())
                        .isEnabled(u.getIsEnabled())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping("/assign-student-teacher")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> assignStudentToTeacher(@RequestBody Map<String, String> payload) {
        String studentUserId = payload.get("studentUserId");
        String teacherUserId = payload.get("teacherUserId");

        User studentUser = userRepository.findById(studentUserId)
                .orElseThrow(() -> new RuntimeException("Student user not found"));
        User teacherUser = userRepository.findById(teacherUserId)
                .orElseThrow(() -> new RuntimeException("Teacher user not found"));

        Student student = studentRepository.findByUserId(studentUserId).orElseGet(() -> {
            Student s = new Student();
            s.setUser(studentUser);
            s.setRollNumber("STU-" + System.currentTimeMillis() % 10000);
            return studentRepository.save(s);
        });

        Teacher teacher = teacherRepository.findByUserId(teacherUserId).orElseGet(() -> {
            Teacher t = new Teacher();
            t.setUser(teacherUser);
            t.setEmployeeId("EMP-" + System.currentTimeMillis() % 10000);
            return teacherRepository.save(t);
        });

        student.setAdvisor(teacher);
        studentRepository.save(student);

        return ResponseEntity.ok(Map.of("message", "Student " + studentUser.getFirstName() + " assigned successfully to Professor " + teacherUser.getLastName() + "!"));
    }

    @PostMapping("/assign-parent-student")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> assignParentToStudent(@RequestBody Map<String, String> payload) {
        String parentUserId = payload.get("parentUserId");
        String studentUserId = payload.get("studentUserId");
        String relationship = payload.getOrDefault("relationship", "Parent/Guardian");

        User parentUser = userRepository.findById(parentUserId)
                .orElseThrow(() -> new RuntimeException("Parent user not found"));
        User studentUser = userRepository.findById(studentUserId)
                .orElseThrow(() -> new RuntimeException("Student user not found"));

        Parent parent = parentRepository.findByUserId(parentUserId).orElseGet(() -> {
            Parent p = new Parent();
            p.setUser(parentUser);
            return p;
        });

        parent.setStudentWard(studentUser);
        parent.setRelationship(relationship);
        parentRepository.save(parent);

        return ResponseEntity.ok(Map.of("message", "Parent " + parentUser.getFirstName() + " successfully linked to Student " + studentUser.getFirstName() + "!"));
    }

    @GetMapping("/parents/my-ward")
    public ResponseEntity<?> getParentWard(Authentication authentication) {
        if (authentication == null) return ResponseEntity.badRequest().build();
        User parentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (parentUser == null) return ResponseEntity.notFound().build();

        Parent parent = parentRepository.findByUserId(parentUser.getId()).orElse(null);
        if (parent == null || parent.getStudentWard() == null) {
            return ResponseEntity.ok(Map.of("message", "No student ward linked yet. Contact Administrator to link your child's student account."));
        }

        return ResponseEntity.ok(parent.getStudentWard());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            // FIXED MAJOR-2: Clean up Attendance FK references before deleting Student entity
            studentRepository.findByUserId(id).ifPresent(student -> {
                attendanceRepository.deleteByStudentId(student.getId());
                studentRepository.delete(student);
            });
            teacherRepository.findByUserId(id).ifPresent(teacherRepository::delete);
            parentRepository.findByUserId(id).ifPresent(parentRepository::delete);
            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to delete user: " + e.getMessage()));
        }
    }
}
