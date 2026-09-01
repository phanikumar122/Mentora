package com.mentora.repository;

import com.mentora.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUserId(String userId);
    Optional<Student> findByRollNumber(String rollNumber);

    List<Student> findByAdvisorIsNull();

    @Query("SELECT s FROM Student s WHERE s.advisor.user.id = :teacherUserId")
    List<Student> findByAdvisorUserId(@Param("teacherUserId") String teacherUserId);

    @Query("SELECT s FROM Student s WHERE s.advisor.id = :advisorId")
    List<Student> findByAdvisorId(@Param("advisorId") Long advisorId);
}

