package com.example.HMS.service;

import com.example.HMS.model.Hospital;
import com.example.HMS.model.Patient;
import okhttp3.*;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

/**
 * Service for persisting redirection decisions to Supabase.
 * Stores redirection decisions in the database for audit trails and real-time updates.
 */
@Service
public class RedirectionPersistenceService {

    private final OkHttpClient httpClient;
    private final HospitalService hospitalService;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anon.key}")
    private String supabaseAnonKey;

    @Autowired
    public RedirectionPersistenceService(HospitalService hospitalService) {
        this.httpClient = new OkHttpClient();
        this.hospitalService = hospitalService;
    }

    /**
     * Saves a redirection decision to the database.
     *
     * @param patient         The patient being redirected
     * @param sourceHospital  The source hospital
     * @param targetHospital  The target hospital
     * @param reason          The reason for redirection
     * @param decisionType    Type of decision (safe, conditional, standard)
     * @param confidenceScore Confidence score (0-100)
     * @param status          Status (completed, pending, failed)
     * @return true if saved successfully, false otherwise
     */
    public boolean saveRedirectionDecision(
            Patient patient,
            Hospital sourceHospital,
            Hospital targetHospital,
            String reason,
            String decisionType,
            int confidenceScore,
            String status) {

        try {
            String endpoint = supabaseUrl + "/rest/v1/clinical_decisions";

            String patientUuid = patient.getId();
            String sourceHospitalName = sourceHospital.getName();
            String targetHospitalName = targetHospital.getName();

            JSONObject payload = new JSONObject();
            payload.put("patient_id", patientUuid);
            payload.put("from_hospital", sourceHospitalName);
            payload.put("to_hospital", targetHospitalName);
            payload.put("type", decisionType);
            payload.put("reason", reason);
            payload.put("status", status);
            payload.put("confidence", confidenceScore);
            payload.put("policy_used", "Standard Triage Policy");

            RequestBody body = RequestBody.create(
                    payload.toString(),
                    MediaType.parse("application/json"));

            Request request = new Request.Builder()
                    .url(endpoint)
                    .header("apikey", supabaseAnonKey)
                    .header("Authorization", "Bearer " + supabaseAnonKey)
                    .header("Content-Type", "application/json")
                    .header("Prefer", "return=minimal")
                    .post(body)
                    .build();

            Response response = httpClient.newCall(request).execute();

            if (response.isSuccessful()) {
                System.out.println("✅ Redirection decision saved to database (clinical_decisions)");
                return true;
            } else {
                System.err.println("❌ Failed to save redirection: HTTP " + response.code());
                if (response.body() != null) {
                    System.err.println("   Error: " + response.body().string());
                }
                return false;
            }

        } catch (IOException e) {
            System.err.println("❌ Error saving redirection decision: " + e.getMessage());
            return false;
        }
    }

}
