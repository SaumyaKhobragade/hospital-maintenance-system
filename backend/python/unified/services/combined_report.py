"""
services/combined_report.py

Service to synthesize patient medical history with clinical test reports (pathology, radiology, etc.)
into a unified combined report.
"""

from typing import List, Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from services.llm_factory import build_llm

class CombinedReportService:
    def __init__(self):
        self._llm = None

    @property
    def llm(self):
        if self._llm is None:
            self._llm = build_llm(temperature=0.25)
        return self._llm

    def generate_combined_report(
        self,
        patient_id: str,
        retrieved_docs: List[Dict[str, Any]],
        additional_context: str = ""
    ) -> str:
        """
        Synthesizes historical medical context with pathology, radiology, 
        and lab reports to produce a single, unified combined clinical report.
        """
        # Formulate context from retrieved documents
        context_parts = []
        for i, doc in enumerate(retrieved_docs):
            source = doc.get("metadata", {}).get("source", "unknown")
            filename = doc.get("metadata", {}).get("filename", "")
            source_desc = f"Record #{i+1} - Source: {source}"
            if filename:
                source_desc += f" (File: {filename})"
            
            context_parts.append(f"--- {source_desc} ---\n{doc['page_content']}")
        
        context_text = "\n\n".join(context_parts)

        # Build prompt
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """You are a senior attending consultant synthesizing multi-disciplinary clinical data.
Your goal is to review all retrieved patient documents—including medical history, pathology lab reports, radiology imaging interpretations, and current clinical notes—and produce a single, comprehensive "Combined Clinical Report".

Structure your report clearly in Markdown using the following headings:
# COMBINED CLINICAL REPORT
## 1. Executive Patient Summary
Provide a brief, high-level summary of the patient's current medical state and reason for review.

## 2. Historical Context & Chronic Conditions
Summarize the patient's existing medical history, allergies, chronic conditions, and active medications.

## 3. Pathology & Laboratory Findings
Analyze and extract findings from pathology, blood work, or lab test reports. Highlight any abnormal values, flags, or critical ranges.

## 4. Radiology & Imaging Findings
Analyze and extract findings from radiology (X-rays, MRIs, CT scans, ultrasounds, etc.). Summarize the key imaging results.

## 5. Clinical Synthesis & Diagnostic Impressions
Integrate the historical context with the new lab/imaging results. Explain how these findings correlate (e.g. how a radiology finding explains a clinical symptom, or how pathology results reflect disease status).

## 6. Actionable Care Plan & Next Steps
Provide concrete, prioritized recommendations for the care team and the patient. Include any warnings or symptoms that require immediate follow-up.

Be concise, medically precise, and objective. If no information is available for a particular section (e.g. no radiology reports exist in the context), state "No radiology reports available in records." under that section."""
            ),
            (
                "user",
                "Patient ID: {patient_id}\n\nRetrieved Records & Reports:\n{context_text}\n\nAdditional Clinical Context/Instructions:\n{additional_context}\n\nGenerate the Combined Clinical Report:"
            )
        ])

        chain = prompt | self.llm
        result = chain.invoke({
            "patient_id": patient_id,
            "context_text": context_text or "No prior medical records or test reports found.",
            "additional_context": additional_context or "None provided."
        })

        return result.content.strip()
