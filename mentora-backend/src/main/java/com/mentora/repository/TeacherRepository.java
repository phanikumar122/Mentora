package com.mentora.repository;

import com.mentora.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByUserId(String userId);
    Optional<Teacher> findByEmployeeId(String employeeId);
}
