package com.mentora.controller;

import com.mentora.dto.AuthRequest;
import com.mentora.dto.AuthResponse;
import com.mentora.dto.RegisterRequest;
import com.mentora.entity.User;
import com.mentora.repository.UserRepository;
import com.mentora.security.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public AuthController(AuthenticationManager authenticationManager, UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody AuthRequest loginRequest) {
        if (loginRequest == null || loginRequest.getEmail() == null || loginRequest.getPassword() == null) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of("status", 400, "error", "Bad Request", "message", "Email and password are required."));
        }

        String email = loginRequest.getEmail().trim();
        String password = loginRequest.getPassword();

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateToken((org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal());

            User user = userRepository.findByEmailIgnoreCase(email)
                    .orElseGet(() -> userRepository.findByEmail(email)
                            .orElse(null));

            if (user == null) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                        .body(java.util.Map.of("status", 401, "error", "Unauthorized", "message", "User account not found."));
            }

            String roleName = user.getRole() != null ? user.getRole().name() : "ROLE_ADMIN";

            return ResponseEntity.ok(AuthResponse.builder()
                    .token(jwt)
                    .type("Bearer")
                    .id(user.getId() != null ? user.getId() : "")
                    .email(user.getEmail() != null ? user.getEmail() : email)
                    .firstName(user.getFirstName() != null ? user.getFirstName() : "")
                    .lastName(user.getLastName() != null ? user.getLastName() : "")
                    .role(roleName)
                    .build());
        } catch (org.springframework.security.authentication.BadCredentialsException | org.springframework.security.core.userdetails.UsernameNotFoundException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("status", 401, "error", "Unauthorized", "message", "Invalid email or password. Please check your credentials."));
        } catch (org.springframework.security.authentication.DisabledException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(java.util.Map.of("status", 403, "error", "Forbidden", "message", "Your account is disabled. Please contact your administrator."));
        } catch (org.springframework.security.authentication.LockedException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(java.util.Map.of("status", 403, "error", "Forbidden", "message", "Your account is locked. Please contact your administrator."));
        } catch (org.springframework.security.core.AuthenticationException e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("status", 401, "error", "Unauthorized", "message", "Authentication failed: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during login for user: {}", email, e);
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("status", 500, "error", "Internal Server Error", "message", "Login processing error: " + e.getMessage()));
        }
    }

    // BUG-5 FIX: @Valid activates Jakarta validation constraints defined on RegisterRequest
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        User user = User.builder()
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .firstName(registerRequest.getFirstName())
                .lastName(registerRequest.getLastName())
                .role(registerRequest.getRole())
                .phoneNumber(registerRequest.getPhoneNumber())
                .isEnabled(true)
                .build();

        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully!");
    }
}
