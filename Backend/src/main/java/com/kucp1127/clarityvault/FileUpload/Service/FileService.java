package com.kucp1127.clarityvault.FileUpload.Service;

import com.kucp1127.clarityvault.FileUpload.Model.FileModel;
import com.kucp1127.clarityvault.FileUpload.Repository.FileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class FileService {

    @Autowired
    private FileRepository fileRepository;

    public FileModel saveFile(String username, MultipartFile file) throws IOException {
        FileModel fileModel = new FileModel();
        fileModel.setUsername(username);
        fileModel.setFileName(file.getOriginalFilename());
        fileModel.setFileType(file.getContentType());
        fileModel.setData(file.getBytes());

        return fileRepository.save(fileModel);
    }

    public void deleteFile(Long id) {
        fileRepository.deleteById(id);
    }

    public Optional<FileModel> findFileById(Long id) {
        return fileRepository.findById(id);
    }

    public List<FileModel> findAllFilesByUsername(String username) {
        return fileRepository.findByUsername(username);
    }
}
