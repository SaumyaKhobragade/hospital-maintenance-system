"""
test_sarvam.py
Automated integration test suite for testing real Sarvam AI Speech-to-Text
and Scribe workflow, using actual generated audio.
"""

import json
import sys
import uuid
import urllib.request
import urllib.parse
import os

# Reconfigure stdout to use utf-8 to avoid console encoding issues on Windows
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

BASE_URL = "http://127.0.0.1:8003"
AUDIO_FILE = "./doctor_patient.wav"

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

def run_sarvam_tests():
    # Verify the audio file exists
    if not os.path.isfile(AUDIO_FILE):
        print(f"[ERROR] Real audio file not found at: {AUDIO_FILE}")
        print("Please run 'python tts-gen.py' first to generate the wav file.")
        sys.exit(1)

    patient_id = f"sarvam-pat-{uuid.uuid4().hex[:6]}"
    print(f"Starting Sarvam Scribe tests. Patient ID: {patient_id}")
    
    # ----------------------------------------------------
    # TEST 1: Health Check (Ensure Sarvam is Configured)
    # ----------------------------------------------------
    print_section("Test 1: Health Check (Sarvam Config Verification)")
    status, res = send_request(f"{BASE_URL}/health")
    print(f"Status Code: {status}")
    print(f"Response:\n{json.dumps(res, indent=2)}")
    
    if status != 200:
        print("[FAIL] Health check failed.")
        sys.exit(1)
        
    if not res.get("sarvam_configured"):
        print("[FAIL] Sarvam AI is not configured on the backend. Please check the backend .env file.")
        sys.exit(1)
        
    print("[PASS] Health check and Sarvam configuration validated.")

    # ----------------------------------------------------
    # TEST 2: Start Scribe (Transcribing Real Audio)
    # ----------------------------------------------------
    print_section("Test 2: Start Scribe (Sending Real Audio to Sarvam STT)")
    
    # Pass the path of the actual WAV file
    # We resolve the absolute path of the audio file since the backend server needs to find it
    abs_audio_path = os.path.abspath(AUDIO_FILE)
    print(f"Passing absolute path to backend: {abs_audio_path}")

    scribe_body = {
        "patient_id": patient_id,
        "patient_email": "real-scribe-test@example.com",
        "audio_file_path": abs_audio_path
    }
    data = json.dumps(scribe_body).encode("utf-8")
    
    print("Sending transcription request... (This may take a few seconds)")
    status, res = send_request(f"{BASE_URL}/scribe/start", method="POST", data=data)
    print(f"Status Code: {status}")
    print(f"Response:\n{json.dumps(res, indent=2)}")
    
    if status != 200:
        print(f"[FAIL] Scribe start failed. Response:\n{json.dumps(res, indent=2)}")
        sys.exit(1)
        
    raw_transcript = res.get("raw_transcript", "")
    print(f"Transcript Snippet:\n{raw_transcript[:300]}...\n")
    
    # VERIFY that we did not hit the mock fallback
    if "[MOCK TRANSCRIPT]" in raw_transcript or not raw_transcript:
        print("[FAIL] The backend fell back to the mock transcript. Real transcription did not occur.")
        sys.exit(1)
        
    print("[PASS] Scribe start and real transcription completed successfully!")
    print(f"Structured SOAP Note:\n{res.get('structured_soap_note')}\n")
    print(f"Patient Report Draft:\n{res.get('patient_report_draft')}\n")
    
    thread_id = res.get("thread_id")
    print(f"Thread ID: {thread_id}")

    # ----------------------------------------------------
    # TEST 3: Scribe Status
    # ----------------------------------------------------
    print_section("Test 3: Get Status of Scribe Thread")
    status, res = send_request(f"{BASE_URL}/scribe/status?thread_id={thread_id}")
    print(f"Status Code: {status}")
    if status != 200:
        print("[FAIL] Scribe get status failed.")
        sys.exit(1)
        
    if res.get("status") != "PENDING_APPROVAL":
        print(f"[FAIL] Unexpected thread status: {res.get('status')}")
        sys.exit(1)
        
    print("[PASS] Scribe thread status verified (PENDING_APPROVAL).")

    # ----------------------------------------------------
    # TEST 4: Approve & Dispatch Workflow
    # ----------------------------------------------------
    print_section("Test 4: Approve & Resume Scribe Workflow")
    approve_body = {"thread_id": thread_id}
    data = json.dumps(approve_body).encode("utf-8")
    status, res = send_request(f"{BASE_URL}/scribe/approve", method="POST", data=data)
    print(f"Status Code: {status}")
    print(f"Response:\n{json.dumps(res, indent=2)}")
    
    if status != 200:
        print("[FAIL] Scribe approve failed.")
        sys.exit(1)
        
    if res.get("status") != "DISPATCHED":
        print(f"[FAIL] Thread not dispatched. Current status: {res.get('status')}")
        sys.exit(1)
        
    print("[PASS] Scribe workflow successfully approved and dispatched.")

    print("\n" + "=" * 60)
    print(" ALL REAL SARVAM AI TRANSCRIPTION TESTS PASSED SUCCESSFULLY! ")
    print("=" * 60)

if __name__ == "__main__":
    try:
        run_sarvam_tests()
    except Exception as e:
        print(f"\n[ERROR] Connection failed: {e}")
        print("Please make sure the FastAPI server is running on http://127.0.0.1:8003 before running this test.")
        sys.exit(1)
