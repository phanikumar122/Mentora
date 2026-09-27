package com.mentora.repository;

import com.mentora.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Boolean existsByEmail(String email);
    Boolean existsByEmailIgnoreCase(String email);
}

