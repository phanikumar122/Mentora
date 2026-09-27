package com.mentora.config;

import com.mentora.entity.Role;
import com.mentora.entity.User;
import com.mentora.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final DataSource dataSource;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           DataSource dataSource,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.dataSource = dataSource;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // 1. Safely remove old dummy seed accounts without foreign key constraint failures
        cleanOldSeedAccounts();

        // 2. Ensure the Master Admin account is created and ready
        setupMasterAdmin();
    }

    private void cleanOldSeedAccounts() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            String oldSeedEmails = "'admin@mentora.edu', 'teacher@mentora.edu', 'student@mentora.edu', 'parent@mentora.edu', 'teacher@mentora.com', 'student@mentora.com', 'parent@mentora.com'";

            // Temporarily disable foreign key checks to safely purge old mock demo records
            try {
                stmt.execute("SET FOREIGN_KEY_CHECKS = 0");
            } catch (Exception ignored) {}

            try {
                stmt.executeUpdate("DELETE FROM attendance WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id IN (SELECT id FROM users WHERE email IN (" + oldSeedEmails + ")))");
                stmt.executeUpdate("DELETE FROM attendance WHERE student_id IN (SELECT id FROM students WHERE user_id IN (SELECT id FROM users WHERE email IN (" + oldSeedEmails + ")))");
                stmt.executeUpdate("DELETE FROM assignment_submissions WHERE student_id IN (SELECT id FROM students WHERE user_id IN (SELECT id FROM users WHERE email IN (" + oldSeedEmails + ")))");
                stmt.executeUpdate("DELETE FROM assignments WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id IN (SELECT id FROM users WHERE email IN (" + oldSeedEmails + ")))");
                stmt.executeUpdate("DELETE FROM study_materials WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id IN (SELECT id FROM users WHERE email IN (" + oldSeedEmails + ")))");
                stmt.executeUpdate("DELETE FROM subjects WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id IN (SELECT id FROM users WHERE email IN (" + oldSeedEmails + ")))");
                stmt.executeUpdate("DELETE FROM timetables WHERE teacher_id IN (SELECT id FROM teachers WHERE user_id IN (SELECT id FROM users WHERE email IN (" + oldSeedEmails + ")))");
                stmt.executeUpdate("DELETE FROM students WHERE user_id IN (SELECT id FROM users WHERE email IN (" + oldSeedEmails + "))");
                stmt.executeUpdate("DELETE FROM teachers WHERE user_id IN (SELECT id FROM users WHERE email IN (" + oldSeedEmails + "))");
                stmt.executeUpdate("DELETE FROM parents WHERE user_id IN (SELECT id FROM users WHERE email IN (" + oldSeedEmails + "))");
                stmt.executeUpdate("DELETE FROM users WHERE email IN (" + oldSeedEmails + ")");
                log.info("Successfully purged legacy seed accounts and mock relational data.");
            } finally {
                try {
                    stmt.execute("SET FOREIGN_KEY_CHECKS = 1");
                } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            log.warn("Legacy seed data cleanup notice (non-fatal): {}", e.getMessage());
        }
    }

    private void setupMasterAdmin() {
        try {
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

            // Set password to admin@mentora and ensure active state
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
            log.info("║         Mentora — Master Admin Account Ready         ║");
            log.info("╠══════════════════════════════════════════════════════╣");
            log.info("║  ADMIN → admin@mentora.com / admin@mentora          ║");
            log.info("╚══════════════════════════════════════════════════════╝");
        } catch (Exception e) {
            log.error("Failed to configure master admin account: {}", e.getMessage(), e);
        }
    }
}
