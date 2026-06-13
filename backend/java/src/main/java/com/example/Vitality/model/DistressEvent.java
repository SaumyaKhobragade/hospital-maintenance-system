package com.example.HMS.model;

/**
 * Represents a distress event reported for a patient.
 */
public class DistressEvent {
    private String patientId;
    private String type; // e.g., "COLLAPSE", "VOMITING", "IMMOBILITY"
    private double confidence; // 0.0 to 1.0
    private long timestamp;

    public DistressEvent() {}

    public DistressEvent(String patientId, String type, double confidence, long timestamp) {
        this.patientId = patientId;
        this.type = type;
        this.confidence = confidence;
        this.timestamp = timestamp;
    }

    public String getPatientId()   { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getType()        { return type; }
    public void setType(String type) { this.type = type; }
    public double getConfidence()  { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }
    public long getTimestamp()     { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
