package com.mentora.controller;

import com.mentora.dto.ChatMessageDto;
import com.mentora.entity.ChatMessage;
import com.mentora.entity.User;
import com.mentora.repository.ChatMessageRepository;
import com.mentora.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
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

    @MessageMapping("/chat.sendMessage")
    public void processMessage(@Payload ChatMessageDto chatMessageDto) {
        saveAndBroadcastMessage(chatMessageDto, null);
    }

    @PostMapping("/messages")
    public ResponseEntity<ChatMessageDto> sendMessageRest(
            @RequestBody ChatMessageDto chatMessageDto,
            Authentication authentication) {
        ChatMessageDto savedDto = saveAndBroadcastMessage(chatMessageDto, authentication);
        return ResponseEntity.ok(savedDto);
    }

    @GetMapping("/messages/{senderId}/{recipientId}")
    public ResponseEntity<List<ChatMessageDto>> getDirectMessages(
            @PathVariable String senderId,
            @PathVariable String recipientId) {
        
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
        if (chatMessageDto.getSenderId() != null && !chatMessageDto.getSenderId().isEmpty()) {
            sender = userRepository.findById(chatMessageDto.getSenderId())
                    .orElseGet(() -> userRepository.findByEmail(chatMessageDto.getSenderId()).orElse(null));
        }
        if (sender == null && authentication != null) {
            sender = userRepository.findByEmail(authentication.getName()).orElse(null);
        }

        User recipient = null;
        if (chatMessageDto.getRecipientId() != null && !chatMessageDto.getRecipientId().isEmpty()) {
            recipient = userRepository.findById(chatMessageDto.getRecipientId())
                    .orElseGet(() -> userRepository.findByEmail(chatMessageDto.getRecipientId()).orElse(null));
        }

        if (sender != null) {
            ChatMessage message = ChatMessage.builder()
                    .sender(sender)
                    .recipient(recipient)
                    .roomId(chatMessageDto.getRoomId())
                    .content(chatMessageDto.getContent())
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
                    messagingTemplate.convertAndSendToUser(recipient.getId(), "/queue/messages", chatMessageDto);
                } catch (Exception e) {
                    // BUG-11 FIX: Log STOMP delivery failures instead of silently swallowing them
                    log.warn("STOMP direct delivery failed for recipient='{}': {}", recipient.getId(), e.getMessage());
                }
            } else if (chatMessageDto.getRoomId() != null) {
                try {
                    messagingTemplate.convertAndSend("/topic/room/" + chatMessageDto.getRoomId(), chatMessageDto);
                } catch (Exception e) {
                    // BUG-11 FIX: Log STOMP room broadcast failures
                    log.warn("STOMP room broadcast failed for roomId='{}': {}", chatMessageDto.getRoomId(), e.getMessage());
                }
            }
        }
        return chatMessageDto;
    }
}
