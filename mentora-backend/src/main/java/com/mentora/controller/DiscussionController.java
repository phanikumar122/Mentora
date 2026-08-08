package com.mentora.controller;

import com.mentora.entity.DiscussionPost;
import com.mentora.entity.DiscussionReply;
import com.mentora.exception.ResourceNotFoundException;
import com.mentora.repository.DiscussionPostRepository;
import com.mentora.repository.DiscussionReplyRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/discussions")
public class DiscussionController {

    private final DiscussionPostRepository postRepository;
    private final DiscussionReplyRepository replyRepository;

    public DiscussionController(DiscussionPostRepository postRepository, DiscussionReplyRepository replyRepository) {
        this.postRepository = postRepository;
        this.replyRepository = replyRepository;
    }

    @GetMapping("/posts")
    public ResponseEntity<List<DiscussionPost>> getPosts() {
        return ResponseEntity.ok(postRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping("/posts")
    public ResponseEntity<DiscussionPost> createPost(@RequestBody DiscussionPost post) {
        return ResponseEntity.ok(postRepository.save(post));
    }

    @PostMapping("/posts/{id}/reply")
    public ResponseEntity<DiscussionReply> addReply(@PathVariable Long id, @RequestBody DiscussionReply reply) {
        DiscussionPost post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Discussion post not found with id: " + id));
        reply.setPost(post);
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
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        try {
            postRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Discussion post deleted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to delete post: " + e.getMessage()));
        }
    }
}
