"""
NeuroVision Trainer - Glassmorphic Design (Matching Reference Image)
=====================================================================

© 2025 NeuroVision - Patent-Pending Algorithms
"""

import streamlit as st
import numpy as np
import pandas as pd
import plotly.graph_objects as go
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
    page_title="NeuroVision Trainer",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ============================================================================
# GLASSMORPHIC CSS - EXACT MATCH TO REFERENCE IMAGE
# ============================================================================
st.markdown("""
<style>
    /* Import Inter Font */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

    * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Pure Black Background */
    .main {
        background: #000000;
        position: relative;
        overflow: hidden;
    }

    /* Blurred Background Effect (like reference image) */
    .main::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background:
            radial-gradient(circle at 30% 40%, rgba(100, 200, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(255, 100, 150, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(150, 100, 255, 0.12) 0%, transparent 50%);
        filter: blur(80px);
        z-index: 0;
        opacity: 0.6;
    }

    /* Glass Card - EXACT MATCH TO REFERENCE */
    .glass-card {
        backdrop-filter: blur(40px) saturate(180%);
        -webkit-backdrop-filter: blur(40px) saturate(180%);
        background: rgba(255, 255, 255, 0.08);
        border-radius: 28px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 1.8rem 2rem;
        margin: 1rem 0;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
        position: relative;
        z-index: 1;
    }

    /* Large Card (like Average Glucose card) */
    .glass-card-large {
        backdrop-filter: blur(40px) saturate(180%);
        -webkit-backdrop-filter: blur(40px) saturate(180%);
        background: linear-gradient(135deg, rgba(255, 150, 150, 0.25), rgba(200, 130, 150, 0.25));
        border-radius: 32px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        padding: 2.5rem 2.5rem;
        margin: 1.5rem 0;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
        position: relative;
        z-index: 1;
    }

    /* Medium Cards with Gradients (like Time in range, Variability) */
    .glass-card-green {
        backdrop-filter: blur(40px) saturate(180%);
        -webkit-backdrop-filter: blur(40px) saturate(180%);
        background: linear-gradient(135deg, rgba(80, 140, 120, 0.4), rgba(60, 100, 90, 0.4));
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 2rem 2rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        position: relative;
        z-index: 1;
    }

    .glass-card-pink {
        backdrop-filter: blur(40px) saturate(180%);
        -webkit-backdrop-filter: blur(40px) saturate(180%);
        background: linear-gradient(135deg, rgba(200, 120, 180, 0.35), rgba(180, 100, 160, 0.35));
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 2rem 2rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        position: relative;
        z-index: 1;
    }

    .glass-card-blue {
        backdrop-filter: blur(40px) saturate(180%);
        -webkit-backdrop-filter: blur(40px) saturate(180%);
        background: linear-gradient(135deg, rgba(50, 80, 140, 0.5), rgba(40, 60, 100, 0.5));
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 2rem 2rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        position: relative;
        z-index: 1;
    }

    .glass-card-orange {
        backdrop-filter: blur(40px) saturate(180%);
        -webkit-backdrop-filter: blur(40px) saturate(180%);
        background: linear-gradient(135deg, rgba(200, 100, 60, 0.4), rgba(100, 80, 140, 0.4));
        border-radius: 24px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 2rem 2rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        position: relative;
        z-index: 1;
    }

    /* Typography - Match Reference Image */
    .card-label {
        color: rgba(255, 255, 255, 0.85);
        font-size: 0.95rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
        letter-spacing: 0.3px;
    }

    .card-value-huge {
        color: white;
        font-size: 4rem;
        font-weight: 800;
        line-height: 1;
        margin: 0.5rem 0;
    }

    .card-value-large {
        color: white;
        font-size: 3rem;
        font-weight: 800;
        line-height: 1;
        margin: 0.5rem 0;
    }

    .card-unit {
        color: rgba(255, 255, 255, 0.7);
        font-size: 1.1rem;
        font-weight: 500;
        margin-left: 0.5rem;
    }

    .card-subtitle {
        color: rgba(255, 255, 255, 0.75);
        font-size: 1rem;
        font-weight: 600;
        margin-top: 0.5rem;
    }

    /* Buttons - Glassmorphic Style */
    .stButton > button {
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        background: rgba(255, 255, 255, 0.12) !important;
        color: white !important;
        font-weight: 700 !important;
        font-size: 1rem !important;
        padding: 1rem 2rem !important;
        border-radius: 20px !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35) !important;
        transition: all 0.3s ease !important;
    }

    .stButton > button:hover {
        background: rgba(255, 255, 255, 0.18) !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45) !important;
        transform: translateY(-2px) !important;
    }

    /* Tabs - Glassmorphic */
    .stTabs [data-baseweb="tab-list"] {
        gap: 0.8rem;
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        background: rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        padding: 0.6rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .stTabs [data-baseweb="tab"] {
        background: transparent;
        border-radius: 16px;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 600;
        padding: 0.8rem 1.5rem;
        border: 1px solid transparent;
    }

    .stTabs [aria-selected="true"] {
        background: rgba(255, 255, 255, 0.15) !important;
        color: white !important;
        border-color: rgba(255, 255, 255, 0.25) !important;
    }

    /* Sliders */
    .stSlider > div > div > div {
        background: linear-gradient(90deg, #32cd32, #ffa500, #ff6b6b) !important;
    }

    /* Text Colors */
    p, span, li {
        color: rgba(255, 255, 255, 0.85);
    }

    h1, h2, h3, h4, h5, h6 {
        color: white;
        font-weight: 700;
    }

    /* Hide Streamlit Branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    /* Disclaimer - Small Glass Card */
    .disclaimer-small {
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        background: rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 1rem 1.5rem;
        margin: 1rem 0;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.85rem;
    }
</style>
""", unsafe_allow_html=True)

# ============================================================================
# CLINICAL RESOURCES
# ============================================================================
CLINICAL_RESOURCES = {
    'concussion_australia': 'https://concussion.org.au',
    'emergency': '000'
}

# ============================================================================
# GLOBAL STATE FOR CAMERA TRACKING
# ============================================================================
class EyeTrackingState:
    def __init__(self):
        self.lock = threading.Lock()
        self.gaze_positions = deque(maxlen=300)
        self.blink_events = []
        self.pupil_sizes = deque(maxlen=300)
        self.head_movements = deque(maxlen=300)

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

if 'eye_tracking' not in st.session_state:
    st.session_state.eye_tracking = EyeTrackingState()

# ============================================================================
# EYE TRACKING VIDEO PROCESSOR
# ============================================================================
class EyeTrackingProcessor:
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
        self.LEFT_EYE = [33, 160, 158, 133, 153, 144]
        self.RIGHT_EYE = [362, 385, 387, 263, 373, 380]

    def recv(self, frame):
        img = frame.to_ndarray(format="bgr24")
        if not MEDIAPIPE_AVAILABLE or self.face_mesh is None:
            cv2.putText(img, "MediaPipe not available", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
            return av.VideoFrame.from_ndarray(img, format="bgr24")

        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(img_rgb)

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                mp_drawing.draw_landmarks(
                    image=img,
                    landmark_list=face_landmarks,
                    connections=mp_face_mesh.FACEMESH_TESSELATION,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style()
                )

                h, w, _ = img.shape
                landmarks = face_landmarks.landmark

                left_eye_center = self._get_eye_center(landmarks, self.LEFT_EYE, w, h)
                right_eye_center = self._get_eye_center(landmarks, self.RIGHT_EYE, w, h)
                eye_center = ((left_eye_center[0] + right_eye_center[0]) / 2,
                             (left_eye_center[1] + right_eye_center[1]) / 2)

                left_ear = self._calculate_eye_aspect_ratio(landmarks, self.LEFT_EYE)
                right_ear = self._calculate_eye_aspect_ratio(landmarks, self.RIGHT_EYE)
                avg_ear = (left_ear + right_ear) / 2.0

                if avg_ear < 0.2:
                    st.session_state.eye_tracking.add_blink_event()

                gaze_x = eye_center[0] / w
                gaze_y = eye_center[1] / h
                st.session_state.eye_tracking.add_gaze_position(gaze_x, gaze_y)

                if self.prev_eye_center is not None:
                    dx = eye_center[0] - self.prev_eye_center[0]
                    dy = eye_center[1] - self.prev_eye_center[1]
                    st.session_state.eye_tracking.add_head_movement(dx, dy)

                self.prev_eye_center = eye_center

        return av.VideoFrame.from_ndarray(img, format="bgr24")

    def _get_eye_center(self, landmarks, eye_indices, w, h):
        x_coords = [landmarks[i].x * w for i in eye_indices]
        y_coords = [landmarks[i].y * h for i in eye_indices]
        return (np.mean(x_coords), np.mean(y_coords))

    def _calculate_eye_aspect_ratio(self, landmarks, eye_indices):
        v1 = np.linalg.norm(np.array([landmarks[eye_indices[1]].x, landmarks[eye_indices[1]].y]) -
                            np.array([landmarks[eye_indices[5]].x, landmarks[eye_indices[5]].y]))
        v2 = np.linalg.norm(np.array([landmarks[eye_indices[2]].x, landmarks[eye_indices[2]].y]) -
                            np.array([landmarks[eye_indices[4]].x, landmarks[eye_indices[4]].y]))
        h = np.linalg.norm(np.array([landmarks[eye_indices[0]].x, landmarks[eye_indices[0]].y]) -
                          np.array([landmarks[eye_indices[3]].x, landmarks[eye_indices[3]].y]))
        ear = (v1 + v2) / (2.0 * h)
        return ear

# ============================================================================
# PROPRIETARY ALGORITHMS
# ============================================================================
class ProprietaryMetrics:
    @staticmethod
    def calculate_gaze_holding_score_from_tracking(tracking_data: dict) -> dict:
        gaze_positions = tracking_data['gaze']
        blinks = tracking_data['blinks']

        if len(gaze_positions) < 10:
            return {
                'total_score': 0,
                'pursuit_score': 0,
                'fixation_score': 0,
                'blink_rate': 0,
                'interpretation': 'Insufficient Data',
                'clinical_interpretation': 'Not enough tracking data collected.',
            }

        gaze_deltas = []
        for i in range(1, len(gaze_positions)):
            dx = gaze_positions[i][0] - gaze_positions[i-1][0]
            dy = gaze_positions[i][1] - gaze_positions[i-1][1]
            delta = np.sqrt(dx**2 + dy**2)
            gaze_deltas.append(delta)

        smoothness = 1.0 - min(1.0, np.std(gaze_deltas) * 10) if len(gaze_deltas) > 0 else 0.5
        pursuit_gain = smoothness

        gaze_x = [g[0] for g in gaze_positions]
        gaze_y = [g[1] for g in gaze_positions]
        fixation_drift = np.std(gaze_x) + np.std(gaze_y) if len(gaze_positions) > 0 else 1.0

        blink_rate = len(blinks) / 10.0

        pursuit_score = min(100, pursuit_gain * 100)
        fixation_score = max(0, 100 - (fixation_drift * 50))

        total_score = (pursuit_score * 0.5 + fixation_score * 0.5)
        total_score = max(0, min(100, total_score))

        if total_score >= 75:
            interpretation = 'Good'
        elif total_score >= 50:
            interpretation = 'Fair'
        else:
            interpretation = 'Poor'

        return {
            'total_score': round(total_score, 1),
            'pursuit_score': round(pursuit_score, 1),
            'fixation_score': round(fixation_score, 1),
            'blink_rate': round(blink_rate, 2),
            'interpretation': interpretation,
            'clinical_interpretation': 'Eye tracking assessment complete.',
        }

# ============================================================================
# SESSION STATE
# ============================================================================
if 'session_data' not in st.session_state:
    st.session_state.session_data = {
        'session_id': hashlib.md5(str(datetime.now()).encode()).hexdigest()[:12],
        'consent_given': False,
        'scores': {}
    }

# ============================================================================
# MAIN APP
# ============================================================================

# Tabs
tab1, tab2, tab3 = st.tabs(["🏠 Start", "👁️ Gaze Holding", "📊 Results"])

# TAB 1: START
with tab1:
    st.markdown('''
    <div class="glass-card-large">
        <div class="card-label">NeuroVision Trainer</div>
        <div class="card-value-huge">Feel Off?</div>
        <div class="card-subtitle">Explore Your Eye Patterns in 2 Minutes</div>
    </div>
    ''', unsafe_allow_html=True)

    st.markdown('<div class="disclaimer-small">⚠️ Wellness tool only. Not diagnostic. Emergency: 000</div>', unsafe_allow_html=True)

    consent = st.checkbox("I consent to start", value=st.session_state.session_data['consent_given'])
    st.session_state.session_data['consent_given'] = consent

    if consent:
        st.success("✅ Go to Gaze Holding tab")

# TAB 2: GAZE HOLDING
with tab2:
    if not st.session_state.session_data['consent_given']:
        st.error("⚠️ Accept consent on Start tab first")
        st.stop()

    st.markdown('''
    <div class="glass-card-large">
        <div class="card-label">Gaze Holding Assessment</div>
        <div class="card-value-large">10-Second Test</div>
    </div>
    ''', unsafe_allow_html=True)

    st.markdown("### 📊 Rate Your Symptoms (Before Test)")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("**Headache**")
        headache_before = st.slider("", 0, 10, 0, key="head_before", label_visibility="collapsed")

    with col2:
        st.markdown("**Dizziness**")
        dizziness_before = st.slider("", 0, 10, 0, key="dizzy_before", label_visibility="collapsed")

    st.markdown("### 📷 Camera")
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

    if st.button("▶️ Start 10-Second Test"):
        if webrtc_ctx.video_processor:
            st.session_state.eye_tracking.reset()
            progress_bar = st.progress(0)
            for i in range(10):
                time.sleep(1)
                progress_bar.progress((i + 1) / 10)

            tracking_data = st.session_state.eye_tracking.get_recent_data(seconds=10)
            score = ProprietaryMetrics.calculate_gaze_holding_score_from_tracking(tracking_data)
            st.session_state.session_data['scores']['gaze_holding'] = score

            st.markdown(f'''
            <div class="glass-card-large">
                <div class="card-label">Gaze Holding Score</div>
                <div class="card-value-huge">{score["total_score"]}</div>
                <div class="card-subtitle">{score["interpretation"]}</div>
            </div>
            ''', unsafe_allow_html=True)

            col1, col2 = st.columns(2)
            with col1:
                st.markdown(f'''
                <div class="glass-card-blue">
                    <div class="card-label">Pursuit</div>
                    <div class="card-value-large">{score["pursuit_score"]}</div>
                </div>
                ''', unsafe_allow_html=True)

            with col2:
                st.markdown(f'''
                <div class="glass-card-orange">
                    <div class="card-label">Blink Rate</div>
                    <div class="card-value-large">{score["blink_rate"]}<span class="card-unit">/s</span></div>
                </div>
                ''', unsafe_allow_html=True)

# TAB 3: RESULTS
with tab3:
    if 'gaze_holding' in st.session_state.session_data['scores']:
        score = st.session_state.session_data['scores']['gaze_holding']

        st.markdown(f'''
        <div class="glass-card-large">
            <div class="card-label">Your Results</div>
            <div class="card-value-huge">{score["total_score"]}</div>
            <div class="card-subtitle">{score["interpretation"]}</div>
        </div>
        ''', unsafe_allow_html=True)

        json_data = json.dumps(st.session_state.session_data, indent=2, default=str)
        st.download_button("📥 Download Results", json_data, f"neurovision_{st.session_state.session_data['session_id']}.json", "application/json")
    else:
        st.warning("⚠️ No assessment completed yet")
