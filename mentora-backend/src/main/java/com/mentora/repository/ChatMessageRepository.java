package com.mentora.repository;

import com.mentora.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByRoomIdOrderBySentAtAsc(String roomId);

    @Query("SELECT m FROM ChatMessage m WHERE (m.sender.id = :u1 AND m.recipient.id = :u2) OR (m.sender.id = :u2 AND m.recipient.id = :u1) ORDER BY m.sentAt ASC")
    List<ChatMessage> findDirectMessagesBetween(@Param("u1") String user1Id, @Param("u2") String user2Id);
}
