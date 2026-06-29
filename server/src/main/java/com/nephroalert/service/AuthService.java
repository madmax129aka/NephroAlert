package com.nephroalert.service;

import com.nephroalert.dto.AuthRequest;
import com.nephroalert.dto.AuthResponse;
import com.nephroalert.entity.Doctor;
import com.nephroalert.repository.DoctorRepository;
import com.nephroalert.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(DoctorRepository doctorRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.doctorRepository = doctorRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(AuthRequest.RegisterRequest request) {
        if (doctorRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new RuntimeException("Email already registered");
        }

        Doctor.Designation designation;
        try {
            designation = Doctor.Designation.valueOf(request.getDesignation().replace(" ", "_"));
        } catch (IllegalArgumentException e) {
            designation = Doctor.Designation.Doctor;
        }

        Doctor doctor = Doctor.builder()
                .fullName(request.getFullName())
                .designation(designation)
                .phcName(request.getPhcName())
                .district(request.getDistrict())
                .state(request.getState() != null ? request.getState() : "Tamil Nadu")
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .medicalRegNumber(request.getMedicalRegNumber() != null ? request.getMedicalRegNumber() : "")
                .build();

        doctor = doctorRepository.save(doctor);

        String token = jwtUtil.generateToken(doctor.getId());

        return AuthResponse.builder()
                .token(token)
                .doctor(mapToDoctorInfo(doctor))
                .build();
    }

    public AuthResponse login(AuthRequest.LoginRequest request) {
        Doctor doctor = doctorRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), doctor.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(doctor.getId());

        return AuthResponse.builder()
                .token(token)
                .doctor(mapToDoctorInfo(doctor))
                .build();
    }

    public AuthResponse.DoctorInfo getDoctorInfo(Doctor doctor) {
        return mapToDoctorInfo(doctor);
    }

    private AuthResponse.DoctorInfo mapToDoctorInfo(Doctor doctor) {
        return AuthResponse.DoctorInfo.builder()
                .id(doctor.getId())
                .fullName(doctor.getFullName())
                .email(doctor.getEmail())
                .designation(doctor.getDesignation().getDisplayName())
                .phcName(doctor.getPhcName())
                .district(doctor.getDistrict())
                .build();
    }
}
