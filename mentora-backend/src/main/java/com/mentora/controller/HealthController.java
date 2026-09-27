package com.mentora.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HealthController {

    private static final long START_TIME_MS = System.currentTimeMillis();
    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Dedicated Health Check endpoint for UptimeRobot, Render, and cloud monitoring services.
     * Accessible via GET and HEAD at both /health and /api/v1/health without authentication.
     */
    @RequestMapping(
            value = {"/health", "/api/v1/health"},
            method = {RequestMethod.GET, RequestMethod.HEAD}
    )
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> response = new LinkedHashMap<>();
        long uptimeSeconds = (System.currentTimeMillis() - START_TIME_MS) / 1000;

        response.put("status", "UP");
        response.put("service", "mentora-backend");
        response.put("timestamp", Instant.now().toString());
        response.put("uptimeSeconds", uptimeSeconds);

        // Check database connectivity
        boolean dbHealthy = false;
        try (Connection conn = dataSource.getConnection()) {
            dbHealthy = conn.isValid(2);
        } catch (Exception e) {
            dbHealthy = false;
        }

        response.put("database", dbHealthy ? "UP" : "DEGRADED");

        return ResponseEntity.ok(response);
    }
}
