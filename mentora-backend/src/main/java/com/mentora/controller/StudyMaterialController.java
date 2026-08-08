package com.mentora.controller;

import com.mentora.entity.StudyMaterial;
import com.mentora.repository.StudyMaterialRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/materials")
public class StudyMaterialController {

    private final StudyMaterialRepository studyMaterialRepository;

    public StudyMaterialController(StudyMaterialRepository studyMaterialRepository) {
        this.studyMaterialRepository = studyMaterialRepository;
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
    public ResponseEntity<StudyMaterial> uploadMaterial(@RequestBody StudyMaterial material) {
        return ResponseEntity.ok(studyMaterialRepository.save(material));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMaterial(@PathVariable Long id) {
        try {
            studyMaterialRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Material deleted successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to delete material: " + e.getMessage()));
        }
    }
}
