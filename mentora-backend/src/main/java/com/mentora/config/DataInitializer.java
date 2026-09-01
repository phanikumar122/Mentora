package com.mentora.config;

import com.mentora.entity.*;
import com.mentora.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final ParentRepository parentRepository;
    private final DepartmentRepository departmentRepository;
    private final CourseRepository courseRepository;
    private final SubjectRepository subjectRepository;
    private final AttendanceRepository attendanceRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           TeacherRepository teacherRepository,
                           StudentRepository studentRepository,
                           ParentRepository parentRepository,
                           DepartmentRepository departmentRepository,
                           CourseRepository courseRepository,
                           SubjectRepository subjectRepository,
                           AttendanceRepository attendanceRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
        this.parentRepository = parentRepository;
        this.departmentRepository = departmentRepository;
        this.courseRepository = courseRepository;
        this.subjectRepository = subjectRepository;
        this.attendanceRepository = attendanceRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Legacy admin account (backward compatibility)
        seedUser("admin@mentora.com",    "Password123!",  "System",    "Administrator", Role.ROLE_ADMIN,   "+1 555-0100");

        // Default accounts for all four roles
        User adminUser   = seedUser("admin@mentora.edu",    "admin123",      "System",    "Admin",         Role.ROLE_ADMIN,   null);
        User teacherUser = seedUser("teacher@mentora.edu",  "teacher123",    "Dr. Sarah", "Jenkins",       Role.ROLE_TEACHER, "+1 555-0200");
        User studentUser = seedUser("student@mentora.edu",  "student123",    "Alex",      "Kumar",         Role.ROLE_STUDENT, "+1 555-0300");
        User parentUser  = seedUser("parent@mentora.edu",   "parent123",     "Robert",    "Kumar",         Role.ROLE_PARENT,  "+1 555-0400");

        // Seed Department
        Department csDept = departmentRepository.findAll().stream().findFirst().orElseGet(() -> {
            Department d = new Department();
            d.setName("Computer Science & Engineering");
            d.setCode("CSE");
            return departmentRepository.save(d);
        });

        // Seed Course
        Course csCourse = courseRepository.findAll().stream().findFirst().orElseGet(() -> {
            Course c = new Course();
            c.setCode("CS-101");
            c.setName("B.Tech Computer Science & Engineering");
            c.setDepartment(csDept);
            c.setCredits(4);
            return courseRepository.save(c);
        });

        // Seed Teacher profile
        Teacher teacher = teacherRepository.findByUserId(teacherUser.getId()).orElseGet(() -> {
            Teacher t = new Teacher();
            t.setUser(teacherUser);
            t.setEmployeeId("EMP-1001");
            t.setDepartment(csDept);
            t.setDesignation("Associate Professor & Academic Mentor");
            t.setQualification("Ph.D. Computer Science");
            return teacherRepository.save(t);
        });

        // Seed Student profile with Advisor link
        Student student = studentRepository.findByUserId(studentUser.getId()).orElseGet(() -> {
            Student s = new Student();
            s.setUser(studentUser);
            s.setRollNumber("STU-2026-001");
            s.setDepartment(csDept);
            s.setCourse(csCourse);
            s.setSemester(4);
            s.setCgpa(3.85);
            s.setAdvisor(teacher);
            return studentRepository.save(s);
        });

        if (student.getAdvisor() == null) {
            student.setAdvisor(teacher);
            studentRepository.save(student);
        }

        // Seed Parent profile linked to Student Ward
        parentRepository.findByUserId(parentUser.getId()).orElseGet(() -> {
            Parent p = new Parent();
            p.setUser(parentUser);
            p.setStudentWard(studentUser);
            p.setRelationship("Father");
            return parentRepository.save(p);
        });

        // Seed Subject
        Subject dsaSubject = subjectRepository.findAll().stream().findFirst().orElseGet(() -> {
            Subject s = new Subject();
            s.setCode("CS201");
            s.setName("Data Structures & Algorithms");
            s.setDepartment(csDept);
            s.setCourse(csCourse);
            s.setTeacher(teacher);
            return subjectRepository.save(s);
        });

        // Seed sample Attendance history for heatmaps (over past 90 days) if empty
        if (attendanceRepository.findByStudentId(student.getId()).isEmpty()) {
            List<Attendance> sampleLogs = new ArrayList<>();
            LocalDate today = LocalDate.now();
            for (int i = 80; i >= 0; i--) {
                LocalDate logDate = today.minusDays(i);
                // Skip weekends
                if (logDate.getDayOfWeek().getValue() >= 6) continue;

                Attendance a = new Attendance();
                a.setStudent(student);
                a.setCourse(csCourse);
                a.setSubject(dsaSubject);
                a.setTeacher(teacher);
                a.setDate(logDate);

                // 88% Present, 8% Late, 4% Absent
                int rand = (i * 17) % 100;
                if (rand < 88) {
                    a.setStatus(AttendanceStatus.PRESENT);
                } else if (rand < 96) {
                    a.setStatus(AttendanceStatus.LATE);
                    a.setRemarks("Late by 10 mins");
                } else {
                    a.setStatus(AttendanceStatus.ABSENT);
                    a.setRemarks("Excused Absence");
                }
                sampleLogs.add(a);
            }
            attendanceRepository.saveAll(sampleLogs);
            log.info("Seeded {} attendance records for student Alex Kumar.", sampleLogs.size());
        }

        log.info("╔══════════════════════════════════════════════════════╗");
        log.info("║         Mentora — Default Accounts Ready             ║");
        log.info("╠══════════════════════════════════════════════════════╣");
        log.info("║  ADMIN   → admin@mentora.edu    / admin123           ║");
        log.info("║  TEACHER → teacher@mentora.edu  / teacher123         ║");
        log.info("║  STUDENT → student@mentora.edu  / student123         ║");
        log.info("║  PARENT  → parent@mentora.edu   / parent123          ║");
        log.info("║  LEGACY  → admin@mentora.com    / Password123!       ║");
        log.info("╚══════════════════════════════════════════════════════╝");

        // BUG-14 FIX: Warn operators that seed accounts use weak dev-only passwords
        log.warn("╔══════════════════════════════════════════════════════════╗");
        log.warn("║  ⚠  SECURITY WARNING — DEV SEED ACCOUNTS ACTIVE         ║");
        log.warn("║  These accounts use WEAK DEMO PASSWORDS.                 ║");
        log.warn("║  CHANGE or DISABLE them before deploying to production!  ║");
        log.warn("╚══════════════════════════════════════════════════════════╝");
    }

    private User seedUser(String email, String rawPassword, String firstName,
                          String lastName, Role role, String phoneNumber) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(rawPassword))
                    .firstName(firstName)
                    .lastName(lastName)
                    .role(role)
                    .phoneNumber(phoneNumber)
                    .isEnabled(true)
                    .build();
            User saved = userRepository.save(user);
            log.info("Seeded {} → {}", role.name(), email);
            return saved;
        });
    }
}

