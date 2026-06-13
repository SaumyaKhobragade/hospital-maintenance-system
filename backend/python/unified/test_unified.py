"""
test_unified.py
Automated integration test suite for the HMS Unified AI Backend.
Tests both RAG (history, summary, risks) and Sarvam (scribe, report) endpoints.
"""

import json
import sys
import uuid
import urllib.request
import urllib.parse
import shutil

# Reconfigure stdout to use utf-8 to avoid console encoding issues on Windows
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

BASE_URL = "http://127.0.0.1:8003"

def print_section(title: str):
    print("\n" + "=" * 60)
    print(f" {title}")
    print("=" * 60)

def send_request(url: str, method: str = "GET", data: bytes = None, headers: dict = None) -> tuple[int, dict]:
    headers = headers or {}
    if data and "Content-Type" not in headers:
        headers["Content-Type"] = "application/json"
        
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = response.read().decode("utf-8")
            try:
                res_json = json.loads(body)
            except json.JSONDecodeError:
                res_json = {"raw_response": body}
            return status, res_json
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            res_json = json.loads(body)
        except json.JSONDecodeError:
            res_json = {"error": body}
        return e.code, res_json

def build_multipart_form_data(fields: dict, files: dict) -> tuple[bytes, dict]:
    boundary = f"Boundary-{uuid.uuid4().hex}"
    body = []
    
    # Add fields
    for key, value in fields.items():
        if value is None:
            continue
        body.append(f"--{boundary}".encode("utf-8"))
        body.append(f'Content-Disposition: form-data; name="{key}"'.encode("utf-8"))
        body.append(b"")
        body.append(str(value).encode("utf-8"))
        
    # Add files
    for key, (filename, content, mimetype) in files.items():
        body.append(f"--{boundary}".encode("utf-8"))
        body.append(f'Content-Disposition: form-data; name="{key}"; filename="{filename}"'.encode("utf-8"))
        body.append(f"Content-Type: {mimetype}".encode("utf-8"))
        body.append(b"")
        body.append(content)
        
    body.append(f"--{boundary}--".encode("utf-8"))
    body.append(b"")
    
    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}"
    }
    
    return b"\r\n".join(body), headers

def run_tests():
    patient_id = f"test-pat-{uuid.uuid4().hex[:6]}"
    print(f"Using random Patient ID for test: {patient_id}")
    
    # ----------------------------------------------------
    # TEST 1: Health Check
    # ----------------------------------------------------
    print_section("Test 1: Health Check")
    status, res = send_request(f"{BASE_URL}/health")
    print(f"Status Code: {status}")
    print(f"Response:\n{json.dumps(res, indent=2)}")
    if status != 200:
        print("[FAIL] Health check failed.")
        sys.exit(1)
    print("[PASS] Health check successful.")

    # ----------------------------------------------------
    # TEST 2: Ingest Plain Text Medical History
    # ----------------------------------------------------
    print_section("Test 2: Ingesting Plain Text History")
    
    medical_text = (
        "Patient has moderate Asthma diagnosed in 2018, managed with a Salbutamol inhaler as needed. "
        "Also diagnosed with Hypertension in 2022, taking Lisinopril 10mg daily. "
        "Known allergy: Penicillin (causes severe hives and breathing difficulty). "
        "Had a laparoscopic appendectomy in 2020 with no complications."
    )
    
    fields = {"text": medical_text}
    data = urllib.parse.urlencode(fields).encode("utf-8")
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    
    status, res = send_request(
        f"{BASE_URL}/api/patients/{patient_id}/history", 
        method="POST", 
        data=data, 
        headers=headers
    )
    print(f"Status Code: {status}")
    print(f"Response:\n{json.dumps(res, indent=2)}")
    if status != 200:
        print("[FAIL] Failed to ingest history.")
        sys.exit(1)
    print("[PASS] Ingest history successful.")

    # ----------------------------------------------------
    # TEST 3: Retrieve and Compile Patient Summary
    # ----------------------------------------------------
    print_section("Test 3: Compiling Summary")
    status, res = send_request(f"{BASE_URL}/api/patients/{patient_id}/summary")
    print(f"Status Code: {status}")
    print(f"Response:\n{json.dumps(res, indent=2)}")
    
    if status != 200:
        print("[FAIL] Failed to retrieve patient summary.")
        sys.exit(1)
    print("[PASS] Summary retrieval successful.")

    # ----------------------------------------------------
    # TEST 4: Get Patient Prescription Risks
    # ----------------------------------------------------
    print_section("Test 4: Risk Assessment")
    status, res = send_request(f"{BASE_URL}/api/patients/{patient_id}/risks")
    print(f"Status Code: {status}")
    print(f"Response:\n{json.dumps(res, indent=2)}")
    
    if status != 200:
        print("[FAIL] Failed to perform risk assessment.")
        sys.exit(1)
    print("[PASS] Risk assessment retrieval successful.")

    # ----------------------------------------------------
    # TEST 5: Scribe Workflow - Start Scribe
    # ----------------------------------------------------
    print_section("Test 5: Scribe Workflow - Start")
    
    # Let's create a temporary audio file by copying the real doctor_patient.wav
    temp_audio_path = "../temp_test_audio.wav"
    shutil.copyfile("./doctor_patient.wav", temp_audio_path)

    scribe_body = {
        "patient_id": patient_id,
        "patient_email": "test-patient@example.com",
        "audio_file_path": temp_audio_path
    }
    data = json.dumps(scribe_body).encode("utf-8")
    status, res = send_request(f"{BASE_URL}/scribe/start", method="POST", data=data)
    print(f"Status Code: {status}")
    print(f"Response:\n{json.dumps(res, indent=2)}")
    
    if status != 200:
        print("[FAIL] Scribe start failed.")
        sys.exit(1)
        
    thread_id = res.get("thread_id")
    print(f"[PASS] Scribe start successful. Thread ID: {thread_id}")

    # ----------------------------------------------------
    # TEST 6: Scribe Workflow - Get Status
    # ----------------------------------------------------
    print_section("Test 6: Scribe Workflow - Get Status")
    status, res = send_request(f"{BASE_URL}/scribe/status?thread_id={thread_id}")
    print(f"Status Code: {status}")
    print(f"Response:\n{json.dumps(res, indent=2)}")
    if status != 200:
        print("[FAIL] Scribe get status failed.")
        sys.exit(1)
    print("[PASS] Scribe get status successful.")

    # ----------------------------------------------------
    # TEST 7: Scribe Workflow - Approve Scribe
    # ----------------------------------------------------
    print_section("Test 7: Scribe Workflow - Approve")
    approve_body = {"thread_id": thread_id}
    data = json.dumps(approve_body).encode("utf-8")
    status, res = send_request(f"{BASE_URL}/scribe/approve", method="POST", data=data)
    print(f"Status Code: {status}")
    print(f"Response:\n{json.dumps(res, indent=2)}")
    if status != 200:
        print("[FAIL] Scribe approve failed.")
        sys.exit(1)
    print("[PASS] Scribe approve successful.")

    # ----------------------------------------------------
    # TEST 8: Report Generation Workflow
    # ----------------------------------------------------
    print_section("Test 8: Automated Report Generation")
    report_body = {
        "patient_id": patient_id,
        "patient_email": "patient-report@example.com",
        "patient_metrics": {
            "Blood Pressure": "145/95 mmHg",
            "Heart Rate": "102 bpm",
            "SpO2": "93%",
            "Temperature": "38.5 C"
        },
        "additional_context": "Patient reports shortness of breath and fever for the past 2 days."
    }
    data = json.dumps(report_body).encode("utf-8")
    status, res = send_request(f"{BASE_URL}/report/generate", method="POST", data=data)
    print(f"Status Code: {status}")
    print(f"Response:\n{json.dumps(res, indent=2)}")
    if status != 200:
        print("[FAIL] Automated report generation failed.")
        sys.exit(1)
    print("[PASS] Automated report generation successful.")

    # Clean up temp audio file
    import os
    try:
        os.remove(temp_audio_path)
    except Exception:
        pass

    print("\n" + "=" * 60)
    print(" ALL HMS UNIFIED AI BACKEND TESTS PASSED SUCCESSFULLY! ")
    print("=" * 60)

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n[ERROR] Connection failed: {e}")
        print("Please make sure the FastAPI server is running on http://127.0.0.1:8003 before executing this test script.")
        sys.exit(1)
