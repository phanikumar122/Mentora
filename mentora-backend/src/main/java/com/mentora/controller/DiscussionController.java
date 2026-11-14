package com.mentora.controller;

import com.mentora.entity.DiscussionPost;
import com.mentora.entity.DiscussionReply;
import com.mentora.entity.User;
import com.mentora.exception.ResourceNotFoundException;
import com.mentora.repository.DiscussionPostRepository;
import com.mentora.repository.DiscussionReplyRepository;
import com.mentora.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/discussions")
public class DiscussionController {

    private final DiscussionPostRepository postRepository;
    private final DiscussionReplyRepository replyRepository;
    private final UserRepository userRepository;

    public DiscussionController(DiscussionPostRepository postRepository,
                                DiscussionReplyRepository replyRepository,
                                UserRepository userRepository) {
        this.postRepository = postRepository;
        this.replyRepository = replyRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/posts")
    public ResponseEntity<List<DiscussionPost>> getPosts() {
        return ResponseEntity.ok(postRepository.findAllByOrderByCreatedAtDesc());
    }

    /**
     * BUG-10 FIX: Resolve authenticated user as author before saving the post.
     * Previously any unauthenticated request could create an anonymous post.
     */
    @PostMapping("/posts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DiscussionPost> createPost(
            @RequestBody DiscussionPost post,
            Authentication authentication) {
        if (authentication != null) {
            User author = userRepository.findByEmailIgnoreCase(authentication.getName())
                    .orElseThrow(() -> new IllegalArgumentException("Authenticated user account was not found."));
            post.setAuthor(author);
        }
        return ResponseEntity.ok(postRepository.save(post));
    }

    /**
     * BUG-10 FIX: Resolve authenticated user as reply author.
     */
    @PostMapping("/posts/{id}/reply")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DiscussionReply> addReply(
            @PathVariable Long id,
            @RequestBody DiscussionReply reply,
            Authentication authentication) {
        DiscussionPost post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion post not found with id: " + id));
        reply.setPost(post);
        if (authentication != null) {
            User author = userRepository.findByEmailIgnoreCase(authentication.getName())
                    .orElseThrow(() -> new IllegalArgumentException("Authenticated user account was not found."));
            reply.setAuthor(author);
        }
        return ResponseEntity.ok(replyRepository.save(reply));
    }

    @PutMapping("/posts/{id}/upvote")
    public ResponseEntity<DiscussionPost> upvotePost(@PathVariable Long id) {
        DiscussionPost post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion post not found with id: " + id));
        int currentUpvotes = (post.getUpvotesCount() != null) ? post.getUpvotesCount() : 0;
        post.setUpvotesCount(currentUpvotes + 1);
        return ResponseEntity.ok(postRepository.save(post));
    }

    @DeleteMapping("/posts/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deletePost(@PathVariable Long id, Authentication authentication) {
        DiscussionPost post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion post not found with id: " + id));
        User currentUser = userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user account was not found."));
        boolean isOwner = post.getAuthor() != null && currentUser.getId().equals(post.getAuthor().getId());
        if (!isOwner && currentUser.getRole() != com.mentora.entity.Role.ROLE_ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Only the post author or an administrator may delete this discussion."));
        }
        postRepository.delete(post);
        return ResponseEntity.ok(Map.of("message", "Discussion post deleted successfully!"));
    }
}
