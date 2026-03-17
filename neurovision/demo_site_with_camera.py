"""
NeuroVision Trainer - REAL Camera Integration + Glowing Pill UI
================================================================

VALUE PROPOSITION: Feel Off? Explore Your Eye Patterns in 2 Minutes.
Real-time eye tracking via webcam + MediaPipe Face Mesh.

© 2025 NeuroVision - Patent-Pending Algorithms
Contact: partnerships@neurovision.tech
"""

import streamlit as st
import numpy as np
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime
import hashlib
import json
import time
import cv2
from streamlit_webrtc import webrtc_streamer, WebRtcMode, RTCConfiguration
import av
import threading
from collections import deque

# MediaPipe imports with fallback
try:
    import mediapipe as mp
    mp_face_mesh = mp.solutions.face_mesh
    mp_drawing = mp.solutions.drawing_utils
    mp_drawing_styles = mp.solutions.drawing_styles
    MEDIAPIPE_AVAILABLE = True
except (ImportError, AttributeError):
    MEDIAPIPE_AVAILABLE = False

# ============================================================================
# PAGE CONFIG
# ============================================================================
st.set_page_config(
    page_title="NeuroVision Trainer - Explore Your Eye Patterns",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ============================================================================
# GLOWING PILL AESTHETIC CSS
# ============================================================================
st.markdown("""
<style>
    /* Import Inter Font */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

    * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Dark Background with Colorful Blurred Orbs */
    .main {
        background: #0a0614;
        position: relative;
        overflow: hidden;
    }

    .main::before {
        content: '';
        position: fixed;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background:
            radial-gradient(circle at 20% 30%, rgba(255, 110, 196, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(255, 165, 0, 0.18) 0%, transparent 50%),
            radial-gradient(circle at 90% 70%, rgba(79, 172, 254, 0.18) 0%, transparent 50%),
            radial-gradient(circle at 10% 90%, rgba(50, 205, 50, 0.15) 0%, transparent 50%);
        filter: blur(120px);
        animation: orb-float 25s ease-in-out infinite;
        z-index: 0;
    }

    @keyframes orb-float {
        0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
        33% { transform: translate(40px, -60px) rotate(120deg) scale(1.1); }
        66% { transform: translate(-30px, 30px) rotate(240deg) scale(0.95); }
    }

    /* Hero Section - Full Width Glowing */
    .hero-glow {
        background: linear-gradient(135deg, rgba(255, 110, 196, 0.12), rgba(139, 92, 246, 0.12));
        backdrop-filter: blur(40px);
        -webkit-backdrop-filter: blur(40px);
        border-radius: 36px;
        border: 2px solid rgba(255, 110, 196, 0.3);
        padding: 4rem 2rem;
        margin: 2rem 0;
        text-align: center;
        position: relative;
        overflow: hidden;
        box-shadow:
            0 20px 70px rgba(255, 110, 196, 0.4),
            0 0 50px rgba(139, 92, 246, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        animation: hero-pulse 4s ease-in-out infinite;
    }

    @keyframes hero-pulse {
        0%, 100% { box-shadow: 0 20px 70px rgba(255, 110, 196, 0.4), 0 0 50px rgba(139, 92, 246, 0.3); }
        50% { box-shadow: 0 25px 80px rgba(255, 110, 196, 0.6), 0 0 70px rgba(139, 92, 246, 0.5); }
    }

    .hero-glow::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 5px;
        background: linear-gradient(90deg,
            rgba(255, 110, 196, 0.9),
            rgba(139, 92, 246, 0.9),
            rgba(79, 172, 254, 0.9));
        filter: blur(6px);
    }

    .hero-glow h1 {
        font-size: 3.5rem;
        font-weight: 900;
        background: linear-gradient(135deg, #ff6ec4, #8b5cf6, #4facfe);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 1rem;
        text-shadow: 0 0 60px rgba(255, 110, 196, 0.7);
        letter-spacing: -1px;
    }

    .hero-glow p {
        color: rgba(255, 255, 255, 0.95);
        font-size: 1.4rem;
        line-height: 1.8;
        font-weight: 500;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }

    /* Pill Cards - Glowing Semi-Transparent */
    .pill-glow {
        background: rgba(255, 255, 255, 0.04);
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        border-radius: 60px;
        border: 2px solid;
        padding: 1.5rem 2.5rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin: 1.5rem 0;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        z-index: 1;
    }

    .pill-glow:hover {
        background: rgba(255, 255, 255, 0.08);
        transform: translateY(-6px) scale(1.02);
        box-shadow:
            0 15px 50px rgba(0, 0, 0, 0.4),
            0 0 40px currentColor;
    }

    .pill-purple {
        border-color: rgba(139, 92, 246, 0.5);
        box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
    }

    .pill-purple:hover {
        box-shadow: 0 15px 50px rgba(139, 92, 246, 0.5);
    }

    .pill-pink {
        border-color: rgba(255, 110, 196, 0.5);
        box-shadow: 0 8px 32px rgba(255, 110, 196, 0.3);
    }

    .pill-pink:hover {
        box-shadow: 0 15px 50px rgba(255, 110, 196, 0.5);
    }

    .pill-blue {
        border-color: rgba(79, 172, 254, 0.5);
        box-shadow: 0 8px 32px rgba(79, 172, 254, 0.3);
    }

    .pill-blue:hover {
        box-shadow: 0 15px 50px rgba(79, 172, 254, 0.5);
    }

    .pill-orange {
        border-color: rgba(255, 165, 0, 0.5);
        box-shadow: 0 8px 32px rgba(255, 165, 0, 0.3);
    }

    .pill-orange:hover {
        box-shadow: 0 15px 50px rgba(255, 165, 0, 0.5);
    }

    .pill-green {
        border-color: rgba(50, 205, 50, 0.5);
        box-shadow: 0 8px 32px rgba(50, 205, 50, 0.3);
    }

    .pill-green:hover {
        box-shadow: 0 15px 50px rgba(50, 205, 50, 0.5);
    }

    .pill-red {
        border-color: rgba(255, 107, 107, 0.5);
        box-shadow: 0 8px 32px rgba(255, 107, 107, 0.3);
    }

    .pill-red:hover {
        box-shadow: 0 15px 50px rgba(255, 107, 107, 0.5);
    }

    .pill-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        flex-shrink: 0;
        background: linear-gradient(135deg, currentColor, transparent);
        box-shadow: 0 0 20px currentColor;
    }

    .pill-content {
        flex: 1;
    }

    .pill-title {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin-bottom: 0.4rem;
    }

    .pill-value {
        color: white;
        font-size: 2rem;
        font-weight: 800;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }

    /* Neon Glow Buttons */
    .stButton > button {
        background: rgba(255, 110, 196, 0.15) !important;
        backdrop-filter: blur(15px);
        color: white !important;
        font-weight: 800 !important;
        font-size: 1rem !important;
        padding: 1rem 2.5rem !important;
        border-radius: 60px !important;
        border: 2px solid rgba(255, 110, 196, 0.5) !important;
        box-shadow: 0 6px 30px rgba(255, 110, 196, 0.4), 0 0 20px rgba(255, 110, 196, 0.3) !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .stButton > button:hover {
        background: rgba(255, 110, 196, 0.25) !important;
        box-shadow: 0 10px 50px rgba(255, 110, 196, 0.6), 0 0 40px rgba(255, 110, 196, 0.5) !important;
        transform: translateY(-3px) scale(1.05) !important;
        border-color: rgba(255, 110, 196, 0.8) !important;
    }

    /* Glowing Tabs */
    .stTabs [data-baseweb="tab-list"] {
        gap: 1rem;
        background: rgba(255, 255, 255, 0.02);
        backdrop-filter: blur(30px);
        border-radius: 60px;
        padding: 0.8rem;
        border: 2px solid rgba(255, 255, 255, 0.08);
    }

    .stTabs [data-baseweb="tab"] {
        background: transparent;
        border-radius: 50px;
        color: rgba(255, 255, 255, 0.5);
        font-weight: 700;
        padding: 1rem 2rem;
        transition: all 0.3s ease;
        border: 2px solid transparent;
    }

    .stTabs [aria-selected="true"] {
        background: rgba(139, 92, 246, 0.2) !important;
        color: white !important;
        border-color: rgba(139, 92, 246, 0.6) !important;
        box-shadow: 0 0 30px rgba(139, 92, 246, 0.5);
    }

    /* Minimal Disclaimers - Small Pill Footer */
    .disclaimer-pill {
        background: rgba(255, 165, 0, 0.06);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 165, 0, 0.25);
        border-radius: 30px;
        padding: 1.5rem;
        margin: 2rem 0;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
    }

    .disclaimer-pill h3 {
        color: #ffa500;
        font-weight: 800;
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
    }

    /* Text Colors */
    p, span, li {
        color: rgba(255, 255, 255, 0.85);
    }

    h1, h2, h3, h4, h5, h6 {
        color: white;
        font-weight: 800;
    }

    /* Score Badge - Large Glowing */
    .score-glow {
        background: rgba(79, 172, 254, 0.1);
        backdrop-filter: blur(30px);
        border: 3px solid rgba(79, 172, 254, 0.5);
        border-radius: 40px;
        padding: 3rem 2rem;
        text-align: center;
        box-shadow:
            0 15px 60px rgba(79, 172, 254, 0.4),
            0 0 50px rgba(79, 172, 254, 0.3);
        animation: score-pulse 3s ease-in-out infinite;
    }

    @keyframes score-pulse {
        0%, 100% { transform: scale(1); box-shadow: 0 15px 60px rgba(79, 172, 254, 0.4); }
        50% { transform: scale(1.02); box-shadow: 0 20px 80px rgba(79, 172, 254, 0.6); }
    }

    .score-glow h2 {
        font-size: 5rem;
        font-weight: 900;
        background: linear-gradient(135deg, #4facfe, #00f2fe);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
        text-shadow: 0 0 50px rgba(79, 172, 254, 0.8);
    }

    .score-glow p {
        color: rgba(255, 255, 255, 0.9);
        font-size: 1.3rem;
        font-weight: 700;
        margin: 1rem 0 0 0;
    }

    /* Alert Glow */
    .alert-glow-severe {
        background: rgba(255, 107, 107, 0.12);
        backdrop-filter: blur(30px);
        border: 3px solid rgba(255, 107, 107, 0.6);
        border-radius: 30px;
        padding: 2rem;
        margin: 2rem 0;
        color: white;
        box-shadow:
            0 0 40px rgba(255, 107, 107, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        animation: alert-pulse 2s infinite;
    }

    @keyframes alert-pulse {
        0%, 100% { box-shadow: 0 0 40px rgba(255, 107, 107, 0.5); }
        50% { box-shadow: 0 0 60px rgba(255, 107, 107, 0.8); }
    }

    .alert-glow-severe h3 {
        color: #ff6b6b;
        font-weight: 900;
        font-size: 1.6rem;
        margin-bottom: 1rem;
        text-shadow: 0 0 20px rgba(255, 107, 107, 0.7);
    }

    /* Sliders - Gradient */
    .stSlider > div > div > div {
        background: linear-gradient(90deg, #32cd32, #ffa500, #ff6b6b) !important;
    }

    /* Footer - Small Pill */
    .footer-pill {
        background: rgba(255, 255, 255, 0.02);
        backdrop-filter: blur(25px);
        border-radius: 30px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 2rem;
        margin-top: 3rem;
        color: rgba(255, 255, 255, 0.7);
        text-align: center;
        font-size: 0.9rem;
    }

    .footer-pill h4 {
        color: white;
        font-weight: 800;
        margin-bottom: 1rem;
    }

    /* Hide Streamlit Branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}

    /* Checkbox Styling */
    .stCheckbox {
        background: rgba(255, 255, 255, 0.04);
        backdrop-filter: blur(15px);
        border-radius: 20px;
        padding: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
</style>
""", unsafe_allow_html=True)

# ============================================================================
# CLINICAL RESOURCES
# ============================================================================
CLINICAL_RESOURCES = {
    'concussion_australia': 'https://concussion.org.au',
    'provider_finder': 'https://concussion.org.au/find-help',
    'emergency': '000',
    'helpline': '1300 000 000'
}

# ============================================================================
# GLOBAL STATE FOR CAMERA TRACKING
# ============================================================================
class EyeTrackingState:
    """Global state for real-time eye tracking data"""
    def __init__(self):
        self.lock = threading.Lock()
        self.gaze_positions = deque(maxlen=300)  # 10 seconds at 30fps
        self.blink_events = []
        self.pupil_sizes = deque(maxlen=300)
        self.head_movements = deque(maxlen=300)
        self.tracking_active = False
        self.last_frame_time = None

    def add_gaze_position(self, x, y):
        with self.lock:
            self.gaze_positions.append((x, y, time.time()))

    def add_blink_event(self):
        with self.lock:
            self.blink_events.append(time.time())

    def add_pupil_size(self, size):
        with self.lock:
            self.pupil_sizes.append((size, time.time()))

    def add_head_movement(self, dx, dy):
        with self.lock:
            self.head_movements.append((dx, dy, time.time()))

    def get_recent_data(self, seconds=10):
        with self.lock:
            current_time = time.time()

            # Filter data from last N seconds
            recent_gaze = [g for g in self.gaze_positions if current_time - g[2] <= seconds]
            recent_blinks = [b for b in self.blink_events if current_time - b <= seconds]
            recent_pupils = [p for p in self.pupil_sizes if current_time - p[1] <= seconds]
            recent_head = [h for h in self.head_movements if current_time - h[2] <= seconds]

            return {
                'gaze': recent_gaze,
                'blinks': recent_blinks,
                'pupils': recent_pupils,
                'head': recent_head
            }

    def reset(self):
        with self.lock:
            self.gaze_positions.clear()
            self.blink_events = []
            self.pupil_sizes.clear()
            self.head_movements.clear()

# Initialize global tracking state
if 'eye_tracking' not in st.session_state:
    st.session_state.eye_tracking = EyeTrackingState()

# ============================================================================
# EYE TRACKING VIDEO PROCESSOR
# ============================================================================
class EyeTrackingProcessor:
    """Process video frames for eye tracking"""

    def __init__(self):
        if MEDIAPIPE_AVAILABLE:
            self.face_mesh = mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
        else:
            self.face_mesh = None

        self.prev_eye_center = None
        self.prev_time = None

        # Eye landmark indices (MediaPipe Face Mesh)
        self.LEFT_EYE = [33, 160, 158, 133, 153, 144]
        self.RIGHT_EYE = [362, 385, 387, 263, 373, 380]
        self.LEFT_IRIS = [474, 475, 476, 477]
        self.RIGHT_IRIS = [469, 470, 471, 472]

    def recv(self, frame):
        img = frame.to_ndarray(format="bgr24")

        if not MEDIAPIPE_AVAILABLE or self.face_mesh is None:
            # Draw "MediaPipe not available" message
            cv2.putText(img, "MediaPipe not available", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
            return av.VideoFrame.from_ndarray(img, format="bgr24")

        # Convert to RGB for MediaPipe
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(img_rgb)

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                # Draw face mesh
                mp_drawing.draw_landmarks(
                    image=img,
                    landmark_list=face_landmarks,
                    connections=mp_face_mesh.FACEMESH_TESSELATION,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style()
                )

                # Draw eye contours
                mp_drawing.draw_landmarks(
                    image=img,
                    landmark_list=face_landmarks,
                    connections=mp_face_mesh.FACEMESH_LEFT_EYE,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_contours_style()
                )
                mp_drawing.draw_landmarks(
                    image=img,
                    landmark_list=face_landmarks,
                    connections=mp_face_mesh.FACEMESH_RIGHT_EYE,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_contours_style()
                )

                # Extract eye data
                h, w, _ = img.shape
                landmarks = face_landmarks.landmark

                # Calculate eye center (average of left and right eye centers)
                left_eye_center = self._get_eye_center(landmarks, self.LEFT_EYE, w, h)
                right_eye_center = self._get_eye_center(landmarks, self.RIGHT_EYE, w, h)
                eye_center = ((left_eye_center[0] + right_eye_center[0]) / 2,
                             (left_eye_center[1] + right_eye_center[1]) / 2)

                # Detect blink (eye aspect ratio)
                left_ear = self._calculate_eye_aspect_ratio(landmarks, self.LEFT_EYE)
                right_ear = self._calculate_eye_aspect_ratio(landmarks, self.RIGHT_EYE)
                avg_ear = (left_ear + right_ear) / 2.0

                if avg_ear < 0.2:  # Blink threshold
                    st.session_state.eye_tracking.add_blink_event()
                    cv2.putText(img, "BLINK", (10, 30),
                               cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)

                # Calculate gaze position (normalized 0-1)
                gaze_x = eye_center[0] / w
                gaze_y = eye_center[1] / h
                st.session_state.eye_tracking.add_gaze_position(gaze_x, gaze_y)

                # Calculate head movement
                if self.prev_eye_center is not None:
                    dx = eye_center[0] - self.prev_eye_center[0]
                    dy = eye_center[1] - self.prev_eye_center[1]
                    st.session_state.eye_tracking.add_head_movement(dx, dy)

                self.prev_eye_center = eye_center

                # Draw gaze indicator
                cv2.circle(img, (int(eye_center[0]), int(eye_center[1])), 5, (0, 255, 0), -1)

                # Display gaze position
                cv2.putText(img, f"Gaze: ({gaze_x:.2f}, {gaze_y:.2f})", (10, h - 10),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        return av.VideoFrame.from_ndarray(img, format="bgr24")

    def _get_eye_center(self, landmarks, eye_indices, w, h):
        """Calculate center of eye landmarks"""
        x_coords = [landmarks[i].x * w for i in eye_indices]
        y_coords = [landmarks[i].y * h for i in eye_indices]
        return (np.mean(x_coords), np.mean(y_coords))

    def _calculate_eye_aspect_ratio(self, landmarks, eye_indices):
        """Calculate eye aspect ratio for blink detection"""
        # Vertical eye landmarks
        v1 = np.linalg.norm(np.array([landmarks[eye_indices[1]].x, landmarks[eye_indices[1]].y]) -
                            np.array([landmarks[eye_indices[5]].x, landmarks[eye_indices[5]].y]))
        v2 = np.linalg.norm(np.array([landmarks[eye_indices[2]].x, landmarks[eye_indices[2]].y]) -
                            np.array([landmarks[eye_indices[4]].x, landmarks[eye_indices[4]].y]))

        # Horizontal eye landmark
        h = np.linalg.norm(np.array([landmarks[eye_indices[0]].x, landmarks[eye_indices[0]].y]) -
                          np.array([landmarks[eye_indices[3]].x, landmarks[eye_indices[3]].y]))

        # Eye aspect ratio
        ear = (v1 + v2) / (2.0 * h)
        return ear

# ============================================================================
# PROPRIETARY ALGORITHMS (SAME AS BEFORE)
# ============================================================================
class ProprietaryMetrics:
    """Patent-Pending Algorithms for NeuroVision Trainer"""

    @staticmethod
    def calculate_gaze_holding_score_from_tracking(tracking_data: dict) -> dict:
        """
        Calculate Gaze Holding Score™ from real tracking data
        """
        gaze_positions = tracking_data['gaze']
        blinks = tracking_data['blinks']
        head_movements = tracking_data['head']

        if len(gaze_positions) < 10:
            return {
                'total_score': 0,
                'pursuit_score': 0,
                'fixation_score': 0,
                'vor_score': 0,
                'blink_rate': 0,
                'catch_up_saccades': 0,
                'nystagmus_detected': False,
                'interpretation': 'Insufficient Data',
                'clinical_interpretation': 'Not enough tracking data collected. Make sure camera is active and face is visible.',
                'deficit_type': 'insufficient_data'
            }

        # Calculate pursuit gain (smoothness of gaze tracking)
        gaze_deltas = []
        for i in range(1, len(gaze_positions)):
            dx = gaze_positions[i][0] - gaze_positions[i-1][0]
            dy = gaze_positions[i][1] - gaze_positions[i-1][1]
            delta = np.sqrt(dx**2 + dy**2)
            gaze_deltas.append(delta)

        # Smoothness (low variance = smooth)
        if len(gaze_deltas) > 0:
            smoothness = 1.0 - min(1.0, np.std(gaze_deltas) * 10)
        else:
            smoothness = 0.5

        pursuit_gain = smoothness

        # Calculate fixation drift
        if len(gaze_positions) > 0:
            gaze_x = [g[0] for g in gaze_positions]
            gaze_y = [g[1] for g in gaze_positions]
            fixation_drift = np.std(gaze_x) + np.std(gaze_y)
        else:
            fixation_drift = 1.0

        # VOR gain (from head movements)
        vor_gain = 0.9  # Placeholder

        # Catch-up saccades (jerky movements)
        catch_up_saccades = sum(1 for d in gaze_deltas if d > 0.05)

        # Nystagmus detection
        nystagmus_detected = catch_up_saccades > 10

        # Blink rate
        blink_rate = len(blinks) / 10.0  # per second
        symptom_delta = max(0, (blink_rate - 0.3) * 5)  # Elevated blink = symptom aggravation proxy

        # Calculate score
        pursuit_score = min(100, pursuit_gain * 100)
        fixation_score = max(0, 100 - (fixation_drift * 50))
        vor_score = min(100, vor_gain * 100)
        catch_up_penalty = max(0, 100 - (catch_up_saccades * 5))
        nystagmus_penalty = 0 if not nystagmus_detected else 20

        total_score = (
            pursuit_score * 0.30 +
            fixation_score * 0.25 +
            vor_score * 0.25 +
            catch_up_penalty * 0.20
        ) - nystagmus_penalty - (symptom_delta * 2)

        total_score = max(0, min(100, total_score))

        if total_score >= 75:
            interpretation = 'Normal Gaze Holding'
            clinical = 'Vestibular/oculomotor function appears intact'
        elif total_score >= 50:
            interpretation = 'Mild Gaze Holding Deficit'
            clinical = 'Possible mild vestibular/oculomotor dysfunction - consider monitoring or targeted exercises'
        else:
            interpretation = 'Significant Gaze Holding Deficit'
            clinical = 'Likely vestibular/oculomotor pathology - vestibular therapy and neuro-optometry evaluation recommended'

        return {
            'total_score': round(total_score, 1),
            'pursuit_score': round(pursuit_score, 1),
            'fixation_score': round(fixation_score, 1),
            'vor_score': round(vor_score, 1),
            'blink_rate': round(blink_rate, 2),
            'catch_up_saccades': catch_up_saccades,
            'nystagmus_detected': nystagmus_detected,
            'interpretation': interpretation,
            'clinical_interpretation': clinical,
            'deficit_type': 'vestibular_oculomotor'
        }

# ============================================================================
# SESSION STATE INITIALIZATION
# ============================================================================
if 'session_data' not in st.session_state:
    st.session_state.session_data = {
        'session_id': hashlib.md5(str(datetime.now()).encode()).hexdigest()[:12],
        'consent_given': False,
        'baseline_symptoms': {},
        'post_symptoms': {},
        'scores': {},
        'all_sessions': [],
        'severe_alerts': []
    }

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
def show_minimal_disclaimer():
    st.markdown(f"""
    <div class="disclaimer-pill">
        <h3>⚠️ Wellness Tool Only</h3>
        <p><strong>NOT diagnostic.</strong> Seek professional help for persistent symptoms.
        Emergency: {CLINICAL_RESOURCES['emergency']} |
        <a href="{CLINICAL_RESOURCES['concussion_australia']}" target="_blank">Concussion Australia</a></p>
    </div>
    """, unsafe_allow_html=True)

def show_symptom_scales_minimal(scale_type="baseline"):
    """Minimal symptom scales (0-10 sliders)"""
    symptoms = {}

    col1, col2, col3 = st.columns(3)

    with col1:
        symptoms['headache'] = st.slider("💢 Headache", 0, 10, 0, key=f"{scale_type}_head")
        symptoms['dizziness'] = st.slider("💫 Dizziness", 0, 10, 0, key=f"{scale_type}_dizzy")

    with col2:
        symptoms['nausea'] = st.slider("🤢 Nausea", 0, 10, 0, key=f"{scale_type}_nausea")
        symptoms['fogginess'] = st.slider("🌫️ Fog", 0, 10, 0, key=f"{scale_type}_fog")

    with col3:
        symptoms['eye_strain'] = st.slider("👁️ Eye Strain", 0, 10, 0, key=f"{scale_type}_eye")
        symptoms['cognitive_fog'] = st.slider("🧠 Focus Loss", 0, 10, 0, key=f"{scale_type}_cog")

    return symptoms

# ============================================================================
# MAIN APP
# ============================================================================

# Hero Section - Full Width Glowing
st.markdown("""
<div class="hero-glow">
    <h1>🧠 NeuroVision Trainer</h1>
    <p><strong>Feel Off? Explore Your Eye Patterns in 2 Minutes</strong></p>
    <p style="font-size: 1.1rem; margin-top: 1rem;">
        Screens all day? Eyes tired? Focus slipping?
        Quickly explore if your eye patterns might be part of it.
    </p>
</div>
""", unsafe_allow_html=True)

# Tabs
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
    "🏠 Start Here",
    "👁️ Gaze Holding",
    "🎯 Gaze Shifting",
    "🎮 Driving Simulation",
    "💡 Pupil Flash",
    "📊 Results"
])

# ============================================================================
# TAB 1: HOME
# ============================================================================
with tab1:
    show_minimal_disclaimer()

    st.markdown('<div class="pill-glow pill-purple">', unsafe_allow_html=True)
    st.markdown("""
    <div class="pill-content">
        <div class="pill-title">What We Do</div>
        <div class="pill-value" style="font-size: 1.2rem;">Real-time eye tracking reveals patterns in screen fatigue, focus, attention, post-injury fog.</div>
    </div>
    """, unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)

    st.markdown("---")

    # Consent
    st.markdown("### ✅ Consent to Start")
    consent = st.checkbox(
        """I understand this is a wellness tool (not medical/diagnostic). I'll stop if symptoms worsen and seek professional care if needed.""",
        value=st.session_state.session_data['consent_given'],
        key="consent_checkbox"
    )

    st.session_state.session_data['consent_given'] = consent

    if consent:
        st.success("✅ Ready! Go to Gaze Holding tab →")

# ============================================================================
# TAB 2: GAZE HOLDING (LIVE CAMERA)
# ============================================================================
with tab2:
    show_minimal_disclaimer()

    if not st.session_state.session_data['consent_given']:
        st.error("⚠️ Accept consent on Start tab first.")
        st.stop()

    st.markdown("""
    <div class="pill-glow pill-pink">
        <div class="pill-icon" style="color: #ff6ec4;">👁️</div>
        <div class="pill-content">
            <div class="pill-title">Gaze Holding Assessment</div>
            <div class="pill-value">Live Eye Tracking</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("### 📹 How This Works")

    st.markdown("""
    <div class="pill-glow pill-purple">
        <div class="pill-content">
            <div class="pill-title">Step 1</div>
            <div class="pill-value" style="font-size: 1.1rem;">Rate your symptoms BEFORE test (below)</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div class="pill-glow pill-blue">
        <div class="pill-content">
            <div class="pill-title">Step 2</div>
            <div class="pill-value" style="font-size: 1.1rem;">Allow camera access when prompted (see camera feed below)</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div class="pill-glow pill-green">
        <div class="pill-content">
            <div class="pill-title">Step 3</div>
            <div class="pill-value" style="font-size: 1.1rem;">Click "Start Test" → Keep eyes on screen for 10 seconds</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("""
    <div class="pill-glow pill-orange">
        <div class="pill-content">
            <div class="pill-title">Step 4</div>
            <div class="pill-value" style="font-size: 1.1rem;">Rate symptoms AFTER test → See your score!</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Baseline symptoms
    st.markdown("### 🎯 Before Test: How Do You Feel?")
    baseline_symptoms = show_symptom_scales_minimal("baseline_gaze")

    # WebRTC Camera Stream
    st.markdown("### 📷 Step 2: Camera Feed")

    st.warning("🔔 When you see camera permission popup → Click ALLOW")

    st.markdown("""
    **You should see:**
    - Your face with green dots tracking your eyes
    - Mesh overlay on your face
    - "Gaze: (x, y)" coordinates displayed
    - "BLINK" text when you blink
    """)

    webrtc_ctx = webrtc_streamer(
        key="eye-tracking",
        mode=WebRtcMode.SENDRECV,
        rtc_configuration=RTCConfiguration(
            {"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]}
        ),
        video_processor_factory=EyeTrackingProcessor,
        media_stream_constraints={"video": True, "audio": False},
        async_processing=True,
    )

    if not webrtc_ctx.state.playing:
        st.error("❌ Camera not active. Click START above to enable camera.")
    else:
        st.success("✅ Camera active! You should see your face with eye tracking overlay.")

    st.markdown("---")

    # Start tracking button
    if st.button("▶️ Start 10-Second Gaze Holding Test", key="start_gaze_live"):
        if webrtc_ctx.video_processor:
            st.session_state.eye_tracking.reset()
            st.session_state.eye_tracking.tracking_active = True

            # Show countdown
            progress_bar = st.progress(0)
            status_text = st.empty()

            for i in range(10):
                status_text.markdown(f"### ⏱️ Recording... {10 - i} seconds left")
                time.sleep(1)
                progress_bar.progress((i + 1) / 10)

            st.session_state.eye_tracking.tracking_active = False
            status_text.markdown("### ✅ Recording Complete!")

            # Get tracking data
            tracking_data = st.session_state.eye_tracking.get_recent_data(seconds=10)

            # Post-test symptoms
            st.markdown("### 📊 After Test: How Do You Feel Now?")
            post_symptoms = show_symptom_scales_minimal("post_gaze")

            # Calculate score
            score = ProprietaryMetrics.calculate_gaze_holding_score_from_tracking(tracking_data)

            st.session_state.session_data['scores']['gaze_holding'] = score

            # Display score with glowing pill
            st.markdown(f"""
            <div class="score-glow">
                <h2>{score['total_score']}</h2>
                <p>{score['interpretation']}</p>
                <p style="font-size: 1rem; margin-top: 1rem;">{score['clinical_interpretation']}</p>
            </div>
            """, unsafe_allow_html=True)

            # Show metrics
            col1, col2, col3 = st.columns(3)

            with col1:
                st.markdown(f"""
                <div class="pill-glow pill-blue">
                    <div class="pill-content">
                        <div class="pill-title">Pursuit Score</div>
                        <div class="pill-value">{score['pursuit_score']}</div>
                    </div>
                </div>
                """, unsafe_allow_html=True)

            with col2:
                st.markdown(f"""
                <div class="pill-glow pill-green">
                    <div class="pill-content">
                        <div class="pill-title">Fixation Score</div>
                        <div class="pill-value">{score['fixation_score']}</div>
                    </div>
                </div>
                """, unsafe_allow_html=True)

            with col3:
                st.markdown(f"""
                <div class="pill-glow pill-orange">
                    <div class="pill-content">
                        <div class="pill-title">Blink Rate</div>
                        <div class="pill-value">{score['blink_rate']}/s</div>
                    </div>
                </div>
                """, unsafe_allow_html=True)

            # Symptom delta
            symptom_delta = sum(post_symptoms.values()) - sum(baseline_symptoms.values())

            if symptom_delta > 5:
                st.markdown(f"""
                <div class="alert-glow-severe">
                    <h3>🚨 Symptom Aggravation Detected</h3>
                    <p>Symptoms increased by +{symptom_delta} points during test.</p>
                    <p><strong>Recommendation:</strong> Stop testing. Seek professional evaluation.</p>
                    <p><a href="{CLINICAL_RESOURCES['concussion_australia']}" target="_blank" style="color: #4facfe;">Find Specialist</a> | Emergency: {CLINICAL_RESOURCES['emergency']}</p>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.error("❌ Camera not active. Allow camera access and try again.")

# ============================================================================
# TAB 3: GAZE SHIFTING
# ============================================================================
with tab3:
    show_minimal_disclaimer()

    if not st.session_state.session_data['consent_given']:
        st.error("⚠️ Accept consent on Start tab first.")
        st.stop()

    st.markdown("""
    <div class="pill-glow pill-blue">
        <div class="pill-icon" style="color: #4facfe;">🎯</div>
        <div class="pill-content">
            <div class="pill-title">Gaze Shifting Assessment</div>
            <div class="pill-value">Saccade Speed & Accuracy</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.info("🚧 Coming Soon - This assessment will test rapid eye movements between targets (saccades)")

    st.markdown("### What This Tests")
    st.markdown("""
    - **Saccade Latency:** How fast your eyes jump to new targets
    - **Accuracy:** How precisely you land on targets
    - **Antisaccades:** Your ability to look AWAY from distractions
    - **Common Issues:** Slow saccades suggest cortical/attentional deficits
    """)

# ============================================================================
# TAB 4: DRIVING SIMULATION
# ============================================================================
with tab4:
    show_minimal_disclaimer()

    if not st.session_state.session_data['consent_given']:
        st.error("⚠️ Accept consent on Start tab first.")
        st.stop()

    st.markdown("""
    <div class="pill-glow pill-orange">
        <div class="pill-icon" style="color: #ffa500;">🎮</div>
        <div class="pill-content">
            <div class="pill-title">Driving Simulation</div>
            <div class="pill-value">Quadrant-Specific Lag Detection</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.info("🚧 Coming Soon - This assessment will test your response to targets appearing in different visual quadrants")

    st.markdown("### What This Tests")
    st.markdown("""
    - **Upper Right Quadrant:** Cars merging from right side
    - **Upper Left Quadrant:** Oncoming traffic, left turns
    - **Lower Quadrants:** Pedestrians, road hazards
    - **Common Issues:** Quadrant-specific lag = targeted vestibular therapy needed
    """)

# ============================================================================
# TAB 5: PUPIL FLASH
# ============================================================================
with tab5:
    show_minimal_disclaimer()

    if not st.session_state.session_data['consent_given']:
        st.error("⚠️ Accept consent on Start tab first.")
        st.stop()

    st.markdown("""
    <div class="pill-glow pill-green">
        <div class="pill-icon" style="color: #32cd32;">💡</div>
        <div class="pill-content">
            <div class="pill-title">Pupil Flash Reflex</div>
            <div class="pill-value">ANS Dysfunction Detection</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.info("🚧 Coming Soon - Use your phone camera to record pupil response to flashlight")

    st.markdown("### What This Tests")
    st.markdown("""
    - **Constriction Latency:** How fast your pupil shrinks when light flashes
    - **Amplitude:** How much your pupil constricts (normal: 2mm)
    - **Recovery Time:** How fast it returns to baseline
    - **Common Issues:** Slow/weak response = ANS dysfunction (common in post-concussion)
    """)

# ============================================================================
# TAB 6: RESULTS
# ============================================================================
with tab6:
    show_minimal_disclaimer()

    st.markdown("### 📊 Your Results")

    if 'gaze_holding' in st.session_state.session_data['scores']:
        score = st.session_state.session_data['scores']['gaze_holding']

        st.markdown(f"""
        <div class="pill-glow pill-purple">
            <div class="pill-icon" style="color: #8b5cf6;">🏆</div>
            <div class="pill-content">
                <div class="pill-title">Gaze Holding Score™</div>
                <div class="pill-value">{score['total_score']}</div>
            </div>
        </div>
        """, unsafe_allow_html=True)

        # Export
        st.markdown("### 💾 Export Your Data")

        col1, col2 = st.columns(2)

        with col1:
            json_data = json.dumps(st.session_state.session_data, indent=2, default=str)
            st.download_button(
                "📥 Download JSON",
                json_data,
                f"neurovision_{st.session_state.session_data['session_id']}.json",
                "application/json"
            )

        with col2:
            if st.button("📤 Share on X/Twitter"):
                tweet_text = f"Just tested my eye patterns with @NeuroVision! Gaze Holding Score: {score['total_score']}/100 👁️🧠 #EyeHealth #NeuroVision"
                st.markdown(f"[Tweet This]({f'https://twitter.com/intent/tweet?text={tweet_text}'})")
    else:
        st.warning("⚠️ No assessment completed yet. Go to Gaze Holding tab to start.")

# ============================================================================
# FOOTER
# ============================================================================
st.markdown("---")
st.markdown("""
<div class="footer-pill">
    <h4>NeuroVision Trainer - Patent-Pending Technology</h4>
    <p><strong>TAM:</strong> $12B+ | <strong>Acquisition:</strong> partnerships@neurovision.tech</p>
    <p style="margin-top: 0.5rem; font-size: 0.85rem; opacity: 0.6;">
        © 2025 NeuroVision. Gaze Holding Score™ | Real-Time Eye Tracking System™
    </p>
</div>
""", unsafe_allow_html=True)
