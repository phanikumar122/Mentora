package com.mentora.repository;

import com.mentora.entity.DiscussionPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DiscussionPostRepository extends JpaRepository<DiscussionPost, Long> {
    List<DiscussionPost> findAllByOrderByCreatedAtDesc();
}
