package com.mentora.controller;

import com.mentora.entity.Assignment;
import com.mentora.entity.AssignmentStatus;
import com.mentora.entity.AssignmentSubmission;
import com.mentora.entity.Student;
import com.mentora.entity.User;
import com.mentora.repository.AssignmentRepository;
import com.mentora.repository.AssignmentSubmissionRepository;
import com.mentora.repository.StudentRepository;
import com.mentora.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/assignments")
public class AssignmentController {

    private static final Logger log = LoggerFactory.getLogger(AssignmentController.class);

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final Path uploadDir = Paths.get(System.getProperty("user.dir"), "uploads");

    public AssignmentController(AssignmentRepository assignmentRepository,
                                AssignmentSubmissionRepository submissionRepository,
                                UserRepository userRepository,
                                StudentRepository studentRepository) {
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        try {
            Files.createDirectories(uploadDir);
        } catch (Exception e) {
            log.warn("Could not create uploads directory: {}", e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Assignment>> getAllAssignments() {
        return ResponseEntity.ok(assignmentRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    public ResponseEntity<?> createAssignment(@RequestBody Map<String, Object> payload) {
        try {
            String title = (String) payload.get("title");
            String description = (String) payload.get("description");
            Integer maxMarks = payload.get("maxMarks") != null ? Integer.parseInt(payload.get("maxMarks").toString()) : 100;

            Assignment assignment = new Assignment();
            assignment.setTitle(title);
            assignment.setDescription(description);
            assignment.setMaxMarks(maxMarks);

            if (payload.get("dueDate") != null) {
                try {
                    String dueStr = payload.get("dueDate").toString();
                    if (dueStr.contains("Z")) dueStr = dueStr.substring(0, dueStr.indexOf("Z"));
                    if (dueStr.contains(".")) dueStr = dueStr.substring(0, dueStr.indexOf("."));
                    assignment.setDueDate(LocalDateTime.parse(dueStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                } catch (Exception ex) {
                    assignment.setDueDate(LocalDateTime.now().plusDays(7));
                }
            } else {
                assignment.setDueDate(LocalDateTime.now().plusDays(7));
            }

            Assignment saved = assignmentRepository.save(assignment);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to create assignment: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/submissions")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    public ResponseEntity<?> getSubmissions(@PathVariable Long id) {
        List<AssignmentSubmission> list = submissionRepository.findByAssignmentId(id);
        List<Map<String, Object>> result = list.stream().map(sub -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", sub.getId());
            map.put("fileUrl", sub.getFileUrl());
            map.put("submittedAt", sub.getSubmittedAt() != null ? sub.getSubmittedAt().toString() : "");
            map.put("marksObtained", sub.getMarksObtained());
            map.put("feedback", sub.getFeedback());
            map.put("status", sub.getStatus() != null ? sub.getStatus().name() : "SUBMITTED");

            if (sub.getStudent() != null) {
                map.put("studentId", sub.getStudent().getId());
                map.put("rollNumber", sub.getStudent().getRollNumber() != null ? sub.getStudent().getRollNumber() : "");
                if (sub.getStudent().getUser() != null) {
                    String first = sub.getStudent().getUser().getFirstName() != null ? sub.getStudent().getUser().getFirstName() : "";
                    String last = sub.getStudent().getUser().getLastName() != null ? sub.getStudent().getUser().getLastName() : "";
                    map.put("studentName", (first + " " + last).trim());
                    map.put("studentEmail", sub.getStudent().getUser().getEmail());
                } else {
                    map.put("studentName", "Student #" + sub.getStudent().getId());
                    map.put("studentEmail", "");
                }
            } else {
                map.put("studentName", "Unknown Student");
                map.put("studentEmail", "");
                map.put("rollNumber", "");
            }
            return map;
        }).collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/submissions/{submissionId}/grade")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    public ResponseEntity<?> gradeSubmission(
            @PathVariable Long submissionId,
            @RequestBody Map<String, Object> payload) {
        try {
            AssignmentSubmission submission = submissionRepository.findById(submissionId).orElse(null);
            if (submission == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Submission not found with ID: " + submissionId));
            }

            if (payload.get("marksObtained") != null) {
                submission.setMarksObtained(Double.parseDouble(payload.get("marksObtained").toString()));
            }
            if (payload.get("feedback") != null) {
                submission.setFeedback(payload.get("feedback").toString());
            }
            submission.setStatus(AssignmentStatus.GRADED);

            AssignmentSubmission saved = submissionRepository.save(submission);
            return ResponseEntity.ok(Map.of(
                    "message", "Submission graded successfully!",
                    "submissionId", saved.getId(),
                    "marksObtained", saved.getMarksObtained() != null ? saved.getMarksObtained() : 0,
                    "feedback", saved.getFeedback() != null ? saved.getFeedback() : "",
                    "status", saved.getStatus().name()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to grade submission: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/my-submission")
    @PreAuthorize("hasAnyAuthority('ROLE_STUDENT', 'ROLE_ADMIN')")
    public ResponseEntity<?> getMySubmission(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Not authenticated"));
        }
        User user = userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseGet(() -> userRepository.findByEmail(authentication.getName()).orElse(null));
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User not found"));
        }
        Student student = studentRepository.findByUserId(user.getId()).orElse(null);
        if (student == null) {
            return ResponseEntity.ok(Map.of("submitted", false));
        }
        return submissionRepository.findByAssignmentIdAndStudentId(id, student.getId())
                .map(sub -> ResponseEntity.ok((Object) sub))
                .orElseGet(() -> ResponseEntity.ok(Map.of("submitted", false)));
    }

    @PostMapping(value = "/{id}/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('ROLE_STUDENT', 'ROLE_ADMIN')")
    public ResponseEntity<?> submitSolutionMultipart(
            @PathVariable Long id,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "studentNote", required = false) String studentNote,
            @RequestParam(value = "fileName", required = false) String fileName,
            Authentication authentication) {
        return processSubmission(id, file, studentNote, fileName, null, authentication);
    }

    @PostMapping(value = "/{id}/submissions")
    @PreAuthorize("hasAnyAuthority('ROLE_STUDENT', 'ROLE_ADMIN')")
    public ResponseEntity<?> submitSolutionJson(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> payload,
            Authentication authentication) {
        String studentNote = payload != null && payload.get("studentNote") != null ? payload.get("studentNote").toString() : null;
        String fileName = payload != null && payload.get("fileName") != null ? payload.get("fileName").toString() : null;
        String fileUrl = payload != null && payload.get("fileUrl") != null ? payload.get("fileUrl").toString() : null;
        return processSubmission(id, null, studentNote, fileName, fileUrl, authentication);
    }

    private ResponseEntity<?> processSubmission(
            Long id,
            MultipartFile file,
            String studentNote,
            String fileName,
            String fileUrl,
            Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Authentication required to submit assignment."));
            }

            String email = authentication.getName();
            User user = userRepository.findByEmailIgnoreCase(email)
                    .orElseGet(() -> userRepository.findByEmail(email).orElse(null));

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User account not found for: " + email));
            }

            Assignment assignment = assignmentRepository.findById(id).orElse(null);
            if (assignment == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Assignment not found with ID: " + id));
            }

            // Resolve or automatically create Student profile for the logged in user
            Student student = studentRepository.findByUserId(user.getId()).orElseGet(() -> {
                Student s = new Student();
                s.setUser(user);
                s.setRollNumber("STU-" + Math.abs(user.getId().hashCode() % 100000));
                return studentRepository.save(s);
            });

            // Find existing submission to allow re-submissions/updates without duplicates
            AssignmentSubmission submission = submissionRepository.findByAssignmentIdAndStudentId(assignment.getId(), student.getId())
                    .orElseGet(() -> {
                        AssignmentSubmission s = new AssignmentSubmission();
                        s.setAssignment(assignment);
                        s.setStudent(student);
                        return s;
                    });

            String resolvedFileUrl = fileUrl;
            if (file != null && !file.isEmpty()) {
                String origName = file.getOriginalFilename();
                String safeName = System.currentTimeMillis() + "_" + (origName != null ? origName.replaceAll("[^a-zA-Z0-9._-]", "_") : "submission.pdf");
                try {
                    Files.createDirectories(uploadDir);
                    Path targetPath = uploadDir.resolve(safeName);
                    Files.write(targetPath, file.getBytes());
                    resolvedFileUrl = "/api/v1/materials/files/" + safeName;
                } catch (Exception ex) {
                    log.warn("Could not copy submission file to disk: {}", ex.getMessage());
                    resolvedFileUrl = "/uploads/" + (origName != null ? origName : "submission.pdf");
                }
            } else if (resolvedFileUrl == null || resolvedFileUrl.trim().isEmpty()) {
                if (fileName != null && !fileName.trim().isEmpty()) {
                    resolvedFileUrl = "/uploads/" + fileName;
                } else {
                    resolvedFileUrl = "text_submission";
                }
            }

            submission.setFileUrl(resolvedFileUrl);
            if (studentNote != null && !studentNote.trim().isEmpty()) {
                submission.setFeedback(studentNote.trim());
            }
            submission.setSubmittedAt(LocalDateTime.now());
            submission.setStatus(AssignmentStatus.SUBMITTED);

            AssignmentSubmission saved = submissionRepository.save(submission);

            return ResponseEntity.ok(Map.of(
                    "message", "Solution submitted successfully!",
                    "submissionId", saved.getId(),
                    "assignmentId", assignment.getId(),
                    "status", saved.getStatus().name(),
                    "submittedAt", saved.getSubmittedAt().toString(),
                    "fileUrl", saved.getFileUrl() != null ? saved.getFileUrl() : ""
            ));
        } catch (Exception e) {
            log.error("Failed to submit assignment solution for assignment ID {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", "Submission failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    public ResponseEntity<?> deleteAssignment(@PathVariable Long id) {
        try {
            // BUG-9 FIX: Single bulk DELETE instead of loading submissions into memory
            submissionRepository.deleteByAssignmentId(id);
            assignmentRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Assignment deleted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to delete assignment: " + e.getMessage()));
        }
    }
}
