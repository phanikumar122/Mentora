package com.mentora.config;

import com.mentora.entity.Role;
import com.mentora.entity.User;
import com.mentora.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates an initial administrator only when explicitly enabled and only when
 * the configured account does not already exist. Startup must never delete
 * application data or reset an existing user's password.
 */
@Component
@Order(1)
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${mentora.bootstrap.admin.enabled:false}")
    private boolean bootstrapEnabled;

    @Value("${mentora.bootstrap.admin.email:}")
    private String adminEmail;

    @Value("${mentora.bootstrap.admin.password:}")
    private String adminPassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!bootstrapEnabled) {
            log.info("Administrator bootstrap is disabled.");
            return;
        }

        String normalizedEmail = adminEmail == null ? "" : adminEmail.trim().toLowerCase(java.util.Locale.ROOT);
        if (normalizedEmail.isBlank() || adminPassword == null || adminPassword.length() < 8) {
            log.warn("Administrator bootstrap skipped: configure a valid email and password of at least 8 characters.");
            return;
        }

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            log.info("Administrator account already exists; credentials were left unchanged.");
            return;
        }

        User admin = User.builder()
                .email(normalizedEmail)
                .password(passwordEncoder.encode(adminPassword))
                .firstName("Admin")
                .lastName("Mentora")
                .role(Role.ROLE_ADMIN)
                .isEnabled(true)
                .build();
        userRepository.save(admin);
        log.info("Initial administrator account created for {}. Change the bootstrap password after first sign-in.", normalizedEmail);
    }
}