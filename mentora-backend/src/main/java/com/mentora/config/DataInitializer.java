package com.mentora.config;

import com.mentora.entity.Role;
import com.mentora.entity.User;
import com.mentora.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final ParentRepository parentRepository;
    private final AttendanceRepository attendanceRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           TeacherRepository teacherRepository,
                           StudentRepository studentRepository,
                           ParentRepository parentRepository,
                           AttendanceRepository attendanceRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
        this.parentRepository = parentRepository;
        this.attendanceRepository = attendanceRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // 1. Remove all old dummy seed accounts and associated mock profiles from database
        cleanOldSeedAccounts();

        // 2. Ensure only the single Master Admin account exists with required credentials
        setupMasterAdmin();
    }

    private void cleanOldSeedAccounts() {
        List<String> oldSeedEmails = List.of(
                "admin@mentora.edu",
                "teacher@mentora.edu",
                "student@mentora.edu",
                "parent@mentora.edu",
                "teacher@mentora.com",
                "student@mentora.com",
                "parent@mentora.com"
        );

        for (String email : oldSeedEmails) {
            userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
                try {
                    String userId = user.getId();

                    // Clean student entity & attendance if any
                    studentRepository.findByUserId(userId).ifPresent(student -> {
                        try {
                            attendanceRepository.deleteByStudentId(student.getId());
                        } catch (Exception ignored) {}
                        studentRepository.delete(student);
                    });

                    // Clean teacher entity if any
                    teacherRepository.findByUserId(userId).ifPresent(teacherRepository::delete);

                    // Clean parent entity if any
                    parentRepository.findByUserId(userId).ifPresent(parentRepository::delete);

                    // Delete user record
                    userRepository.delete(user);
                    log.info("Cleaned up old seed account: {}", email);
                } catch (Exception e) {
                    log.warn("Could not clean old seed account {}: {}", email, e.getMessage());
                }
            });
        }
    }

    private void setupMasterAdmin() {
        String adminEmail = "admin@mentora.com";
        String adminPassword = "admin@mentora";

        User admin = userRepository.findByEmailIgnoreCase(adminEmail).orElseGet(() -> {
            User u = new User();
            u.setEmail(adminEmail);
            u.setFirstName("Admin");
            u.setLastName("Mentora");
            u.setRole(Role.ROLE_ADMIN);
            u.setPhoneNumber("+1 555-0100");
            u.setIsEnabled(true);
            return u;
        });

        // Always ensure password is set to admin@mentora and account is enabled
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ROLE_ADMIN);
        admin.setIsEnabled(true);
        if (admin.getFirstName() == null || admin.getFirstName().isEmpty()) {
            admin.setFirstName("Admin");
        }
        if (admin.getLastName() == null || admin.getLastName().isEmpty()) {
            admin.setLastName("Mentora");
        }

        userRepository.save(admin);

        log.info("╔══════════════════════════════════════════════════════╗");
        log.info("║         Mentora — Primary Admin Account Ready        ║");
        log.info("╠══════════════════════════════════════════════════════╣");
        log.info("║  ADMIN → admin@mentora.com / admin@mentora          ║");
        log.info("╚══════════════════════════════════════════════════════╝");
    }
}
