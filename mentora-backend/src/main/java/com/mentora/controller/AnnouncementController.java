package com.mentora.controller;

import com.mentora.entity.Announcement;
import com.mentora.entity.Role;
import com.mentora.entity.User;
import com.mentora.repository.AnnouncementRepository;
import com.mentora.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    /**
     * BUG-3 FIX: Removed the impossible dead-code condition (author==null && author!=null).
     * Author is now always resolved from the JWT authentication token.
     * Only ADMIN and TEACHER roles may post announcements.
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    public ResponseEntity<Announcement> createAnnouncement(
            @RequestBody Announcement announcement,
            Authentication authentication) {
        if (authentication != null && authentication.getName() != null) {
            User author = userRepository.findByEmail(authentication.getName()).orElse(null);
            if (author != null) {
                announcement.setAuthor(author);
            }
        }
        return ResponseEntity.ok(announcementRepository.save(announcement));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id) {
        try {
            announcementRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Announcement deleted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to delete announcement: " + e.getMessage()));
        }
    }
}
