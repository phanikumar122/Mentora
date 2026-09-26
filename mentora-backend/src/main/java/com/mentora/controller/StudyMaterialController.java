package com.mentora.controller;

import com.mentora.entity.MaterialType;
import com.mentora.entity.StudyMaterial;
import com.mentora.repository.StudyMaterialRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.*;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/materials")
public class StudyMaterialController {

    private static final Logger log = LoggerFactory.getLogger(StudyMaterialController.class);

    private final StudyMaterialRepository studyMaterialRepository;
    private final Path uploadDir = Paths.get(System.getProperty("user.dir"), "uploads");

    public StudyMaterialController(StudyMaterialRepository studyMaterialRepository) {
        this.studyMaterialRepository = studyMaterialRepository;
        try {
            Files.createDirectories(uploadDir);
        } catch (Exception e) {
            log.warn("Could not create upload directory: {}", e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<StudyMaterial>> getAllMaterials() {
        return ResponseEntity.ok(studyMaterialRepository.findAll());
    }

    @GetMapping("/subject/{subjectId}")
    public ResponseEntity<List<StudyMaterial>> getMaterialsBySubject(@PathVariable Long subjectId) {
        return ResponseEntity.ok(studyMaterialRepository.findBySubjectId(subjectId));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    public ResponseEntity<?> uploadMaterial(@RequestBody StudyMaterial material) {
        try {
            if (material.getFileUrl() != null && material.getFileUrl().startsWith("data:")) {
                try {
                    int commaIdx = material.getFileUrl().indexOf(",");
                    String base64Data = material.getFileUrl().substring(commaIdx + 1);
                    byte[] decoded = Base64.getDecoder().decode(base64Data);
                    material.setFileData(decoded);
                } catch (Exception ex) {
                    log.warn("Failed to decode base64 fileUrl data: {}", ex.getMessage());
                }
            }
            StudyMaterial saved = studyMaterialRepository.save(material);
            if (saved.getFileData() != null && saved.getFileData().length > 0) {
                saved.setFileUrl("/api/v1/materials/" + saved.getId() + "/download");
                saved = studyMaterialRepository.save(saved);
            }
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to save material: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    public ResponseEntity<?> uploadMaterialWithFile(
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "materialType", required = false) String materialType,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        try {
            StudyMaterial material = new StudyMaterial();
            material.setTitle(title);
            material.setDescription(description != null ? description : "");

            if (materialType != null) {
                try {
                    material.setMaterialType(MaterialType.valueOf(materialType));
                } catch (Exception e) {
                    material.setMaterialType(MaterialType.DOCUMENT);
                }
            } else {
                material.setMaterialType(MaterialType.DOCUMENT);
            }

            if (file != null && !file.isEmpty()) {
                byte[] fileBytes = file.getBytes();
                material.setFileData(fileBytes);

                String originalFilename = file.getOriginalFilename();
                String safeName = System.currentTimeMillis() + "_" + (originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_") : "doc.pdf");

                // Save to local upload directory as disk cache/backup
                try {
                    Files.createDirectories(uploadDir);
                    Path targetPath = uploadDir.resolve(safeName);
                    Files.write(targetPath, fileBytes);
                } catch (Exception ex) {
                    log.warn("Could not copy file to upload directory: {}", ex.getMessage());
                }

                material.setFileName(originalFilename != null ? originalFilename : "uploaded_file.pdf");
                material.setFileSize(formatBytes(file.getSize()));
            } else {
                material.setFileName(title.replaceAll("\\s+", "_") + ".pdf");
                material.setFileSize("1.0 MB");
            }

            // Save first to get generated ID
            StudyMaterial saved = studyMaterialRepository.save(material);

            // Set standardized download URL
            if (saved.getFileData() != null && saved.getFileData().length > 0) {
                saved.setFileUrl("/api/v1/materials/" + saved.getId() + "/download");
            } else {
                saved.setFileUrl("/api/v1/materials/files/" + saved.getFileName());
            }

            saved = studyMaterialRepository.save(saved);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("File upload error", e);
            return ResponseEntity.badRequest().body(Map.of("message", "File upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String fileName) {
        try {
            Path filePath = uploadDir.resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = determineContentType(fileName);
                }
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + (resource.getFilename() != null ? resource.getFilename() : fileName) + "\"")
                        .body(resource);
            }
        } catch (Exception e) {
            log.error("Error reading file {}: {}", fileName, e.getMessage());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> downloadFile(@PathVariable Long id) {
        StudyMaterial material = studyMaterialRepository.findById(id).orElse(null);
        if (material == null) {
            return ResponseEntity.notFound().build();
        }

        // 1. Direct database binary blob response if original PDF file bytes exist in DB
        if (material.getFileData() != null && material.getFileData().length > 0) {
            String filename = material.getFileName() != null ? material.getFileName() : "document.pdf";
            String contentType = determineContentType(filename);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(material.getFileData());
        }

        // 2. Fallback to fileUrl / disk check
        String fileUrl = material.getFileUrl();
        if (fileUrl != null && fileUrl.startsWith("/api/v1/materials/files/")) {
            String fileName = fileUrl.substring("/api/v1/materials/files/".length());
            return getFile(fileName);
        } else if (fileUrl != null && fileUrl.startsWith("data:")) {
            try {
                int commaIdx = fileUrl.indexOf(",");
                String header = fileUrl.substring(5, commaIdx);
                String base64Data = fileUrl.substring(commaIdx + 1);
                byte[] data = Base64.getDecoder().decode(base64Data);
                String contentType = header.split(";")[0];
                String filename = material.getFileName() != null ? material.getFileName() : "document.pdf";
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                        .contentType(MediaType.parseMediaType(contentType))
                        .body(data);
            } catch (Exception e) {
                log.error("Error decoding data url for material {}", id, e);
            }
        }
        return ResponseEntity.notFound().build();
    }

    private String determineContentType(String filename) {
        if (filename == null) return "application/octet-stream";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".doc")) return "application/msword";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
        if (lower.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        if (lower.endsWith(".zip")) return "application/zip";
        if (lower.endsWith(".txt")) return "text/plain";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_TEACHER')")
    public ResponseEntity<?> deleteMaterial(@PathVariable Long id) {
        try {
            studyMaterialRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Material deleted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to delete material: " + e.getMessage()));
        }
    }

    private String formatBytes(long bytes) {
        if (bytes <= 0) return "0 B";
        final String[] units = new String[] { "B", "KB", "MB", "GB" };
        int digitGroups = (int) (Math.log10(bytes) / Math.log10(1024));
        return String.format("%.1f %s", bytes / Math.pow(1024, digitGroups), units[digitGroups]);
    }
}
