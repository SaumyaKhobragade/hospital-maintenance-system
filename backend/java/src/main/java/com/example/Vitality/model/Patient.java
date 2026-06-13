package com.example.HMS.model;

import com.example.HMS.service.TriagePolicyService;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Patient model — Lombok removed for JDK 26 compatibility.
 * Priority calculated dynamically based on severity, wait time, and distress.
 */
public class Patient implements Comparable<Patient> {

    private String id = UUID.randomUUID().toString();
    private int baseSeverity; // 1-10
    private long arrivalTime;
    private String targetHospitalId;
    private AtomicInteger distressScore = new AtomicInteger(0);
    private AtomicReference<DistressStatus> distressStatus = new AtomicReference<>(DistressStatus.NONE);
    private long distressEventTimestamp = 0;
    private boolean treating = false;

    // Global Policy Service Reference (injected by HospitalService)
    public static TriagePolicyService policyService;

    // ─── Explicit Builder ────────────────────────────────────────────────────

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private int baseSeverity;
        private long arrivalTime = System.currentTimeMillis();
        private String targetHospitalId = "";

        public Builder baseSeverity(int s)          { this.baseSeverity = s; return this; }
        public Builder arrivalTime(long t)          { this.arrivalTime = t; return this; }
        public Builder targetHospitalId(String hId) { this.targetHospitalId = hId; return this; }

        public Patient build() {
            Patient p = new Patient();
            p.baseSeverity = baseSeverity;
            p.arrivalTime = arrivalTime;
            p.targetHospitalId = targetHospitalId;
            return p;
        }
    }

    // ─── Getters / Setters ───────────────────────────────────────────────────

    public String getId()                              { return id; }
    public int getBaseSeverity()                       { return baseSeverity; }
    public int getSeverity()                           { return baseSeverity; }
    public long getArrivalTime()                       { return arrivalTime; }
    public String getTargetHospitalId()               { return targetHospitalId; }
    public void setTargetHospitalId(String id)        { this.targetHospitalId = id; }
    public AtomicInteger getDistressScore()            { return distressScore; }
    public AtomicReference<DistressStatus> getDistressStatus() { return distressStatus; }
    public long getDistressEventTimestamp()            { return distressEventTimestamp; }
    public boolean isTreating()                        { return treating; }
    public void setTreating(boolean t)                { this.treating = t; }

    // ─── Business Logic ──────────────────────────────────────────────────────

    public double getDynamicPriority() {
        if (treating) return 999.0;

        long waitTimeMs = Math.max(0, System.currentTimeMillis() - arrivalTime);
        double waitTimeMinutes = waitTimeMs / 60000.0;

        double agingFactor  = (policyService != null) ? policyService.getAgingFactor() : 0.5;
        double severityWeight = (policyService != null) ? policyService.getSeverityWeight() : 1.0;
        boolean agingEnabled = (policyService != null) ? policyService.isAgingEnabled() : true;
        double distressDecayRate = (policyService != null) ? policyService.getDistressDecay() : 0.5;
        int provisionalBoost = (policyService != null) ? policyService.getDistressProvisionalBoost() : 50;
        int confirmedBoost   = (policyService != null) ? policyService.getDistressConfirmedBoost() : 100;
        long timeoutMs       = (policyService != null) ? policyService.getDistressProvisionalTimeoutMs() : 120000;

        double waitTimeComponent = agingEnabled ? (waitTimeMinutes * agingFactor) : 0.0;
        double distressComponent = distressScore.get();

        DistressStatus status = distressStatus.get();
        if (status == DistressStatus.PENDING) {
            long elapsed = System.currentTimeMillis() - distressEventTimestamp;
            if (elapsed > timeoutMs) {
                distressStatus.compareAndSet(DistressStatus.PENDING, DistressStatus.EXPIRED);
            } else {
                double decayFactor = Math.exp(-distressDecayRate * elapsed / 60000.0);
                distressComponent += provisionalBoost * decayFactor;
            }
        } else if (status == DistressStatus.CONFIRMED) {
            long elapsed = System.currentTimeMillis() - distressEventTimestamp;
            double decayFactor = Math.exp(-distressDecayRate * elapsed / 60000.0);
            distressComponent += confirmedBoost * decayFactor;
        }

        return (baseSeverity * severityWeight) + waitTimeComponent + distressComponent;
    }

    @Override
    public int compareTo(Patient other) {
        return Double.compare(other.getDynamicPriority(), this.getDynamicPriority());
    }

    public int getTreatmentTime() {
        if (baseSeverity < 4) return 5000;
        if (baseSeverity > 7) return 20000;
        return 10000;
    }

    public void updateDistress(DistressStatus newStatus) {
        this.distressStatus.set(newStatus);
        if (newStatus == DistressStatus.PENDING) {
            this.distressEventTimestamp = System.currentTimeMillis();
        }
    }
}