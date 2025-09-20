package com.kucp1127.clarityvault.FileUpload.Repository;


import com.kucp1127.clarityvault.FileUpload.Model.FileModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileRepository extends JpaRepository<FileModel,Long> {
    List<FileModel> findByUsername(String username);
}
