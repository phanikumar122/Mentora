package com.mentora.controller;

import com.mentora.dto.ChatMessageDto;
import com.mentora.entity.ChatMessage;
import com.mentora.entity.Role;
import com.mentora.entity.User;
import com.mentora.repository.ChatMessageRepository;
import com.mentora.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    public ChatController(SimpMessagingTemplate messagingTemplate, ChatMessageRepository chatMessageRepository, UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/messages")
    public ResponseEntity<?> sendMessageRest(
            @RequestBody ChatMessageDto chatMessageDto,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(java.util.Map.of("message", "Authentication is required."));
        }
        ChatMessageDto savedDto = saveAndBroadcastMessage(chatMessageDto, authentication);
        return ResponseEntity.ok(savedDto);
    }

    @GetMapping("/messages/{senderId}/{recipientId}")
    public ResponseEntity<List<ChatMessageDto>> getDirectMessages(
            @PathVariable String senderId,
            @PathVariable String recipientId,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        User currentUser = userRepository.findByEmailIgnoreCase(authentication.getName()).orElse(null);
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        
        // Resolve user 1 ID
        String u1Id = senderId;
        User u1 = userRepository.findById(senderId)
                .orElseGet(() -> userRepository.findByEmail(senderId).orElse(null));
        if (u1 != null) {
            u1Id = u1.getId();
        }

        // Resolve user 2 ID
        String u2Id = recipientId;
        User u2 = userRepository.findById(recipientId)
                .orElseGet(() -> userRepository.findByEmail(recipientId).orElse(null));
        if (u2 != null) {
            u2Id = u2.getId();
        }

        if (!currentUser.getId().equals(u1Id) && !currentUser.getId().equals(u2Id)) {
            return ResponseEntity.status(403).build();
        }

        if (u1 != null && u2 != null && !canCommunicate(u1, u2)) {
            log.warn("Blocked direct message fetch for disallowed role pair: senderId={}, recipientId={}", u1Id, u2Id);
            return ResponseEntity.status(403).build();
        }

        List<ChatMessage> messages = chatMessageRepository.findDirectMessagesBetween(u1Id, u2Id);
        List<ChatMessageDto> dtos = messages.stream().map(m -> ChatMessageDto.builder()
                .id(m.getId())
                .senderId(m.getSender() != null ? m.getSender().getId() : null)
                .senderName(m.getSender() != null ? m.getSender().getFirstName() + " " + m.getSender().getLastName() : "Unknown")
                .recipientId(m.getRecipient() != null ? m.getRecipient().getId() : null)
                .roomId(m.getRoomId())
                .content(m.getContent())
                .sentAt(m.getSentAt())
                .isRead(m.getIsRead())
                .build()).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    private ChatMessageDto saveAndBroadcastMessage(ChatMessageDto chatMessageDto, Authentication authentication) {
        User sender = null;
        if (authentication != null) {
            sender = userRepository.findByEmailIgnoreCase(authentication.getName()).orElse(null);
        } else if (chatMessageDto.getSenderId() != null && !chatMessageDto.getSenderId().isEmpty()) {
            sender = userRepository.findById(chatMessageDto.getSenderId())
                    .orElseGet(() -> userRepository.findByEmail(chatMessageDto.getSenderId()).orElse(null));
        }
        if (sender == null) {
            throw new IllegalArgumentException("Unable to resolve the authenticated sender.");
        }

        User recipient = null;
        if (chatMessageDto.getRecipientId() != null && !chatMessageDto.getRecipientId().isEmpty()) {
            recipient = userRepository.findById(chatMessageDto.getRecipientId())
                    .orElseGet(() -> userRepository.findByEmail(chatMessageDto.getRecipientId()).orElse(null));
        }

        if (sender != null && recipient != null && !canCommunicate(sender, recipient)) {
            log.warn("Blocked messaging attempt for disallowed role pair: sender={}, recipient={}", sender.getId(), recipient.getId());
            throw new IllegalArgumentException("This direct conversation is not allowed for the selected account roles.");
        }

        if (recipient == null) {
            throw new IllegalArgumentException("A valid recipient is required.");
        }
        if (chatMessageDto.getContent() == null || chatMessageDto.getContent().trim().isEmpty()) {
            throw new IllegalArgumentException("Message content is required.");
        }

        if (sender != null) {
            ChatMessage message = ChatMessage.builder()
                    .sender(sender)
                    .recipient(recipient)
                    .roomId(chatMessageDto.getRoomId())
                    .content(chatMessageDto.getContent().trim())
                    .sentAt(LocalDateTime.now())
                    .isRead(false)
                    .build();

            chatMessageRepository.save(message);
            chatMessageDto.setId(message.getId());
            chatMessageDto.setSenderId(sender.getId());
            chatMessageDto.setSenderName(sender.getFirstName() + " " + sender.getLastName());
            if (recipient != null) {
                chatMessageDto.setRecipientId(recipient.getId());
            }
            chatMessageDto.setSentAt(message.getSentAt());

            if (recipient != null) {
                try {
                    messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/messages", chatMessageDto);
                    messagingTemplate.convertAndSendToUser(sender.getEmail(), "/queue/messages", chatMessageDto);
                } catch (Exception e) {
                    log.warn("STOMP direct delivery failed for recipient='{}': {}", recipient.getId(), e.getMessage());
                }
            }
        }
        return chatMessageDto;
    }

    private boolean canCommunicate(User first, User second) {
        if (first.getId().equals(second.getId())) return false;
        if (first.getRole() == Role.ROLE_STUDENT) {
            return second.getRole() == Role.ROLE_TEACHER || second.getRole() == Role.ROLE_ADMIN;
        }
        if (second.getRole() == Role.ROLE_STUDENT) {
            return first.getRole() == Role.ROLE_TEACHER || first.getRole() == Role.ROLE_ADMIN;
        }
        if (first.getRole() == Role.ROLE_PARENT) {
            return second.getRole() == Role.ROLE_TEACHER || second.getRole() == Role.ROLE_ADMIN;
        }
        if (second.getRole() == Role.ROLE_PARENT) {
            return first.getRole() == Role.ROLE_TEACHER || first.getRole() == Role.ROLE_ADMIN;
        }
        return true;
    }
}
