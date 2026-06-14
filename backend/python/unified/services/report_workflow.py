"""
services/report_workflow.py

Feature 2: Automated Patient Report & Mailing Service
"""

from __future__ import annotations
from typing import Optional
import logging
from typing import Any, Dict, TypedDict

from langchain_core.prompts import ChatPromptTemplate
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph

from db import fire_telemetry
from services.llm_factory import build_llm
from services.tools import send_patient_report_email

logger = logging.getLogger(__name__)


class ReportWorkflowState(TypedDict, total=False):
    patient_id: str
    patient_email: str
    patient_metrics: Dict[str, Any]
    additional_context: str
    anomaly_report: str
    clinical_summary: str
    patient_email_body: str
    dispatch_receipt: str


MEDICAL_BASELINES = """
STANDARD ADULT MEDICAL REFERENCE RANGES:
- Blood Pressure (Systolic): 90–120 mmHg  |  (Diastolic): 60–80 mmHg
- Heart Rate (Pulse): 60–100 bpm
- Respiratory Rate: 12–20 breaths/min
- Body Temperature: 36.1–37.2 °C (97–99 °F)
- SpO2 (Oxygen Saturation): 95–100%
- Fasting Blood Glucose: 70–100 mg/dL  |  Post-meal (<2 hrs): <140 mg/dL
- HbA1c: <5.7% (Normal)  |  5.7–6.4% (Prediabetes)  |  ≥6.5% (Diabetes)
- Haemoglobin: Male 13.5–17.5 g/dL  |  Female 12.0–15.5 g/dL
- White Blood Cell Count: 4,500–11,000 cells/μL
- Platelet Count: 150,000–400,000 cells/μL
- Serum Creatinine: 0.6–1.2 mg/dL (Male)  |  0.5–1.1 mg/dL (Female)
- eGFR: ≥60 mL/min/1.73m² (Normal kidney function)
- Total Cholesterol: <200 mg/dL (Desirable)  |  200–239 (Borderline)  |  ≥240 (High)
- LDL Cholesterol: <100 mg/dL (Optimal)
- HDL Cholesterol: ≥60 mg/dL (Protective)  |  <40 mg/dL (Low, risk factor)
- Triglycerides: <150 mg/dL
- Sodium: 136–145 mEq/L
- Potassium: 3.5–5.0 mEq/L
- TSH (Thyroid): 0.4–4.0 mIU/L
- ALT (Liver): 7–56 U/L  |  AST: 10–40 U/L
- Bilirubin (Total): 0.2–1.2 mg/dL
"""


def detect_anomalies_node(state: Dict[str, Any]) -> Dict[str, Any]:
    patient_id = state.get("patient_id", "unknown")
    patient_metrics = state.get("patient_metrics", {})
    additional_context = state.get("additional_context", "")
    logger.info("[REPORT:Node1] Detecting anomalies  patient=%s", patient_id)

    llm = build_llm(temperature=0.1)

    anomaly_prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            f"""You are an expert clinical data analyst AI. Your task is to compare the patient's lab results and vital metrics against standard medical reference baselines and flag ALL statistically significant deviations.

{MEDICAL_BASELINES}

OUTPUT REQUIREMENTS:
1. List EVERY flagged anomaly as a separate bullet point.
2. For each anomaly, state: the metric name, the patient's value, the normal range, the direction of deviation (HIGH/LOW/CRITICAL HIGH/CRITICAL LOW), and one-sentence clinical significance.
3. At the end, provide a brief "Overall Risk Assessment" of LOW / MODERATE / HIGH / CRITICAL.
4. If all values are within normal range, state "All metrics within normal limits."
5. Be precise and clinically rigorous — do not miss borderline values.""",
        ),
        (
            "human",
            "Patient ID: {patient_id}\n\nPatient Metrics:\n{metrics}\n\nAdditional Clinical Context:\n{context}\n\nIdentify all anomalies:",
        ),
    ])

    chain = anomaly_prompt | llm
    result = chain.invoke({
        "patient_id": patient_id,
        "metrics": _format_metrics(patient_metrics),
        "context": additional_context or "None provided.",
    })

    return {"anomaly_report": result.content.strip()}


def synthesise_clinical_summary_node(state: Dict[str, Any]) -> Dict[str, Any]:
    patient_id = state.get("patient_id", "unknown")
    anomaly_report = state.get("anomaly_report", "")
    logger.info("[REPORT:Node2] Synthesising clinical summary  patient=%s", patient_id)

    llm = build_llm(temperature=0.2)

    synthesis_prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are a senior attending physician writing a handover note for your clinical team. 
Based on the anomaly analysis provided, write a terse, high-information clinical paragraph (maximum 150 words) that summarises:
1. Which metrics deviated and in which direction.
2. What urgent symptoms or clinical deterioration signs the team must actively monitor.
3. Any immediately actionable interventions warranted by the data.

Be direct. No fluff. This is for trained clinicians.""",
        ),
        (
            "human",
            "Anomaly Analysis:\n{anomaly_report}\n\nWrite the clinical team summary:",
        ),
    ])

    chain = synthesis_prompt | llm
    result = chain.invoke({"anomaly_report": anomaly_report})
    return {"clinical_summary": result.content.strip()}


def build_patient_mailing_payload_node(state: Dict[str, Any]) -> Dict[str, Any]:
    patient_id = state.get("patient_id", "unknown")
    anomaly_report = state.get("anomaly_report", "")
    clinical_summary = state.get("clinical_summary", "")
    logger.info("[REPORT:Node3] Building patient mailing payload  patient=%s", patient_id)

    llm = build_llm(temperature=0.35)

    patient_email_prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """You are a caring patient communication specialist. Convert the clinical lab analysis into a warm, friendly, and easy-to-understand email body for the patient.

FORMATTING RULES:
- Use plain English — no medical jargon without explanation.
- Structure with clear sections: "Your Test Results Summary", "What These Results Mean For You", "What You Should Do Next", and "Important Warning Signs".
- For each abnormal result, explain in everyday language what the number means and why it matters for the patient's day-to-day life.
- In "What You Should Do Next", provide CONCRETE, SPECIFIC action items (e.g., "Reduce your salt intake — avoid adding table salt to food, and limit processed foods like chips, canned soups, and fast food").
- In "Important Warning Signs", list specific symptoms that mean the patient must call their doctor immediately or go to the nearest emergency room.
- Tone: Warm, reassuring, and empowering — not alarmist.""",
        ),
        (
            "human",
            "Anomaly Analysis:\n{anomaly_report}\n\nClinical Summary:\n{clinical_summary}\n\nWrite the patient email body:",
        ),
    ])

    chain = patient_email_prompt | llm
    result = chain.invoke({
        "anomaly_report": anomaly_report,
        "clinical_summary": clinical_summary,
    })
    return {"patient_email_body": result.content.strip()}


def dispatch_report_and_telemetry_node(state: Dict[str, Any]) -> Dict[str, Any]:
    patient_id = state.get("patient_id", "unknown")
    patient_email = state.get("patient_email", "")
    patient_email_body = state.get("patient_email_body", "")
    anomaly_report = state.get("anomaly_report", "")
    clinical_summary = state.get("clinical_summary", "")
    patient_metrics = state.get("patient_metrics", {})

    logger.info("[REPORT:Node4] Dispatching report  patient=%s  email=%s", patient_id, patient_email)

    receipt = send_patient_report_email.invoke({
        "patient_email": patient_email,
        "patient_id": patient_id,
        "report_body": patient_email_body,
    })

    fire_telemetry(
        event_type="REPORT_DISPATCH",
        payload={
            "patient_id": patient_id,
            "patient_email": patient_email,
            "patient_metrics": patient_metrics,
            "anomaly_report": anomaly_report,
            "clinical_summary": clinical_summary,
            "patient_email_body": patient_email_body,
            "email_receipt": receipt,
        },
    )

    return {"dispatch_receipt": receipt}


def _format_metrics(metrics: Dict[str, Any]) -> str:
    if not metrics:
        return "No metrics provided."
    lines = []
    for key, value in metrics.items():
        lines.append(f"  {key}: {value}")
    return "\n".join(lines)


class ReportWorkflowGraph:
    _instance: Optional[ReportWorkflowGraph] = None

    def __init__(self) -> None:
        self._checkpointer = MemorySaver()
        self._graph = self._build_and_compile()

    @classmethod
    def get_instance(cls) -> ReportWorkflowGraph:
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _build_and_compile(self):
        builder = StateGraph(ReportWorkflowState)
        builder.add_node("detect_anomalies", detect_anomalies_node)
        builder.add_node("synthesise_clinical_summary", synthesise_clinical_summary_node)
        builder.add_node("build_patient_mailing_payload", build_patient_mailing_payload_node)
        builder.add_node("dispatch_report_and_telemetry", dispatch_report_and_telemetry_node)

        builder.set_entry_point("detect_anomalies")
        builder.add_edge("detect_anomalies", "synthesise_clinical_summary")
        builder.add_edge("synthesise_clinical_summary", "build_patient_mailing_payload")
        builder.add_edge("build_patient_mailing_payload", "dispatch_report_and_telemetry")
        builder.add_edge("dispatch_report_and_telemetry", END)

        return builder.compile(checkpointer=self._checkpointer)

    async def invoke_report_pipeline(
        self,
        thread_id: str,
        patient_id: str,
        patient_email: str,
        patient_metrics: Dict[str, Any],
        additional_context: str = "",
    ) -> Dict[str, Any]:
        config_dict = {"configurable": {"thread_id": thread_id}}
        initial_state = {
            "patient_id": patient_id,
            "patient_email": patient_email,
            "patient_metrics": patient_metrics,
            "additional_context": additional_context,
            "anomaly_report": "",
            "clinical_summary": "",
            "patient_email_body": "",
            "dispatch_receipt": "",
        }

        final_state: Dict[str, Any] = {}
        async for event in self._graph.astream(
            initial_state,
            config=config_dict,
            stream_mode="values",
        ):
            final_state = event

        return final_state
