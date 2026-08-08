package com.mentora.dto;

import com.mentora.entity.Role;

public class UserDto {
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private Role role;
    private String phoneNumber;
    private String profilePictureUrl;
    private Boolean isEnabled;

    public UserDto() {}

    public UserDto(String id, String email, String firstName, String lastName, Role role, String phoneNumber, String profilePictureUrl, Boolean isEnabled) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.role = role;
        this.phoneNumber = phoneNumber;
        this.profilePictureUrl = profilePictureUrl;
        this.isEnabled = isEnabled;
    }

    public static UserDtoBuilder builder() {
        return new UserDtoBuilder();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public Boolean getIsEnabled() { return isEnabled; }
    public void setIsEnabled(Boolean isEnabled) { this.isEnabled = isEnabled; }

    public static class UserDtoBuilder {
        private String id;
        private String email;
        private String firstName;
        private String lastName;
        private Role role;
        private String phoneNumber;
        private String profilePictureUrl;
        private Boolean isEnabled;

        public UserDtoBuilder id(String id) { this.id = id; return this; }
        public UserDtoBuilder email(String email) { this.email = email; return this; }
        public UserDtoBuilder firstName(String firstName) { this.firstName = firstName; return this; }
        public UserDtoBuilder lastName(String lastName) { this.lastName = lastName; return this; }
        public UserDtoBuilder role(Role role) { this.role = role; return this; }
        public UserDtoBuilder phoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; return this; }
        public UserDtoBuilder profilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; return this; }
        public UserDtoBuilder isEnabled(Boolean isEnabled) { this.isEnabled = isEnabled; return this; }

        public UserDto build() {
            return new UserDto(id, email, firstName, lastName, role, phoneNumber, profilePictureUrl, isEnabled);
        }
    }
}
