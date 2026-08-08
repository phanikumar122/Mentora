package com.mentora.controller;

import com.mentora.entity.Attendance;
import com.mentora.entity.AttendanceStatus;
import com.mentora.entity.Course;
import com.mentora.entity.Student;
import com.mentora.repository.AttendanceRepository;
import com.mentora.repository.CourseRepository;
import com.mentora.repository.StudentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/attendance")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;

    public AttendanceController(AttendanceRepository attendanceRepository,
                                StudentRepository studentRepository,
                                CourseRepository courseRepository) {
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Attendance>> getStudentAttendance(@PathVariable Long studentId) {
        return ResponseEntity.ok(attendanceRepository.findByStudentId(studentId));
    }

    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<List<Attendance>> getSubjectAttendance(
            @PathVariable Long subjectId,
            @RequestParam(required = false) String date) {
        LocalDate attendanceDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        return ResponseEntity.ok(attendanceRepository.findBySubjectIdAndDate(subjectId, attendanceDate));
    }

    /**
     * FIXED CRITICAL-1: Frontend sends { student: { id: "user-uuid" }, course: { id: 1 }, date, status }
     * The Attendance entity's student field is a Student entity (Long PK), not User UUID.
     * We resolve Student by user UUID via studentRepository.findByUserId().
     */
    @PostMapping("/batch")
    public ResponseEntity<?> saveBatchAttendance(@RequestBody List<Map<String, Object>> payload) {
        try {
            List<Attendance> saved = new ArrayList<>();

            for (Map<String, Object> item : payload) {
                // Resolve student from user UUID
                Map<?, ?> studentMap = (Map<?, ?>) item.get("student");
                String studentUserId = studentMap != null ? String.valueOf(studentMap.get("id")) : null;
                if (studentUserId == null || studentUserId.equals("null")) continue;

                Student student = studentRepository.findByUserId(studentUserId).orElse(null);
                if (student == null) {
                    // Student entity doesn't exist for this user — skip
                    continue;
                }

                // Resolve course (optional)
                Course course = null;
                Map<?, ?> courseMap = (Map<?, ?>) item.get("course");
                if (courseMap != null && courseMap.get("id") != null) {
                    try {
                        Long courseId = Long.parseLong(courseMap.get("id").toString());
                        course = courseRepository.findById(courseId).orElse(null);
                    } catch (NumberFormatException ignored) {}
                }

                // Parse date
                String dateStr = item.get("date") != null ? item.get("date").toString() : LocalDate.now().toString();
                LocalDate date;
                try {
                    date = LocalDate.parse(dateStr);
                } catch (Exception e) {
                    date = LocalDate.now();
                }

                // Parse status
                AttendanceStatus status;
                try {
                    status = AttendanceStatus.valueOf(String.valueOf(item.get("status")));
                } catch (Exception e) {
                    status = AttendanceStatus.PRESENT;
                }

                Attendance attendance = new Attendance();
                attendance.setStudent(student);
                attendance.setCourse(course);
                attendance.setDate(date);
                attendance.setStatus(status);
                saved.add(attendanceRepository.save(attendance));
            }

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to save attendance: " + e.getMessage()));
        }
    }
}
