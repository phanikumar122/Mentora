package com.mentora.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import com.mentora.security.JwtUtils;
import com.mentora.security.UserDetailsServiceImpl;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.util.StringUtils;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtils jwtUtils;
    private final UserDetailsServiceImpl userDetailsService;

    public WebSocketConfig(JwtUtils jwtUtils, UserDetailsServiceImpl userDetailsService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }

    @Value("${mentora.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null) return message;
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authorization = accessor.getFirstNativeHeader("Authorization");
                    if (!StringUtils.hasText(authorization) || !authorization.startsWith("Bearer ")) {
                        throw new IllegalArgumentException("A bearer token is required for real-time messaging.");
                    }
                    String token = authorization.substring(7);
                    if (!jwtUtils.validateToken(token)) {
                        throw new IllegalArgumentException("The real-time messaging token is invalid or expired.");
                    }
                    UserDetails userDetails = userDetailsService.loadUserByUsername(jwtUtils.getUsernameFromToken(token));
                    accessor.setUser(new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities()));
                } else if (StompCommand.SEND.equals(accessor.getCommand())) {
                    throw new IllegalArgumentException("Client STOMP sends are disabled; use the authenticated chat API.");
                } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand()) && accessor.getUser() == null) {
                    throw new IllegalArgumentException("Authentication is required for real-time messaging.");
                } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())
                        && !"/user/queue/messages".equals(accessor.getDestination())) {
                    throw new IllegalArgumentException("Subscription to this real-time destination is not allowed.");
                }
                return message;
            }
        });
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = java.util.Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toArray(String[]::new);
        registry.addEndpoint("/ws-mentora")
                .setAllowedOriginPatterns(origins)
                .withSockJS();
        registry.addEndpoint("/ws-mentora-raw")
                .setAllowedOriginPatterns(origins);
    }
}
