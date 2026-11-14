package com.mentora;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "mentora.bootstrap.admin.enabled=true",
        "mentora.bootstrap.admin.email=admin@mentora.test",
        "mentora.bootstrap.admin.password=secure-test-password",
        "mentora.app.jwtSecret=test-only-signing-secret-with-more-than-32-characters"
})
@AutoConfigureMockMvc
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void healthEndpointIsPublicAndReportsDatabase() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.database").value("UP"));
    }

    @Test
    void registrationRequiresAdministratorAuthentication() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"attacker@example.com","password":"password123","firstName":"Bad","lastName":"Actor","role":"ROLE_ADMIN"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void bootstrapAdministratorCanLoginAndCreateAnAccount() throws Exception {
        JsonNode admin = login("admin@mentora.test", "secure-test-password");
        String token = admin.get("token").asText();

        mockMvc.perform(post("/api/v1/auth/register")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"student@mentora.test","password":"password123","firstName":"Test","lastName":"Student","role":"ROLE_STUDENT"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty());
    }

    @Test
    void authenticatedChatSenderCannotBeSpoofed() throws Exception {
        JsonNode admin = login("admin@mentora.test", "secure-test-password");
        String adminToken = admin.get("token").asText();

        String studentId = register(adminToken, "chat.student@mentora.test", "ROLE_STUDENT");
        String teacherId = register(adminToken, "chat.teacher@mentora.test", "ROLE_TEACHER");
        JsonNode student = login("chat.student@mentora.test", "password123");

        mockMvc.perform(post("/api/v1/chat/messages")
                        .header("Authorization", "Bearer " + student.get("token").asText())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"senderId":"%s","recipientId":"%s","content":"Hello mentor"}
                                """.formatted(admin.get("id").asText(), teacherId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.senderId").value(studentId))
                .andExpect(jsonPath("$.recipientId").value(teacherId));
    }

    @Test
    void authenticatedUserCanChangePasswordUsingCurrentPassword() throws Exception {
        JsonNode admin = login("admin@mentora.test", "secure-test-password");
        String adminToken = admin.get("token").asText();
        register(adminToken, "password.user@mentora.test", "ROLE_TEACHER");
        JsonNode account = login("password.user@mentora.test", "password123");

        mockMvc.perform(put("/api/v1/users/me/password")
                        .header("Authorization", "Bearer " + account.get("token").asText())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"currentPassword":"password123","newPassword":"A-strong-new-password-2026"}
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"password.user@mentora.test","password":"password123"}
                                """))
                .andExpect(status().isUnauthorized());

        login("password.user@mentora.test", "A-strong-new-password-2026");
    }

    private JsonNode login(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response);
    }

    private String register(String adminToken, String email, String role) throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/register")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"password123","firstName":"Chat","lastName":"User","role":"%s"}
                                """.formatted(email, role)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asText();
    }
}