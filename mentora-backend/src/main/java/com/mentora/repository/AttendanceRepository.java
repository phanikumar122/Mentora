package com.mentora.repository;

import com.mentora.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentId(Long studentId);
    List<Attendance> findBySubjectIdAndDate(Long subjectId, LocalDate date);
    List<Attendance> findByStudentIdAndSubjectId(Long studentId, Long subjectId);
    List<Attendance> findByCourseId(Long courseId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Attendance a WHERE a.student.id = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Attendance a WHERE a.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);
}
