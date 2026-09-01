package com.mentora.repository;

import com.mentora.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByDepartmentId(Long departmentId);
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, Long id);

    // BUG-8 FIX: Nullify department FK for all courses in a single bulk UPDATE
    // instead of loading every course into memory and saving one-by-one.
    @Modifying
    @Transactional
    @Query("UPDATE Course c SET c.department = null WHERE c.department.id = :departmentId")
    void nullifyDepartmentById(@Param("departmentId") Long departmentId);
}
