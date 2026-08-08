package com.mentora.controller;

import com.mentora.entity.Course;
import com.mentora.entity.Department;
import com.mentora.entity.Subject;
import com.mentora.entity.Timetable;
import com.mentora.repository.AttendanceRepository;
import com.mentora.repository.CourseRepository;
import com.mentora.repository.DepartmentRepository;
import com.mentora.repository.SubjectRepository;
import com.mentora.repository.TimetableRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class AcademicController {

    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final TimetableRepository timetableRepository;
    private final AttendanceRepository attendanceRepository;

    public AcademicController(DepartmentRepository departmentRepository,
                               CourseRepository courseRepository,
                               SubjectRepository subjectRepository,
                               TimetableRepository timetableRepository,
                               AttendanceRepository attendanceRepository) {
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
        this.subjectRepository = subjectRepository;
        this.timetableRepository = timetableRepository;
        this.attendanceRepository = attendanceRepository;
    }

    @GetMapping("/departments")
    public ResponseEntity<List<Department>> getDepartments() {
        return ResponseEntity.ok(departmentRepository.findAll());
    }

    @PostMapping("/departments")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Department> createDepartment(@RequestBody Department department) {
        return ResponseEntity.ok(departmentRepository.save(department));
    }

    @DeleteMapping("/departments/{id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable Long id) {
        try {
            // Nullify course-department links before deleting department
            for (Course c : courseRepository.findAll()) {
                if (c.getDepartment() != null && c.getDepartment().getId().equals(id)) {
                    c.setDepartment(null);
                    courseRepository.save(c);
                }
            }
            departmentRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Department deleted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to delete department: " + e.getMessage()));
        }
    }

    @GetMapping("/courses")
    public ResponseEntity<List<Course>> getCourses() {
        return ResponseEntity.ok(courseRepository.findAll());
    }

    @PostMapping("/courses")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> createCourse(@RequestBody Course course) {
        if (course.getCode() != null && courseRepository.existsByCode(course.getCode().trim())) {
            return ResponseEntity.status(409)
                    .body(Map.of("message", "A course with code '" + course.getCode() + "' already exists."));
        }
        if (course.getDepartment() != null && course.getDepartment().getId() != null) {
            Department dept = departmentRepository.findById(course.getDepartment().getId()).orElse(null);
            course.setDepartment(dept);
        }
        if (course.getCode() != null) course.setCode(course.getCode().trim());
        return ResponseEntity.ok(courseRepository.save(course));
    }

    @DeleteMapping("/courses/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        try {
            // FIXED MAJOR-3: Clean up Attendance FK references before deleting course
            attendanceRepository.deleteByCourseId(id);
            courseRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Course deleted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to delete course: " + e.getMessage()));
        }
    }

    @GetMapping("/subjects")
    public ResponseEntity<List<Subject>> getSubjects() {
        return ResponseEntity.ok(subjectRepository.findAll());
    }

    @GetMapping("/timetable")
    public ResponseEntity<List<Timetable>> getTimetable() {
        return ResponseEntity.ok(timetableRepository.findAll());
    }
}
