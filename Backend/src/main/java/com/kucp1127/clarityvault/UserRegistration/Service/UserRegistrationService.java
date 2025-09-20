package com.kucp1127.clarityvault.UserRegistration.Service;

import com.kucp1127.clarityvault.UserRegistration.Model.UserRegistrationsModel;
import com.kucp1127.clarityvault.UserRegistration.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class UserRegistrationService {


    @Autowired
    private UserRepository userRepository;


    public Optional<UserRegistrationsModel> findRegistrationByUsername(String username) {
        return userRepository.findById(username);
    }

    public UserRegistrationsModel register(UserRegistrationsModel userRegistrationModel) {
        return userRepository.save(userRegistrationModel);
    }

    public UserRegistrationsModel updateRegistration(UserRegistrationsModel userRegistrationModel) {
        return userRepository.save(userRegistrationModel);
    }


    public Object getAllRegistrations() {
        return userRepository.findAll();
    }


    public String getName(String username){
        Optional<UserRegistrationsModel> userRegistrationsModel = userRepository.findById(username);
        return userRegistrationsModel.map(UserRegistrationsModel::getFullName).orElse(null);
    }
}
