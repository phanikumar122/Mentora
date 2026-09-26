package com.mentora.controller;

import com.mentora.entity.*;
import com.mentora.repository.AttendanceRepository;
import com.mentora.repository.CourseRepository;
import com.mentora.repository.ParentRepository;
import com.mentora.repository.StudentRepository;
import com.mentora.repository.SubjectRepository;
import com.mentora.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/attendance")
public class AttendanceController {

    private static final Logger log = LoggerFactory.getLogger(AttendanceController.class);

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;
    private final ParentRepository parentRepository;

    public AttendanceController(AttendanceRepository attendanceRepository,
                                StudentRepository studentRepository,
                                CourseRepository courseRepository,
                                SubjectRepository subjectRepository,
                                UserRepository userRepository,
                                ParentRepository parentRepository) {
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.parentRepository = parentRepository;
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Attendance>> getStudentAttendance(@PathVariable Long studentId) {
        return ResponseEntity.ok(attendanceRepository.findByStudentIdOrderByDateDesc(studentId));
    }

    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<List<Attendance>> getSubjectAttendance(
            @PathVariable Long subjectId,
            @RequestParam(required = false) String date) {
        LocalDate attendanceDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        return ResponseEntity.ok(attendanceRepository.findBySubjectIdAndDate(subjectId, attendanceDate));
    }

    /**
     * Resolves the target Student for the currently authenticated User.
     * If caller is a STUDENT -> resolves their Student entity.
     * If caller is a PARENT  -> resolves their linked Student Ward.
     */
    private Student resolveCurrentStudent(Authentication authentication) {
        if (authentication == null) return null;
        User user = userRepository.findByEmail(authentication.getName()).orElse(null);
        if (user == null) return null;

        if (user.getRole() == Role.ROLE_STUDENT) {
            return studentRepository.findByUserId(user.getId()).orElse(null);
        } else if (user.getRole() == Role.ROLE_PARENT) {
            Parent parent = parentRepository.findByUserId(user.getId()).orElse(null);
            if (parent != null && parent.getStudentWard() != null) {
                return studentRepository.findByUserId(parent.getStudentWard().getId()).orElse(null);
            }
        }
        return null;
    }

    /**
     * Returns personal attendance history for currently logged-in Student or Parent's Ward.
     */
    @GetMapping("/my-attendance")
    public ResponseEntity<?> getMyAttendance(Authentication authentication) {
        Student student = resolveCurrentStudent(authentication);
        if (student == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(attendanceRepository.findByStudentIdOrderByDateDesc(student.getId()));
    }

    /**
     * Returns detailed attendance analytics (overall %, present count, total count, compliance status, course breakdown).
     * BUG-2 FIX: Zero records now correctly returns 0% / NO_DATA instead of 100% / GOOD.
     */
    @GetMapping("/analytics")
    public ResponseEntity<?> getAttendanceAnalytics(Authentication authentication) {
        Student student = resolveCurrentStudent(authentication);

        // No authenticated student — return NO_DATA sentinel
        if (student == null) {
            return ResponseEntity.ok(Map.of(
                    "overallPercentage", 0.0,
                    "totalSessions", 0,
                    "presentCount", 0,
                    "absentCount", 0,
                    "lateCount", 0,
                    "complianceStatus", "NO_DATA",
                    "courseBreakdown", Collections.emptyList()
            ));
        }

        List<Attendance> records = attendanceRepository.findByStudentId(student.getId());
        int total = records.size();

        // BUG-2 FIX: Zero records = NO_DATA, not 100% GOOD. A student with no records
        // has not proven attendance; showing 100% would be semantically wrong.
        if (total == 0) {
            return ResponseEntity.ok(Map.of(
                    "overallPercentage", 0.0,
                    "totalSessions", 0,
                    "presentCount", 0,
                    "absentCount", 0,
                    "lateCount", 0,
                    "complianceStatus", "NO_DATA",
                    "courseBreakdown", Collections.emptyList()
            ));
        }

        long presentCount = records.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        long lateCount = records.stream().filter(r -> r.getStatus() == AttendanceStatus.LATE).count();
        long absentCount = records.stream().filter(r -> r.getStatus() == AttendanceStatus.ABSENT).count();

        // Late counts as 0.75 present in academic calculations
        double effectivePresent = presentCount + (lateCount * 0.75);
        double overallPercentage = Math.round((effectivePresent / total) * 1000.0) / 10.0;

        String complianceStatus = overallPercentage >= 85.0 ? "EXCELLENT"
                : overallPercentage >= 75.0 ? "GOOD"
                : overallPercentage >= 65.0 ? "WARNING" : "CRITICAL";

        // Group by course or subject
        Map<String, List<Attendance>> byCourse = records.stream()
                .filter(r -> r.getCourse() != null)
                .collect(Collectors.groupingBy(r -> r.getCourse().getName()));

        List<Map<String, Object>> courseBreakdown = new ArrayList<>();
        for (Map.Entry<String, List<Attendance>> entry : byCourse.entrySet()) {
            List<Attendance> cRecords = entry.getValue();
            long cPresent = cRecords.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
            double cPct = Math.round(((double) cPresent / cRecords.size()) * 1000.0) / 10.0;
            courseBreakdown.add(Map.of(
                    "courseName", entry.getKey(),
                    "total", cRecords.size(),
                    "present", cPresent,
                    "percentage", cPct
            ));
        }

        return ResponseEntity.ok(Map.of(
                "overallPercentage", overallPercentage,
                "totalSessions", total,
                "presentCount", presentCount,
                "absentCount", absentCount,
                "lateCount", lateCount,
                "complianceStatus", complianceStatus,
                "courseBreakdown", courseBreakdown
        ));
    }

    /**
     * Returns daily density data for the GitHub-style interactive Calendar Heatmap over the last 120 days.
     */
    @GetMapping("/heatmap")
    public ResponseEntity<?> getAttendanceHeatmap(
            Authentication authentication,
            @RequestParam(required = false) Integer days) {

        Student student = resolveCurrentStudent(authentication);
        if (student == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        int lookbackDays = (days != null && days > 0) ? Math.min(days, 365) : 120;
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(lookbackDays);

        List<Attendance> records = attendanceRepository.findByStudentIdAndDateBetween(student.getId(), startDate, endDate);

        // Group records by date string (YYYY-MM-DD)
        Map<String, List<Attendance>> byDate = records.stream()
                .collect(Collectors.groupingBy(r -> r.getDate().toString()));

        List<Map<String, Object>> heatmapData = new ArrayList<>();

        for (int i = 0; i <= lookbackDays; i++) {
            LocalDate d = startDate.plusDays(i);
            String dateStr = d.toString();
            List<Attendance> dayRecords = byDate.getOrDefault(dateStr, Collections.emptyList());

            int dayTotal = dayRecords.size();
            long dayPresent = dayRecords.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
            long dayLate = dayRecords.stream().filter(r -> r.getStatus() == AttendanceStatus.LATE).count();
            long dayAbsent = dayRecords.stream().filter(r -> r.getStatus() == AttendanceStatus.ABSENT).count();

            int level = 0;
            if (dayTotal > 0) {
                double dayRate = ((double) dayPresent + (dayLate * 0.5)) / dayTotal;
                if (dayRate >= 0.90) level = 4;
                else if (dayRate >= 0.70) level = 3;
                else if (dayRate >= 0.40) level = 2;
                else level = 1;
            }

            heatmapData.add(Map.of(
                    "date", dateStr,
                    "count", dayTotal,
                    "presentCount", dayPresent,
                    "absentCount", dayAbsent,
                    "lateCount", dayLate,
                    "intensityLevel", level
            ));
        }

        return ResponseEntity.ok(heatmapData);
    }

    /**
     * Batch save attendance roster from Teacher/Admin.
     * BUG-1 FIX: Unknown student IDs now log a warning instead of silently dropping records.
     */
    @PostMapping("/batch")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    public ResponseEntity<?> saveBatchAttendance(@RequestBody List<Map<String, Object>> payload) {
        try {
            List<Attendance> toSave = new ArrayList<>();
            int skipped = 0;

            for (Map<String, Object> item : payload) {
                Map<?, ?> studentMap = (Map<?, ?>) item.get("student");
                String studentUserId = studentMap != null ? String.valueOf(studentMap.get("id")) : null;
                if (studentUserId == null || studentUserId.equals("null")) {
                    skipped++;
                    continue;
                }

                Student student = studentRepository.findByUserId(studentUserId).orElse(null);
                if (student == null) {
                    // BUG-1 FIX: Log unresolved student IDs instead of silently skipping
                    log.warn("Batch attendance: could not resolve student for userId='{}', skipping record.", studentUserId);
                    skipped++;
                    continue;
                }

                Course course = null;
                Map<?, ?> courseMap = (Map<?, ?>) item.get("course");
                if (courseMap != null && courseMap.get("id") != null) {
                    try {
                        Long courseId = Long.parseLong(courseMap.get("id").toString());
                        course = courseRepository.findById(courseId).orElse(null);
                    } catch (NumberFormatException ignored) {}
                }

                String dateStr = item.get("date") != null ? item.get("date").toString() : LocalDate.now().toString();
                LocalDate date;
                try {
                    date = LocalDate.parse(dateStr);
                } catch (Exception e) {
                    date = LocalDate.now();
                }

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
                toSave.add(attendance);
            }

            List<Attendance> saved = attendanceRepository.saveAll(toSave);
            Map<String, Object> response = new HashMap<>();
            response.put("saved", saved.size());
            response.put("skipped", skipped);
            response.put("records", saved);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Batch attendance save failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to save attendance: " + e.getMessage()));
        }
    }
}
