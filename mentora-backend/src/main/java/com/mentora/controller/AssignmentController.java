package com.mentora.controller;

import com.mentora.entity.Assignment;
import com.mentora.entity.AssignmentSubmission;
import com.mentora.repository.AssignmentRepository;
import com.mentora.repository.AssignmentSubmissionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/assignments")
public class AssignmentController {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;

    public AssignmentController(AssignmentRepository assignmentRepository, AssignmentSubmissionRepository submissionRepository) {
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
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
    public ResponseEntity<List<AssignmentSubmission>> getSubmissions(@PathVariable Long id) {
        return ResponseEntity.ok(submissionRepository.findByAssignmentId(id));
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
