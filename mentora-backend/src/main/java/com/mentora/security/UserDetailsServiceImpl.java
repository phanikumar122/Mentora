package com.mentora.security;

import com.mentora.entity.User;
import com.mentora.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        if (email == null || email.trim().isEmpty()) {
            throw new UsernameNotFoundException("Email cannot be empty");
        }

        String trimmedEmail = email.trim();
        User user = userRepository.findByEmailIgnoreCase(trimmedEmail)
                .orElseGet(() -> userRepository.findByEmail(trimmedEmail)
                        .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email)));

        boolean enabled = user.getIsEnabled() != null ? user.getIsEnabled() : true;

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                enabled,
                true, true, true,
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name()))
        );
    }
}
