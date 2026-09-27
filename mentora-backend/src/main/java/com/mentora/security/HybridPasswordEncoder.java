package com.mentora.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Universal PasswordEncoder that securely validates both BCrypt-hashed passwords
 * and legacy/direct database stored passwords (plaintext, MD5, SHA-256), while ensuring
 * all new passwords are encrypted with standard BCrypt.
 */
public class HybridPasswordEncoder implements PasswordEncoder {

    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

    @Override
    public String encode(CharSequence rawPassword) {
        return bcrypt.encode(rawPassword);
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        if (rawPassword == null || encodedPassword == null) {
            return false;
        }

        String raw = rawPassword.toString();
        String encoded = encodedPassword.trim();

        // 1. Try standard BCrypt verification if prefix matches
        if (encoded.startsWith("$2a$") || encoded.startsWith("$2b$") || encoded.startsWith("$2y$") || encoded.startsWith("$2$")) {
            try {
                if (bcrypt.matches(raw, encoded)) {
                    return true;
                }
            } catch (Exception ignored) {
            }
        }

        // 2. Direct string / plaintext comparison
        if (raw.equals(encoded)) {
            return true;
        }

        // 3. Fallback: SHA-256 hex comparison (for databases with SHA-256 hashes)
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] hash = sha256.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            if (hexString.toString().equalsIgnoreCase(encoded)) {
                return true;
            }
        } catch (Exception ignored) {
        }

        // 4. Fallback: MD5 hex comparison
        try {
            MessageDigest md5 = MessageDigest.getInstance("MD5");
            byte[] hash = md5.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            if (hexString.toString().equalsIgnoreCase(encoded)) {
                return true;
            }
        } catch (Exception ignored) {
        }

        return false;
    }
}
