package com.mentora.repository;

import com.mentora.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findByCourseId(Long courseId);
    List<Subject> findByTeacherId(Long teacherId);
}
