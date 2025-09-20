package com.kucp1127.clarityvault.UserRegistration.Repository;

import com.kucp1127.clarityvault.UserRegistration.Model.UserRegistrationsModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserRegistrationsModel, String> {

    Optional<UserRegistrationsModel> findByEmail(String email);
}