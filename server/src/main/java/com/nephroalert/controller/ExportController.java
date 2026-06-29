package com.nephroalert.controller;

import com.nephroalert.entity.Doctor;
import com.nephroalert.entity.Patient;
import com.nephroalert.entity.Visit;
import com.nephroalert.repository.PatientRepository;
import com.nephroalert.repository.VisitRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    private final PatientRepository patientRepository;
    private final VisitRepository visitRepository;

    public ExportController(PatientRepository patientRepository, VisitRepository visitRepository) {
        this.patientRepository = patientRepository;
        this.visitRepository = visitRepository;
    }

    // GET /api/export/csv
    @GetMapping("/csv")
    public void exportCsv(Authentication auth, HttpServletResponse response) throws IOException {
        Long doctorId = ((Doctor) auth.getPrincipal()).getId();
        List<Patient> patients = patientRepository.findByDoctorIdOrderByLastVisitDateDesc(doctorId);

        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=\"nephroalert_research_data.csv\"");

        PrintWriter writer = response.getWriter();

        // Header
        writer.println("patient_id,age,gender,diabetes_duration_years,smoking,bp_history,visit_date,hba1c,creatinine,blood_urea,eGFR,systolic_bp,diastolic_bp,urine_acr,ckd_stage,risk_score,risk_level");

        int counter = 1;
        for (Patient patient : patients) {
            String patientId = String.format("Patient_%03d", counter++);
            List<Visit> visits = visitRepository.findByPatientIdOrderByVisitDateAsc(patient.getId());

            for (Visit visit : visits) {
                writer.printf("%s,%d,%s,%d,%s,%s,%s,%.1f,%.2f,%.1f,%d,%d,%d,%.1f,%s,%s,%s%n",
                        patientId,
                        patient.getAge(),
                        patient.getGender().name(),
                        patient.getDiabetesDuration(),
                        Boolean.TRUE.equals(patient.getSmokingStatus()) ? "Yes" : "No",
                        Boolean.TRUE.equals(patient.getBpHistory()) ? "Yes" : "No",
                        visit.getVisitDate().toString(),
                        visit.getHba1c(),
                        visit.getCreatinine(),
                        visit.getBloodUrea(),
                        visit.getEGFR(),
                        visit.getSystolicBP(),
                        visit.getDiastolicBP(),
                        visit.getUrineACR(),
                        visit.getCkdStageAtVisit() != null ? visit.getCkdStageAtVisit().toString() : "",
                        visit.getRiskScoreAtVisit() != null ? visit.getRiskScoreAtVisit().toString() : "",
                        visit.getRiskLevelAtVisit() != null ? visit.getRiskLevelAtVisit() : ""
                );
            }
        }

        writer.flush();
    }
}
