package com.kucp1127.clarityvault.FileUpload.Controller;

import com.kucp1127.clarityvault.FileUpload.Model.FileModel;
import com.kucp1127.clarityvault.FileUpload.Service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileUploadController {

    @Autowired
    private FileService fileService;

    // Allowed file types for documents and PDFs
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    @PostMapping("/save")
    public ResponseEntity<?> saveFile(@RequestParam("username") String username,
                                     @RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            String validationError = validateFile(file);
            if (validationError != null) {
                return ResponseEntity.badRequest().body(Map.of("error", validationError));
            }

            // Save file using service
            FileModel savedFile = fileService.saveFile(username, file);

            return ResponseEntity.ok(Map.of(
                "message", "File saved successfully",
                "fileId", savedFile.getId(),
                "fileName", savedFile.getFileName(),
                "fileType", savedFile.getFileType(),
                "username", savedFile.getUsername()
            ));

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to save file: " + e.getMessage()));
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteFile(@PathVariable Long id) {
        try {
            Optional<FileModel> file = fileService.findFileById(id);
            if (file.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            fileService.deleteFile(id);
            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete file: " + e.getMessage()));
        }
    }

    @GetMapping("/find/{id}")
    public ResponseEntity<?> findFileById(@PathVariable Long id) {
        try {
            Optional<FileModel> file = fileService.findFileById(id);

            if (file.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            FileModel fileModel = file.get();
            return ResponseEntity.ok(Map.of(
                "id", fileModel.getId(),
                "username", fileModel.getUsername(),
                "fileName", fileModel.getFileName(),
                "fileType", fileModel.getFileType(),
                "fileSize", fileModel.getData().length
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to find file: " + e.getMessage()));
        }
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<?> downloadFile(@PathVariable Long id) {
        try {
            Optional<FileModel> file = fileService.findFileById(id);

            if (file.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            FileModel fileModel = file.get();
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(fileModel.getFileType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                           "attachment; filename=\"" + fileModel.getFileName() + "\"")
                    .body(fileModel.getData());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to download file: " + e.getMessage()));
        }
    }

    @GetMapping("/findByUsername/{username}")
    public ResponseEntity<?> findAllFilesByUsername(@PathVariable String username) {
        try {
            List<FileModel> files = fileService.findAllFilesByUsername(username);

            return ResponseEntity.ok(Map.of(
                "files", files.stream().map(file -> Map.of(
                    "id", file.getId(),
                    "fileName", file.getFileName(),
                    "fileType", file.getFileType(),
                    "fileSize", file.getData().length
                )).toList(),
                "totalFiles", files.size(),
                "username", username
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to find files: " + e.getMessage()));
        }
    }

    private String validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            return "File is empty";
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return "File size exceeds maximum limit of " + (MAX_FILE_SIZE / 1024 / 1024) + "MB";
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            return "File type not supported. Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT";
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            return "Invalid filename";
        }

        return null; // No validation errors
    }
}
