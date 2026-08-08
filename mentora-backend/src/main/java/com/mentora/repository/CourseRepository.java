package com.mentora.repository;

import com.mentora.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByDepartmentId(Long departmentId);
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, Long id);
}
