package com.mentora.dto;

public class AuthResponse {
    private String token;
    private String type;
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String role;

    public AuthResponse() {}

    public AuthResponse(String token, String type, String id, String email, String firstName, String lastName, String role) {
        this.token = token;
        this.type = type;
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
    }

    public static AuthResponseBuilder builder() {
        return new AuthResponseBuilder();
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public static class AuthResponseBuilder {
        private String token;
        private String type;
        private String id;
        private String email;
        private String firstName;
        private String lastName;
        private String role;

        public AuthResponseBuilder token(String token) { this.token = token; return this; }
        public AuthResponseBuilder type(String type) { this.type = type; return this; }
        public AuthResponseBuilder id(String id) { this.id = id; return this; }
        public AuthResponseBuilder email(String email) { this.email = email; return this; }
        public AuthResponseBuilder firstName(String firstName) { this.firstName = firstName; return this; }
        public AuthResponseBuilder lastName(String lastName) { this.lastName = lastName; return this; }
        public AuthResponseBuilder role(String role) { this.role = role; return this; }

        public AuthResponse build() {
            return new AuthResponse(token, type, id, email, firstName, lastName, role);
        }
    }
}
