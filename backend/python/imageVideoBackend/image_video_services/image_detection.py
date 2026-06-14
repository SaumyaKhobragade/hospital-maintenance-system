"""
Service for Image-Based Injury Severity Assist (ISA).
"""

from typing import List
from models.injury import InjuryAnalysisResult
from core.injury_analyzer import get_analyzer

# In-memory results store (for demo purposes)
results_store: List[InjuryAnalysisResult] = []


def detect_image(image_path: str) -> InjuryAnalysisResult:
    """
    Analyze an injury image and return severity assessment.
    
    Args:
        image_path: Path to the image file
        
    Returns:
        InjuryAnalysisResult
    """
    analyzer = get_analyzer()
    result = analyzer.analyze(image_path)
    
    # Store result
    results_store.append(result)
    
    return result


def get_results(limit: int = 10) -> List[InjuryAnalysisResult]:
    """
    Get recent injury analysis results.
    """
    return results_store[-limit:]


def clear_results() -> dict:
    """
    Clear all stored results.
    """
    results_store.clear()
    return {"message": "Results cleared", "count": 0}
