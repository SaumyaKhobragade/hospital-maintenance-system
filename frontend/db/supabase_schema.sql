-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Enums based on Frontend + Backend requirements
CREATE TYPE department_enum AS ENUM ('NURSE', 'GENERAL', 'ICU', 'Cardiology', 'Pulmonology', 'Nephrology', 'Pediatrics');
CREATE TYPE distress_status_enum AS ENUM ('NONE', 'PENDING', 'CONFIRMED', 'DISMISSED', 'EXPIRED');
CREATE TYPE triage_priority_enum AS ENUM ('Critical', 'High', 'Medium', 'Stable');
CREATE TYPE patient_status_enum AS ENUM ('Waiting', 'Intake Completed', 'Under Review', 'Discharged');

-- ==========================================
-- 1. Hospitals Table
-- ==========================================
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    max_capacity INTEGER NOT NULL DEFAULT 0,
    x INTEGER NOT NULL DEFAULT 0,
    y INTEGER NOT NULL DEFAULT 0,
    baseline_staff_count JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. Patients Table
-- ==========================================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Frontend specific UI fields
    name TEXT,
    age INTEGER,
    gender TEXT,
    blood_group TEXT,
    department department_enum,
    triage_priority triage_priority_enum,
    ai_risk_score INTEGER DEFAULT 0,
    status patient_status_enum,
    queue_pos TEXT,
    assigned_doc TEXT,
    avatar TEXT,
    symptoms JSONB DEFAULT '[]'::jsonb,
    allergies JSONB DEFAULT '[]'::jsonb,
    conditions JSONB DEFAULT '[]'::jsonb,
    ai_summary TEXT,
    alerts JSONB DEFAULT '[]'::jsonb,
    timeline JSONB DEFAULT '[]'::jsonb,
    
    -- Backend specific Logic fields
    base_severity INTEGER,
    arrival_time BIGINT,
    target_hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    distress_score INTEGER DEFAULT 0,
    distress_status distress_status_enum DEFAULT 'NONE',
    distress_event_timestamp BIGINT,
    treating BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. Distress Events Table
-- ==========================================
CREATE TABLE distress_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    confidence FLOAT8,
    event_timestamp BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. RAG Templates Table
-- ==========================================
CREATE TABLE rag_templates (
    id TEXT PRIMARY KEY,
    name TEXT,
    file_name TEXT,
    ocr_text TEXT,
    extracted_fields JSONB,
    embedding_metrics JSONB,
    ai_summary JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. RAG Similarity Records Table
-- ==========================================
CREATE TABLE rag_similarity_records (
    id TEXT PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    match_type TEXT,
    score INTEGER,
    source TEXT,
    confidence INTEGER,
    record_timestamp TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. Telemetry Events Table
-- ==========================================
CREATE TABLE telemetry_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT,
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Triggers for updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_patients
BEFORE UPDATE ON patients
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_hospitals
BEFORE UPDATE ON hospitals
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
