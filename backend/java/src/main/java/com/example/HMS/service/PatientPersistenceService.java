package com.example.HMS.service;

import com.example.HMS.model.Patient;
import okhttp3.*;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.concurrent.CompletableFuture;

/**
 * Service for persisting simulated patients directly to Supabase via REST API,
 * bypassing complex JPA bindings for high-throughput chaos generation.
 */
@Service
public class PatientPersistenceService {

    private final OkHttpClient httpClient;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.anon.key}")
    private String supabaseAnonKey;

    public PatientPersistenceService() {
        this.httpClient = new OkHttpClient();
    }

    /**
     * Asynchronously saves a newly created patient to the database.
     *
     * @param patient The patient to save.
     */
    public void savePatientAsync(Patient patient) {
        CompletableFuture.runAsync(() -> {
            try {
                String endpoint = supabaseUrl + "/rest/v1/patients";
                System.out.println(">>> DEBUG: Saving patient to endpoint: " + endpoint + " using key: " + supabaseAnonKey.substring(0, 10) + "...");

                JSONObject payload = new JSONObject();
                payload.put("id", patient.getId());
                payload.put("base_severity", patient.getBaseSeverity());
                payload.put("arrival_time", patient.getArrivalTime());
                
                String targetHospId = patient.getTargetHospitalId();
                boolean isUuid = false;
                if (targetHospId != null) {
                    try {
                        java.util.UUID.fromString(targetHospId);
                        isUuid = true;
                    } catch (IllegalArgumentException e) {
                        // Not a UUID, fallback to null
                    }
                }
                payload.put("target_hospital_id", isUuid ? targetHospId : JSONObject.NULL);
                
                payload.put("distress_score", patient.getDistressScore().get());
                payload.put("distress_status", patient.getDistressStatus().get().name());
                payload.put("treating", patient.isTreating());

                // Generate dummy UI fields to keep frontend happy
                payload.put("name", "SimPatient " + patient.getId().substring(0, 5));
                payload.put("age", (int) (20 + (Math.random() * 60))); // Random age 20-80
                payload.put("status", "Waiting");

                RequestBody body = RequestBody.create(
                        payload.toString(),
                        MediaType.parse("application/json"));

                Request request = new Request.Builder()
                        .url(endpoint)
                        .header("apikey", supabaseAnonKey)
                        .header("Authorization", "Bearer " + supabaseAnonKey)
                        .header("Content-Type", "application/json")
                        .header("Prefer", "return=minimal") // Don't return full row
                        .post(body)
                        .build();

                Response response = httpClient.newCall(request).execute();
                System.out.println(">>> DEBUG: Response code: " + response.code() + ", body: " + (response.body() != null ? response.peekBody(1024).string() : "null"));

                if (response.isSuccessful()) {
                    System.out.println("✅ Patient " + patient.getId() + " saved to database via REST.");
                } else {
                    System.err.println("❌ Failed to save patient via REST: HTTP " + response.code());
                    if (response.body() != null) {
                        System.err.println("   Error: " + response.body().string());
                    }
                }
            } catch (IOException e) {
                System.err.println("❌ Error saving patient via REST: " + e.getMessage());
            }
        });
    }
}
