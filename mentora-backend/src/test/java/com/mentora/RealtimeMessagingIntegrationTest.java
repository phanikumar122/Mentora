package com.mentora;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mentora.dto.ChatMessageDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.WebSocketHttpHeaders;

import java.lang.reflect.Type;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.awaitility.Awaitility.await;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "mentora.bootstrap.admin.enabled=true",
        "mentora.bootstrap.admin.email=realtime.admin@mentora.test",
        "mentora.bootstrap.admin.password=secure-test-password",
        "mentora.app.jwtSecret=test-only-signing-secret-with-more-than-32-characters"
})
class RealtimeMessagingIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private SimpUserRegistry simpUserRegistry;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void authenticatedRestMessageArrivesOnRecipientsPrivateWebSocketQueue() throws Exception {
        Map<String, Object> admin = login("realtime.admin@mentora.test", "secure-test-password");
        String adminToken = admin.get("token").toString();

        register(adminToken, "realtime.student@mentora.test", "ROLE_STUDENT");
        String teacherId = register(adminToken, "realtime.teacher@mentora.test", "ROLE_TEACHER");

        String studentToken = login("realtime.student@mentora.test", "password123").get("token").toString();
        String teacherToken = login("realtime.teacher@mentora.test", "password123").get("token").toString();

        WebSocketStompClient stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        MappingJackson2MessageConverter messageConverter = new MappingJackson2MessageConverter();
        messageConverter.setObjectMapper(objectMapper);
        stompClient.setMessageConverter(messageConverter);

        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add(HttpHeaders.AUTHORIZATION, "Bearer " + teacherToken);
        StompSession session = stompClient.connectAsync(
                "ws://localhost:" + port + "/ws-mentora-raw",
                new WebSocketHttpHeaders(),
                connectHeaders,
                new StompSessionHandlerAdapter() {}
        ).get(8, TimeUnit.SECONDS);
        CompletableFuture<ChatMessageDto> deliveredMessage = new CompletableFuture<>();
        session.subscribe("/user/queue/messages", new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return ChatMessageDto.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                deliveredMessage.complete((ChatMessageDto) payload);
            }
        });
        await().atMost(8, TimeUnit.SECONDS).until(() -> {
            var teacher = simpUserRegistry.getUser("realtime.teacher@mentora.test");
            return teacher != null && teacher.getSessions().stream()
                    .flatMap(registeredSession -> registeredSession.getSubscriptions().stream())
                    .anyMatch(subscription -> "/user/queue/messages".equals(subscription.getDestination()));
        });

        HttpHeaders sendHeaders = bearerHeaders(studentToken);
        ChatMessageDto request = new ChatMessageDto();
        request.setRecipientId(teacherId);
        request.setContent("Real-time integration message");

        ResponseEntity<ChatMessageDto> response = restTemplate.postForEntity(
                "/api/v1/chat/messages",
                new HttpEntity<>(request, sendHeaders),
                ChatMessageDto.class
        );
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());

        ChatMessageDto received = deliveredMessage.get(8, TimeUnit.SECONDS);
        assertEquals(response.getBody().getId(), received.getId());
        assertEquals("Real-time integration message", received.getContent());
        assertEquals(teacherId, received.getRecipientId());

        session.disconnect();
        stompClient.stop();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> login(String email, String password) {
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "/api/v1/auth/login",
                Map.of("email", email, "password", password),
                Map.class
        );
        assertEquals(200, response.getStatusCode().value());
        return response.getBody();
    }

    @SuppressWarnings("unchecked")
    private String register(String adminToken, String email, String role) {
        Map<String, Object> body = Map.of(
                "email", email,
                "password", "password123",
                "firstName", "Realtime",
                "lastName", "User",
                "role", role
        );
        ResponseEntity<Map> response = restTemplate.postForEntity(
                "/api/v1/auth/register",
                new HttpEntity<>(body, bearerHeaders(adminToken)),
                Map.class
        );
        assertEquals(201, response.getStatusCode().value());
        return response.getBody().get("id").toString();
    }

    private HttpHeaders bearerHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}