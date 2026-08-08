package com.mentora.config;

import com.mentora.entity.Role;
import com.mentora.entity.User;
import com.mentora.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * DataInitializer — Seeds default system accounts on every startup.
 *
 * Since H2 is in-memory and resets on every restart, this ensures
 * the following default accounts are always available:
 *
 *   Admin   : admin@mentora.edu    / admin123
 *   Teacher : teacher@mentora.edu  / teacher123
 *   Student : student@mentora.edu  / student123
 *   Parent  : parent@mentora.edu   / parent123
 *
 * Legacy admin account still seeded for backward compatibility:
 *   Admin   : admin@mentora.com    / Password123!
 *
 * If a user with the email already exists it is NOT overwritten.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Legacy admin account (backward compatibility)
        seedUser("admin@mentora.com",    "Password123!",  "System",    "Administrator", Role.ROLE_ADMIN,   "+1 555-0100");

        // Default accounts for all four roles
        seedUser("admin@mentora.edu",    "admin123",      "System",    "Admin",         Role.ROLE_ADMIN,   null);
        seedUser("teacher@mentora.edu",  "teacher123",    "Dr. Sarah", "Jenkins",       Role.ROLE_TEACHER, null);
        seedUser("student@mentora.edu",  "student123",    "Alex",      "Kumar",         Role.ROLE_STUDENT, null);
        seedUser("parent@mentora.edu",   "parent123",     "Robert",    "Kumar",         Role.ROLE_PARENT,  null);

        log.info("╔══════════════════════════════════════════════════════╗");
        log.info("║         Mentora — Default Accounts Ready             ║");
        log.info("╠══════════════════════════════════════════════════════╣");
        log.info("║  ADMIN   → admin@mentora.edu    / admin123           ║");
        log.info("║  TEACHER → teacher@mentora.edu  / teacher123         ║");
        log.info("║  STUDENT → student@mentora.edu  / student123         ║");
        log.info("║  PARENT  → parent@mentora.edu   / parent123          ║");
        log.info("║  LEGACY  → admin@mentora.com    / Password123!       ║");
        log.info("╚══════════════════════════════════════════════════════╝");
    }

    private void seedUser(String email, String rawPassword, String firstName,
                          String lastName, Role role, String phoneNumber) {
        if (!userRepository.existsByEmail(email)) {
            User user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(rawPassword))
                    .firstName(firstName)
                    .lastName(lastName)
                    .role(role)
                    .phoneNumber(phoneNumber)
                    .isEnabled(true)
                    .build();
            userRepository.save(user);
            log.info("Seeded {} → {}", role.name(), email);
        }
    }
}
