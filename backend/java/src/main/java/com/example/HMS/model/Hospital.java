package com.example.HMS.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.Map;
import java.util.Queue;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.PriorityBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Hospital model — Lombok removed for JDK 26 compatibility.
 * Uses explicit builder pattern, getters/setters.
 */
@Entity
@Table(name = "hospitals")
public class Hospital {
    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "name")
    private String name;

    @Column(name = "max_capacity")
    private int maxCapacity;

    @Column(name = "x")
    private int x;

    @Column(name = "y")
    private int y;

    @Transient
    @JsonIgnore
    private Map<Department, PriorityBlockingQueue<Patient>> waitingRooms = new ConcurrentHashMap<>();

    @Transient
    @JsonIgnore
    private Map<Department, ThreadPoolExecutor> departmentalStaff = new ConcurrentHashMap<>();

    @Transient
    @JsonIgnore
    private Map<Department, Deque<AtomicBoolean>> staffControl = new ConcurrentHashMap<>();

    @Transient
    private Map<Department, Integer> baselineStaffCount = new ConcurrentHashMap<>();

    @Transient
    private AtomicInteger activeTreatments = new AtomicInteger(0);

    // ─── Explicit Builder ─────────────────────────────────────────────────────

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String id;
        private String name;
        private int maxCapacity;
        private int x;
        private int y;

        public Builder id(String id)           { this.id = id; return this; }
        public Builder name(String name)       { this.name = name; return this; }
        public Builder maxCapacity(int cap)    { this.maxCapacity = cap; return this; }
        public Builder x(int x)               { this.x = x; return this; }
        public Builder y(int y)               { this.y = y; return this; }

        public Hospital build() {
            Hospital h = new Hospital();
            h.id = id; h.name = name; h.maxCapacity = maxCapacity; h.x = x; h.y = y;
            return h;
        }
    }

    // ─── Getters ──────────────────────────────────────────────────────────────

    public String getId()                      { return id; }
    public String getName()                    { return name; }
    public int getMaxCapacity()               { return maxCapacity; }
    public int getX()                         { return x; }
    public int getY()                         { return y; }
    public int getCapacity()                  { return maxCapacity; }

    public Map<Department, PriorityBlockingQueue<Patient>> getWaitingRooms()  { return waitingRooms; }
    public Map<Department, ThreadPoolExecutor> getDepartmentalStaff()          { return departmentalStaff; }
    public Map<Department, Deque<AtomicBoolean>> getStaffControl()            { return staffControl; }
    public Map<Department, Integer> getBaselineStaffCount()                    { return baselineStaffCount; }
    public AtomicInteger getActiveTreatments()                                 { return activeTreatments; }

    // ─── Computed JSON fields ─────────────────────────────────────────────────

    public Map<String, Integer> getStaffCounts() {
        Map<String, Integer> counts = new java.util.HashMap<>();
        if (departmentalStaff != null) {
            departmentalStaff.forEach((dept, executor) ->
                counts.put(dept.name(), executor.getCorePoolSize()));
        }
        return counts;
    }

    public Map<String, Integer> getActiveStaffCounts() {
        Map<String, Integer> counts = new java.util.HashMap<>();
        if (departmentalStaff != null) {
            departmentalStaff.forEach((dept, executor) ->
                counts.put(dept.name(), executor.getActiveCount()));
        }
        return counts;
    }

    public int getTotalQueueSize() {
        return waitingRooms.values().stream().mapToInt(Queue::size).sum();
    }

    public int getDepartmentQueueSize(Department dept) {
        return waitingRooms.containsKey(dept) ? waitingRooms.get(dept).size() : 0;
    }

    public int getActiveDoctorCount() { return activeTreatments.get(); }
}
