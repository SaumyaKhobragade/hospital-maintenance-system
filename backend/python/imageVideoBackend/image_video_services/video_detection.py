"""
Service for Video-Based Behavioral Distress Detection (VBDD).
"""

from typing import List
from models.events import DistressEvent, AnalysisResponse
from core.frame_sampler import sample_frames, get_video_info
from core.blob_detector import BlobDetector
from core.tracker import BlobTracker
from core.distress_analyzer import DistressAnalyzerPhase2

# In-memory event store (for demo purposes)
event_store: List[DistressEvent] = []


def detect_video(video_path: str) -> AnalysisResponse:
    """
    Process a video file and detect distress signals.
    
    Args:
        video_path: Path to the video file
        
    Returns:
        AnalysisResponse with detected events
    """
    # Get video info
    video_info = get_video_info(video_path)
    
    # Initialize components
    detector = BlobDetector()
    tracker = BlobTracker()
    analyzer = DistressAnalyzerPhase2()  # Phase 2 includes all signal types
    
    all_events: List[DistressEvent] = []
    frames_analyzed = 0
    
    # Process video frame by frame
    for frame_idx, frame, timestamp in sample_frames(video_path):
        # Detect blobs in frame
        blobs = detector.detect(frame)
        
        # Update tracker with detections
        tracked_blobs = tracker.update(blobs, timestamp)
        
        # Analyze for distress signals
        events = analyzer.analyze(tracked_blobs, timestamp)
        all_events.extend(events)
        
        frames_analyzed += 1
    
    # Store events for later retrieval
    event_store.extend(all_events)
    
    return AnalysisResponse(
        events=all_events,
        videoProcessed=True,
        framesAnalyzed=frames_analyzed,
        totalDurationSec=video_info["duration_sec"],
        message=f"Analysis complete. Detected {len(all_events)} distress events."
    )


def get_events() -> List[DistressEvent]:
    """
    Get all stored distress events.
    """
    return event_store


def clear_events() -> dict:
    """
    Clear all stored events.
    """
    event_store.clear()
    return {"message": "Events cleared", "count": 0}
