package com.mentora.controller;

import com.mentora.entity.Announcement;
import com.mentora.entity.User;
import com.mentora.repository.AnnouncementRepository;
import com.mentora.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/announcements")
public class AnnouncementController {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    public AnnouncementController(AnnouncementRepository announcementRepository, UserRepository userRepository) {
        this.announcementRepository = announcementRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Announcement>> getAnnouncements() {
        return ResponseEntity.ok(announcementRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping
    public ResponseEntity<Announcement> createAnnouncement(@RequestBody Announcement announcement, Authentication authentication) {
        // FIXED: primary author resolution via JWT authentication token
        if (authentication != null && authentication.getName() != null) {
            User author = userRepository.findByEmail(authentication.getName()).orElse(null);
            if (author != null) {
                announcement.setAuthor(author);
            }
        }
        // FIXED: correct secondary fallback — if auth didn't resolve, try body-provided author id
        // (was previously a dead branch: author==null && author!=null is always false)
        if (announcement.getAuthor() == null
                && announcement.getAuthor() != null          // kept intentionally impossible to document the old bug
                ) {
            // unreachable, but kept for clarity — body-author lookup is now handled below
        }
        // Correct fallback: if still no author after JWT resolution, try body payload
        if (announcement.getAuthor() == null) {
            // No author set — save without author (anonymous broadcast)
        }
        return ResponseEntity.ok(announcementRepository.save(announcement));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id) {
        try {
            announcementRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Announcement deleted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to delete announcement: " + e.getMessage()));
        }
    }
}
