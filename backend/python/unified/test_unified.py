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

def build_multipart_form_data(fields, files):
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
    files_list = files.items() if isinstance(files, dict) else files
    for key, (filename, content, mimetype) in files_list:
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

    # ----------------------------------------------------
    # TEST 9: Combined Report Generation
    # ----------------------------------------------------
    print_section("Test 9: Combined Report Generation")
    
    pathology_content = (
        "PATHOLOGY REPORT\n"
        "Patient ID: {patient_id}\n"
        "CBC Findings:\n"
        "- WBC: 12,500 /uL (High)\n"
        "- RBC: 4.8 M/uL (Normal)\n"
        "- Platelets: 220,000 /uL (Normal)\n"
        "- Hb: 13.2 g/dL (Normal)\n"
        "Clinical impression: Mild leukocytosis, likely reactive."
    ).format(patient_id=patient_id)
    
    radiology_content = (
        "RADIOLOGY REPORT\n"
        "Patient ID: {patient_id}\n"
        "Chest X-Ray (AP View):\n"
        "Findings: Increased bronchovascular markings and patchy airspace opacities in the right lower lobe.\n"
        "No pleural effusion or pneumothorax.\n"
        "Clinical impression: Findings suggestive of right lower lobe pneumonia."
    ).format(patient_id=patient_id)

    fields = {
        "patient_email": "testmail-combined@example.com",
        "additional_context": "Correlate history of asthma and current symptoms of dyspnea and cough."
    }
    files_payload = [
        ("files", ("pathology_report.txt", pathology_content.encode("utf-8"), "text/plain")),
        ("files", ("radiology_report.txt", radiology_content.encode("utf-8"), "text/plain"))
    ]
    
    payload, headers = build_multipart_form_data(fields, files_payload)
    status, res = send_request(
        f"{BASE_URL}/api/patients/{patient_id}/combined-report", 
        method="POST", 
        data=payload, 
        headers=headers
    )
    print(f"Status Code: {status}")
    print(f"Response:\n{json.dumps(res, indent=2)}")
    if status != 200:
        print("[FAIL] Combined report generation failed.")
        sys.exit(1)
    print("[PASS] Combined report generation successful.")

    # ----------------------------------------------------
    # TEST 10: Image Analysis - Analyze Local
    # ----------------------------------------------------
    print_section("Test 10: Image Analysis - Analyze Local")
    image_path = "../imageVideoBackend/SampleImage/test1.jpg"
    
    # We pass image_path in query parameter: ?image_path=...
    # Wait, our route handler: async def analyze_local_injury_image(image_path: str):
    # This means FastAPI expects image_path as a query param!
    encoded_path = urllib.parse.quote(image_path)
    status, res = send_request(
        f"{BASE_URL}/api/image/analyze-local?image_path={encoded_path}", 
        method="POST"
    )
    print(f"Status Code: {status}")
    print(f"Response:\n{json.dumps(res, indent=2)}")
    if status != 200:
        print("[FAIL] Local image analysis failed.")
        sys.exit(1)
    print("[PASS] Local image analysis successful.")

    # ----------------------------------------------------
    # TEST 11: Image Analysis - Upload & Analyze
    # ----------------------------------------------------
    print_section("Test 11: Image Analysis - Upload & Analyze")
    try:
        with open("../imageVideoBackend/SampleImage/test1.jpg", "rb") as f:
            img_bytes = f.read()
    except FileNotFoundError:
        print("[FAIL] Sample image test1.jpg not found.")
        sys.exit(1)

    fields = {}
    files_payload = [
        ("image", ("test1.jpg", img_bytes, "image/jpeg"))
    ]
    payload, headers = build_multipart_form_data(fields, files_payload)
    status, res = send_request(
        f"{BASE_URL}/api/image/analyze", 
        method="POST", 
        data=payload, 
        headers=headers
    )
    print(f"Status Code: {status}")
    print(f"Response:\n{json.dumps(res, indent=2)}")
    if status != 200:
        print("[FAIL] Image upload analysis failed.")
        sys.exit(1)
    print("[PASS] Image upload analysis successful.")

    # ----------------------------------------------------
    # TEST 12: Image Analysis - Fetch & Clear Results
    # ----------------------------------------------------
    print_section("Test 12: Image Analysis - Get/Clear Results")
    status, res = send_request(f"{BASE_URL}/api/image/results?limit=5")
    print(f"GET results status: {status}, count: {len(res) if isinstance(res, list) else 0}")
    if status != 200 or not isinstance(res, list) or len(res) < 2:
        print("[FAIL] Get recent image results failed.")
        sys.exit(1)

    status, res = send_request(f"{BASE_URL}/api/image/results", method="DELETE")
    print(f"DELETE results status: {status}, response: {res}")
    if status != 200:
        print("[FAIL] Clear image results failed.")
        sys.exit(1)
    print("[PASS] Image results endpoints successful.")

    # ----------------------------------------------------
    # TEST 13: Video Analysis - Analyze Local
    # ----------------------------------------------------
    print_section("Test 13: Video Analysis - Analyze Local")
    video_path = "../imageVideoBackend/SampleVideo/clip_01_baseline.mp4"
    encoded_video_path = urllib.parse.quote(video_path)
    
    status, res = send_request(
        f"{BASE_URL}/api/video/analyze-local?video_path={encoded_video_path}", 
        method="POST"
    )
    print(f"Status Code: {status}")
    print(f"Response:\n{json.dumps(res, indent=2)}")
    if status != 200:
        print("[FAIL] Local video analysis failed.")
        sys.exit(1)
    print("[PASS] Local video analysis successful.")

    # ----------------------------------------------------
    # TEST 14: Video Analysis - Fetch & Clear Events
    # ----------------------------------------------------
    print_section("Test 14: Video Analysis - Get/Clear Events")
    status, res = send_request(f"{BASE_URL}/api/video/events")
    print(f"GET events status: {status}, count: {len(res) if isinstance(res, list) else 0}")
    if status != 200:
        print("[FAIL] Get video events failed.")
        sys.exit(1)

    status, res = send_request(f"{BASE_URL}/api/video/events", method="DELETE")
    print(f"DELETE events status: {status}, response: {res}")
    if status != 200:
        print("[FAIL] Clear video events failed.")
        sys.exit(1)
    print("[PASS] Video analysis endpoints successful.")

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
