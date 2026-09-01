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
            User author = userRepository.findByEmail(authentication.getName()).orElse(null);
            if (author != null) {
                post.setAuthor(author);
            }
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
            User author = userRepository.findByEmail(authentication.getName()).orElse(null);
            if (author != null) {
                reply.setAuthor(author);
            }
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
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        try {
            postRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Discussion post deleted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to delete post: " + e.getMessage()));
        }
    }
}
