package com.mentora.controller;

import com.mentora.dto.UserDto;
import com.mentora.entity.Parent;
import com.mentora.entity.Role;
import com.mentora.entity.Student;
import com.mentora.entity.Teacher;
import com.mentora.entity.User;
import com.mentora.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final ParentRepository parentRepository;
    private final AttendanceRepository attendanceRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final StudyMaterialRepository studyMaterialRepository;
    private final SubjectRepository subjectRepository;
    private final AssignmentRepository assignmentRepository;
    private final TimetableRepository timetableRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final DiscussionPostRepository discussionPostRepository;
    private final DiscussionReplyRepository discussionReplyRepository;
    private final AnnouncementRepository announcementRepository;

    public UserController(UserRepository userRepository,
                          StudentRepository studentRepository,
                          TeacherRepository teacherRepository,
                          ParentRepository parentRepository,
                          AttendanceRepository attendanceRepository,
                          AssignmentSubmissionRepository assignmentSubmissionRepository,
                          StudyMaterialRepository studyMaterialRepository,
                          SubjectRepository subjectRepository,
                          AssignmentRepository assignmentRepository,
                          TimetableRepository timetableRepository,
                          ChatMessageRepository chatMessageRepository,
                          DiscussionPostRepository discussionPostRepository,
                          DiscussionReplyRepository discussionReplyRepository,
                          AnnouncementRepository announcementRepository) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.parentRepository = parentRepository;
        this.attendanceRepository = attendanceRepository;
        this.assignmentSubmissionRepository = assignmentSubmissionRepository;
        this.studyMaterialRepository = studyMaterialRepository;
        this.subjectRepository = subjectRepository;
        this.assignmentRepository = assignmentRepository;
        this.timetableRepository = timetableRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.discussionPostRepository = discussionPostRepository;
        this.discussionReplyRepository = discussionReplyRepository;
        this.announcementRepository = announcementRepository;
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

    @GetMapping("/directory")
    public ResponseEntity<List<Map<String, Object>>> getDirectoryUsers(Authentication authentication) {
        if (authentication == null) return ResponseEntity.badRequest().build();
        User currentUser = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (currentUser == null) return ResponseEntity.badRequest().build();

        // If current user is a Teacher / Mentor, retrieve only their assigned advisee user IDs
        Set<String> assignedStudentUserIds = new HashSet<>();
        if (currentUser.getRole() == Role.ROLE_TEACHER) {
            List<Student> advisees = studentRepository.findByAdvisorUserId(currentUser.getId());
            for (Student s : advisees) {
                if (s.getUser() != null) {
                    assignedStudentUserIds.add(s.getUser().getId());
                }
            }
        }

        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (User u : users) {
            if (u.getId().equals(currentUser.getId())) continue;

            // Mentor / Teacher: gets ONLY their assigned students, all Admins, and all other Mentors
            if (currentUser.getRole() == Role.ROLE_TEACHER) {
                boolean isAdmin = u.getRole() == Role.ROLE_ADMIN;
                boolean isOtherMentor = u.getRole() == Role.ROLE_TEACHER;
                boolean isAssignedStudent = u.getRole() == Role.ROLE_STUDENT && assignedStudentUserIds.contains(u.getId());
                if (!isAdmin && !isOtherMentor && !isAssignedStudent) {
                    continue;
                }
            }

            // Student role: can only see Teachers and Admins
            if (currentUser.getRole() == Role.ROLE_STUDENT) {
                if (u.getRole() != Role.ROLE_TEACHER && u.getRole() != Role.ROLE_ADMIN) {
                    continue;
                }
            }

            // Parent role: can only see Teachers and Admins
            if (currentUser.getRole() == Role.ROLE_PARENT) {
                if (u.getRole() != Role.ROLE_TEACHER && u.getRole() != Role.ROLE_ADMIN) {
                    continue;
                }
            }

            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("email", u.getEmail());
            map.put("firstName", u.getFirstName());
            map.put("lastName", u.getLastName());
            map.put("role", u.getRole());
            map.put("phoneNumber", u.getPhoneNumber());
            map.put("profilePictureUrl", u.getProfilePictureUrl());
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Student> allStudents = studentRepository.findAll();
        List<Parent> allParents = parentRepository.findAll();

        Map<String, Student> studentByUser = allStudents.stream()
                .filter(s -> s.getUser() != null)
                .collect(Collectors.toMap(s -> s.getUser().getId(), s -> s, (a, b) -> a));

        Map<String, Parent> parentByUser = allParents.stream()
                .filter(p -> p.getUser() != null)
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p, (a, b) -> a));

        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : users) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("email", u.getEmail());
            map.put("firstName", u.getFirstName());
            map.put("lastName", u.getLastName());
            map.put("role", u.getRole());
            map.put("phoneNumber", u.getPhoneNumber());
            map.put("isEnabled", u.getIsEnabled());

            if (u.getRole() == Role.ROLE_STUDENT) {
                Student s = studentByUser.get(u.getId());
                if (s != null && s.getAdvisor() != null && s.getAdvisor().getUser() != null) {
                    map.put("advisorName", s.getAdvisor().getUser().getFirstName() + " " + s.getAdvisor().getUser().getLastName());
                    map.put("advisorId", s.getAdvisor().getUser().getId());
                }
            } else if (u.getRole() == Role.ROLE_PARENT) {
                Parent p = parentByUser.get(u.getId());
                if (p != null && p.getStudentWard() != null) {
                    map.put("wardName", p.getStudentWard().getFirstName() + " " + p.getStudentWard().getLastName());
                    map.put("wardId", p.getStudentWard().getId());
                    map.put("relationship", p.getRelationship());
                }
            }
            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Returns list of students who do NOT have an advisor assigned.
     * BUG-7 FIX: Use repository-level findByAdvisorIsNull() (1 query) instead of
     * fetching ALL users then hitting the DB per student O(N²).
     */
    @GetMapping("/students/unassigned-advisor")
    public ResponseEntity<List<UserDto>> getUnassignedStudents() {
        return ResponseEntity.ok(
            studentRepository.findByAdvisorIsNull().stream()
                .filter(s -> s.getUser() != null)
                .map(s -> UserDto.builder()
                        .id(s.getUser().getId())
                        .email(s.getUser().getEmail())
                        .firstName(s.getUser().getFirstName())
                        .lastName(s.getUser().getLastName())
                        .role(s.getUser().getRole())
                        .phoneNumber(s.getUser().getPhoneNumber())
                        .build())
                .collect(Collectors.toList())
        );
    }

    /**
     * For a Student user: returns their assigned Teacher mentor.
     */
    @GetMapping("/students/my-advisor")
    public ResponseEntity<?> getMyAdvisor(Authentication authentication) {
        if (authentication == null) return ResponseEntity.badRequest().build();
        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null || user.getRole() != Role.ROLE_STUDENT) {
            return ResponseEntity.ok(Map.of("message", "Not a student account."));
        }

        Student student = studentRepository.findByUserId(user.getId()).orElse(null);
        if (student == null || student.getAdvisor() == null || student.getAdvisor().getUser() == null) {
            return ResponseEntity.ok(Map.of("message", "No mentor assigned yet."));
        }

        User advisorUser = student.getAdvisor().getUser();
        return ResponseEntity.ok(Map.of(
                "advisorUserId", advisorUser.getId(),
                "advisorName", advisorUser.getFirstName() + " " + advisorUser.getLastName(),
                "advisorEmail", advisorUser.getEmail(),
                "designation", student.getAdvisor().getDesignation() != null ? student.getAdvisor().getDesignation() : "Faculty Mentor",
                "department", student.getAdvisor().getDepartment() != null ? student.getAdvisor().getDepartment().getName() : "Academic Department"
        ));
    }

    /**
     * For a Teacher user: returns all students assigned to them.
     */
    @GetMapping("/teachers/my-students")
    public ResponseEntity<?> getMyAdvisees(Authentication authentication) {
        if (authentication == null) return ResponseEntity.badRequest().build();
        User teacherUser = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (teacherUser == null || teacherUser.getRole() != Role.ROLE_TEACHER) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Student> advisees = studentRepository.findByAdvisorUserId(teacherUser.getId());
        List<Map<String, Object>> result = new ArrayList<>();
        for (Student s : advisees) {
            if (s.getUser() != null) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", s.getUser().getId());
                map.put("studentUserId", s.getUser().getId());
                map.put("firstName", s.getUser().getFirstName());
                map.put("lastName", s.getUser().getLastName());
                map.put("name", s.getUser().getFirstName() + " " + s.getUser().getLastName());
                map.put("email", s.getUser().getEmail());
                map.put("rollNumber", s.getRollNumber() != null ? s.getRollNumber() : "N/A");
                map.put("semester", s.getSemester() != null ? s.getSemester() : 1);
                map.put("cgpa", s.getCgpa() != null ? s.getCgpa() : 0.0);
                result.add(map);
            }
        }
        return ResponseEntity.ok(result);
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

        return ResponseEntity.ok(Map.of(
                "message", "Student " + studentUser.getFirstName() + " assigned successfully to Professor " + teacherUser.getLastName() + "!",
                "studentUserId", studentUserId,
                "teacherUserId", teacherUserId
        ));
    }

    @PostMapping("/unassign-student-teacher")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> unassignStudentTeacher(@RequestBody Map<String, String> payload) {
        String studentUserId = payload.get("studentUserId");
        Student student = studentRepository.findByUserId(studentUserId).orElse(null);
        if (student != null) {
            student.setAdvisor(null);
            studentRepository.save(student);
        }
        return ResponseEntity.ok(Map.of("message", "Mentor unlinked successfully."));
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

        User ward = parent.getStudentWard();
        Student student = studentRepository.findByUserId(ward.getId()).orElse(null);

        Map<String, Object> response = new HashMap<>();
        response.put("id", ward.getId());
        response.put("firstName", ward.getFirstName());
        response.put("lastName", ward.getLastName());
        response.put("email", ward.getEmail());
        response.put("phoneNumber", ward.getPhoneNumber());
        response.put("relationship", parent.getRelationship() != null ? parent.getRelationship() : "Parent/Guardian");

        if (student != null) {
            response.put("rollNumber", student.getRollNumber());
            response.put("semester", student.getSemester() != null ? student.getSemester() : 1);
            response.put("cgpa", student.getCgpa() != null ? student.getCgpa() : 0.0);
            if (student.getDepartment() != null) {
                response.put("departmentName", student.getDepartment().getName());
            }
            if (student.getAdvisor() != null && student.getAdvisor().getUser() != null) {
                response.put("advisorUserId", student.getAdvisor().getUser().getId());
                response.put("advisorName", "Prof. " + student.getAdvisor().getUser().getFirstName() + " " + student.getAdvisor().getUser().getLastName());
                response.put("advisorEmail", student.getAdvisor().getUser().getEmail());
            }
        }

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            // 1. Unlink Parent records referencing this user as student ward
            parentRepository.findAll().forEach(p -> {
                if (p.getStudentWard() != null && id.equals(p.getStudentWard().getId())) {
                    p.setStudentWard(null);
                    parentRepository.save(p);
                }
            });

            // 2. Handle Student entity & dependent records
            studentRepository.findByUserId(id).ifPresent(student -> {
                try {
                    assignmentSubmissionRepository.deleteByStudentId(student.getId());
                } catch (Exception ex) {
                    log.warn("Error cleaning up assignment submissions for student {}: {}", student.getId(), ex.getMessage());
                }
                try {
                    attendanceRepository.deleteByStudentId(student.getId());
                } catch (Exception ex) {
                    log.warn("Error cleaning up attendance for student {}: {}", student.getId(), ex.getMessage());
                }
                studentRepository.delete(student);
            });

            // 3. Handle Teacher entity & dependent records
            teacherRepository.findByUserId(id).ifPresent(teacher -> {
                // Unlink advisees
                studentRepository.findByAdvisorId(teacher.getId()).forEach(s -> {
                    s.setAdvisor(null);
                    studentRepository.save(s);
                });
                // Unlink study materials
                studyMaterialRepository.findByTeacherId(teacher.getId()).forEach(sm -> {
                    sm.setTeacher(null);
                    studyMaterialRepository.save(sm);
                });
                // Unlink subjects
                subjectRepository.findByTeacherId(teacher.getId()).forEach(sub -> {
                    sub.setTeacher(null);
                    subjectRepository.save(sub);
                });
                // Unlink assignments
                assignmentRepository.findByTeacherId(teacher.getId()).forEach(as -> {
                    as.setTeacher(null);
                    assignmentRepository.save(as);
                });
                // Unlink timetables
                timetableRepository.findByTeacherId(teacher.getId()).forEach(tt -> {
                    tt.setTeacher(null);
                    timetableRepository.save(tt);
                });
                // Unlink attendance records marked by teacher
                attendanceRepository.findByTeacherId(teacher.getId()).forEach(att -> {
                    att.setTeacher(null);
                    attendanceRepository.save(att);
                });
                teacherRepository.delete(teacher);
            });

            // 4. Handle Parent entity
            parentRepository.findByUserId(id).ifPresent(parentRepository::delete);

            // 5. Clean up chat messages
            chatMessageRepository.findAll().forEach(m -> {
                if ((m.getSender() != null && id.equals(m.getSender().getId())) ||
                    (m.getRecipient() != null && id.equals(m.getRecipient().getId()))) {
                    chatMessageRepository.delete(m);
                }
            });

            // 6. Clean up discussion posts & replies
            discussionReplyRepository.findAll().forEach(r -> {
                if (r.getAuthor() != null && id.equals(r.getAuthor().getId())) {
                    discussionReplyRepository.delete(r);
                }
            });
            discussionPostRepository.findAll().forEach(p -> {
                if (p.getAuthor() != null && id.equals(p.getAuthor().getId())) {
                    discussionPostRepository.delete(p);
                }
            });

            // 7. Clean up announcements authored by this user
            announcementRepository.findAll().forEach(a -> {
                if (a.getAuthor() != null && id.equals(a.getAuthor().getId())) {
                    announcementRepository.delete(a);
                }
            });

            // 8. Delete user record
            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "User deleted successfully!"));
        } catch (Exception e) {
            log.error("Failed to delete user with id {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to delete user: " + e.getMessage()));
        }
    }
}

