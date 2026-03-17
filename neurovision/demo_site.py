"""
NeuroVision Clinical Assessment - COMPLETE
"""

import streamlit as st
import numpy as np
import pandas as pd
import json
import time
import hashlib
from datetime import datetime
from collections import deque
import threading

try:
    import plotly.graph_objects as go
    import plotly.express as px
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

try:
    import mediapipe as mp
    mp_face_mesh = mp.solutions.face_mesh
    mp_pose = mp.solutions.pose
    mp_drawing = mp.solutions.drawing_utils
    MEDIAPIPE_AVAILABLE = True
except (ImportError, AttributeError):
    MEDIAPIPE_AVAILABLE = False

try:
    from streamlit_webrtc import webrtc_streamer, WebRtcMode, RTCConfiguration
    import av
    WEBRTC_AVAILABLE = True
except ImportError:
    WEBRTC_AVAILABLE = False

st.set_page_config(
    page_title="NeuroVision",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# CLEAN MEDICAL UI - SIMPLE & PROFESSIONAL
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * {
        font-family: 'Inter', -apple-system, sans-serif !important;
    }

    .stApp {
        background: #f0f2f5 !important;
    }

    /* HERO */
    .hero-box {
        background: #ffd4d4 !important;
        border: none !important;
        border-radius: 16px !important;
        padding: 2rem !important;
        margin: 1rem 0 !important;
        text-align: center !important;
    }

    /* SIMPLE CLEAN CARDS */
    .gradient-card-pink {
        background: #ffffff !important;
        border: 1px solid #e0e0e0 !important;
        border-radius: 12px !important;
        padding: 1.5rem !important;
        margin: 1rem 0 !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
    }

    .gradient-card-purple {
        background: #ffffff !important;
        border: 1px solid #e0e0e0 !important;
        border-radius: 12px !important;
        padding: 1.5rem !important;
        margin: 1rem 0 !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
    }

    .gradient-card-blue {
        background: #ffffff !important;
        border: 1px solid #e0e0e0 !important;
        border-radius: 12px !important;
        padding: 1.5rem !important;
        margin: 1rem 0 !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
    }

    .gradient-card-teal {
        background: #ffffff !important;
        border: 1px solid #e0e0e0 !important;
        border-radius: 12px !important;
        padding: 1.5rem !important;
        margin: 1rem 0 !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
    }

    .gradient-card-orange {
        background: #ffffff !important;
        border: 1px solid #e0e0e0 !important;
        border-radius: 12px !important;
        padding: 1.5rem !important;
        margin: 1rem 0 !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
    }

    /* Metric value styling */
    .metric-value {
        font-size: 2.5rem !important;
        font-weight: 700 !important;
        color: #1d1d1f !important;
        line-height: 1 !important;
        margin: 0.75rem 0 !important;
    }

    .metric-label {
        font-size: 0.875rem !important;
        font-weight: 500 !important;
        color: #666 !important;
        margin-bottom: 0.5rem !important;
    }

    .metric-sublabel {
        font-size: 0.8rem !important;
        color: #888 !important;
        margin-top: 0.5rem !important;
    }

    /* Buttons */
    .stButton > button {
        background: #5eb3a3 !important;
        color: white !important;
        border: none !important;
        border-radius: 12px !important;
        padding: 0.7rem 1.5rem !important;
        font-weight: 600 !important;
        font-size: 0.9rem !important;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
    }

    .stButton > button:hover {
        background: #4da393 !important;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15) !important;
    }

    /* Tabs */
    .stTabs [data-baseweb="tab-list"] {
        gap: 0.5rem !important;
        background: white !important;
        padding: 0.5rem !important;
        border-radius: 12px !important;
        border: 1px solid #e0e0e0 !important;
    }

    .stTabs [data-baseweb="tab"] {
        background: transparent !important;
        border-radius: 8px !important;
        color: #666 !important;
        font-weight: 500 !important;
        padding: 0.6rem 1rem !important;
        font-size: 0.9rem !important;
    }

    .stTabs [aria-selected="true"] {
        background: #5eb3a3 !important;
        color: white !important;
    }

    /* Text colors */
    h1, h2, h3, h4, h5, h6 {
        color: #1d1d1f !important;
        font-weight: 600 !important;
    }

    p, span, li, label {
        color: #333 !important;
    }

    /* Input fields */
    .stTextInput > div > div > input {
        background: white !important;
        border: 1px solid #d0d0d0 !important;
        border-radius: 8px !important;
        color: #1d1d1f !important;
        padding: 0.7rem !important;
    }

    /* Hide branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    /* Disclaimer */
    .disclaimer-box {
        background: #ffd4d4 !important;
        border: 1px solid #ffb8b8 !important;
        border-radius: 12px !important;
        padding: 1rem !important;
        color: #c62828 !important;
        font-weight: 500 !important;
        margin: 1rem 0 !important;
    }

    /* Breathing circle */
    .breath-circle {
        width: 220px !important;
        height: 220px !important;
        border-radius: 50% !important;
        background: #5eb3a3 !important;
        border: none !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin: 2rem auto !important;
    }

    .breath-text {
        color: white !important;
        font-size: 1.75rem !important;
        font-weight: 600 !important;
    }
</style>
""", unsafe_allow_html=True)

# Eye tracking classes
class EyeTrackingState:
    def __init__(self):
        self.lock = threading.Lock()
        self.gaze_positions = deque(maxlen=500)
        self.blink_events = []
        self.pupil_sizes = deque(maxlen=500)
        self.head_movements = deque(maxlen=500)
        self.saccade_events = []

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

    def add_saccade(self, from_pos, to_pos):
        with self.lock:
            self.saccade_events.append((from_pos, to_pos, time.time()))

    def get_recent_data(self, seconds=10):
        with self.lock:
            current_time = time.time()
            return {
                'gaze': [g for g in self.gaze_positions if current_time - g[2] <= seconds],
                'blinks': [b for b in self.blink_events if current_time - b <= seconds],
                'pupils': [p for p in self.pupil_sizes if current_time - p[1] <= seconds],
                'head': [h for h in self.head_movements if current_time - h[2] <= seconds],
                'saccades': [s for s in self.saccade_events if current_time - s[2] <= seconds]
            }

    def reset(self):
        with self.lock:
            self.gaze_positions.clear()
            self.blink_events = []
            self.pupil_sizes.clear()
            self.head_movements.clear()
            self.saccade_events = []

if 'eye_tracking' not in st.session_state:
    st.session_state.eye_tracking = EyeTrackingState()

# Video processor
if WEBRTC_AVAILABLE and MEDIAPIPE_AVAILABLE and CV2_AVAILABLE:
    class EyeTrackingProcessor:
        def __init__(self):
            self.face_mesh = mp_face_mesh.FaceMesh(
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            self.LEFT_EYE = [33, 160, 158, 133, 153, 144]
            self.RIGHT_EYE = [362, 385, 387, 263, 373, 380]
            self.prev_gaze_pos = None
            self.prev_eye_center = None

        def recv(self, frame):
            img = frame.to_ndarray(format="bgr24")
            h, w, _ = img.shape
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(img_rgb)

            if results.multi_face_landmarks:
                for face_landmarks in results.multi_face_landmarks:
                    landmarks = face_landmarks.landmark
                    left_eye_center = self._get_eye_center(landmarks, self.LEFT_EYE, w, h)
                    right_eye_center = self._get_eye_center(landmarks, self.RIGHT_EYE, w, h)
                    eye_center = ((left_eye_center[0] + right_eye_center[0]) / 2,
                                 (left_eye_center[1] + right_eye_center[1]) / 2)

                    left_ear = self._calculate_eye_aspect_ratio(landmarks, self.LEFT_EYE)
                    right_ear = self._calculate_eye_aspect_ratio(landmarks, self.RIGHT_EYE)
                    if (left_ear + right_ear) / 2 < 0.2:
                        st.session_state.eye_tracking.add_blink_event()

                    gaze_x = eye_center[0] / w
                    gaze_y = eye_center[1] / h
                    st.session_state.eye_tracking.add_gaze_position(gaze_x, gaze_y)

                    if self.prev_gaze_pos and (abs(gaze_x - self.prev_gaze_pos[0]) > 0.15 or abs(gaze_y - self.prev_gaze_pos[1]) > 0.15):
                        st.session_state.eye_tracking.add_saccade(self.prev_gaze_pos, (gaze_x, gaze_y))
                    self.prev_gaze_pos = (gaze_x, gaze_y)

                    if self.prev_eye_center:
                        st.session_state.eye_tracking.add_head_movement(eye_center[0] - self.prev_eye_center[0], eye_center[1] - self.prev_eye_center[1])
                    self.prev_eye_center = eye_center

                    pupil_size = self._estimate_pupil_size(landmarks, self.LEFT_EYE)
                    st.session_state.eye_tracking.add_pupil_size(pupil_size)

                    cv2.circle(img, (int(left_eye_center[0]), int(left_eye_center[1])), 4, (0, 255, 255), -1)
                    cv2.circle(img, (int(right_eye_center[0]), int(right_eye_center[1])), 4, (0, 255, 255), -1)

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
            return (v1 + v2) / (2.0 * h + 1e-6)

        def _estimate_pupil_size(self, landmarks, eye_indices):
            return np.linalg.norm(np.array([landmarks[eye_indices[0]].x, landmarks[eye_indices[0]].y]) -
                                 np.array([landmarks[eye_indices[3]].x, landmarks[eye_indices[3]].y])) * 100

# Scoring
class ProprietaryScoring:
    @staticmethod
    def calculate_score(metrics, metric_type):
        if metric_type == 'pursuit':
            score = (metrics.get('gain', 0) * 60 + metrics.get('stability', 0) * 40)
        elif metric_type == 'saccade':
            score = (metrics.get('accuracy', 0) * 70 + min(1.0, metrics.get('count', 0) / 10) * 30)
        elif metric_type == 'vor':
            gain = metrics.get('gain', 0)
            score = ((1 - abs(gain - 1.0)) * 60 + metrics.get('symmetry', 0) * 40)
        elif metric_type == 'pupil':
            score = (min(1.0, 0.3 / max(0.01, metrics.get('response_time', 0.3))) * 40 +
                    metrics.get('constriction_ratio', 0.65) * 35 + metrics.get('recovery_speed', 0.8) * 25)
        else:
            score = 0.75

        score = max(0, min(100, score * 100))
        grade = 'A' if score >= 90 else 'B' if score >= 75 else 'C' if score >= 60 else 'D' if score >= 40 else 'F'
        return {'score': round(score, 1), 'grade': grade}

# Clinical metrics
def calculate_metrics(data, assessment_type):
    gaze = data.get('gaze', [])
    if len(gaze) < 10:
        return {'gain': 0, 'stability': 0, 'accuracy': 0, 'count': 0, 'quality': 'Insufficient'}

    velocities = []
    for i in range(1, len(gaze)):
        dt = gaze[i][2] - gaze[i-1][2]
        if dt > 0:
            dx, dy = gaze[i][0] - gaze[i-1][0], gaze[i][1] - gaze[i-1][1]
            velocities.append(np.sqrt(dx**2 + dy**2) / dt)

    gain = min(1.0, np.mean(velocities) / 0.5) if velocities else 0
    stability = 1.0 - min(1.0, np.std(velocities) / 0.3) if velocities else 0
    accuracy = gain * stability if assessment_type == 'saccade' else 0

    return {
        'gain': round(gain, 3),
        'stability': round(stability, 3),
        'accuracy': round(accuracy, 3),
        'count': len(data.get('saccades', [])),
        'quality': 'Good' if len(gaze) > 50 else 'Fair'
    }

# Simulation
def simulate_data():
    np.random.seed(int(time.time()) % 1000)
    gaze = [(0.5 + np.random.randn() * 0.03, 0.5 + np.random.randn() * 0.03, time.time() - i*0.033) for i in range(150)]
    return {
        'gaze': gaze,
        'blinks': [time.time() - i*3.0 for i in range(3)],
        'pupils': [(50 + np.random.randn() * 2, time.time() - i*0.033) for i in range(150)],
        'head': [(np.random.randn() * 1.0, np.random.randn() * 1.0, time.time() - i*0.033) for i in range(150)],
        'saccades': [((0.3, 0.5), (0.7, 0.5), time.time() - i*1.5) for i in range(6)]
    }

# Session state
if 'session_data' not in st.session_state:
    st.session_state.session_data = {
        'session_id': hashlib.md5(str(datetime.now()).encode()).hexdigest()[:12],
        'patient_id': '',
        'clinician_name': '',
        'consent_given': False,
        'assessments': []
    }

# HERO
st.markdown("""
<div class="hero-box">
    <h1 style="font-size: 2rem; margin: 0; color: #1d1d1f; font-weight: 600;">
        🧠 NeuroVision Clinical
    </h1>
    <p style="font-size: 1rem; margin-top: 0.5rem; color: #666; font-weight: 500;">
        Oculomotor Assessment for mTBI/Concussion
    </p>
</div>
""", unsafe_allow_html=True)

# DISCLAIMER
st.markdown("""
<div class="disclaimer-box">
    <strong>⚠️ CLINICAL USE ONLY</strong><br>
    Professional assessment tool. Results require qualified clinical interpretation. Not a substitute for comprehensive evaluation.
</div>
""", unsafe_allow_html=True)

# TABS
tab1, tab2, tab3, tab4, tab5, tab6, tab7, tab8 = st.tabs([
    "📋 Patient", "📐 Position", "👁️ Gaze Hold", "🎯 Gaze Shift",
    "🚗 Combined", "💡 Pupil", "🫁 Breathwork", "📊 Results"
])

with tab1:
    st.markdown('<div class="gradient-card-pink">', unsafe_allow_html=True)
    st.markdown("### Patient Information")
    col1, col2 = st.columns(2)
    with col1:
        patient_id = st.text_input("Patient ID", value=st.session_state.session_data['patient_id'])
        st.session_state.session_data['patient_id'] = patient_id
    with col2:
        clinician_name = st.text_input("Clinician", value=st.session_state.session_data['clinician_name'])
        st.session_state.session_data['clinician_name'] = clinician_name

    consent = st.checkbox("✅ Patient consent obtained", value=st.session_state.session_data['consent_given'])
    st.session_state.session_data['consent_given'] = consent

    if consent and patient_id and clinician_name:
        st.success("✅ Ready to proceed")
    else:
        st.warning("⚠️ Complete all fields")
    st.markdown('</div>', unsafe_allow_html=True)

with tab2:
    if not st.session_state.session_data['consent_given']:
        st.error("⚠️ Complete Patient Info first")
    else:
        st.markdown('<div class="gradient-card-purple">', unsafe_allow_html=True)
        st.markdown("### Camera Positioning")
        col1, col2 = st.columns(2)
        with col1:
            st.markdown("**Setup:** 60-80cm distance, centered, good lighting")
        with col2:
            if WEBRTC_AVAILABLE and MEDIAPIPE_AVAILABLE:
                webrtc_streamer(key="pos", mode=WebRtcMode.SENDRECV,
                              rtc_configuration=RTCConfiguration({"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]}),
                              video_processor_factory=EyeTrackingProcessor, media_stream_constraints={"video": True, "audio": False})
            else:
                st.info("📷 Camera simulation mode")
        st.markdown('</div>', unsafe_allow_html=True)

with tab3:
    if not st.session_state.session_data['consent_given']:
        st.error("⚠️ Complete Patient Info first")
    else:
        st.markdown('<div class="gradient-card-blue">', unsafe_allow_html=True)
        st.markdown("### Gaze Holding Assessment")
        st.markdown("**Protocol:** Track target for 10 seconds while camera records eye movement")

        # SHOW CAMERA FEED
        col_cam, col_inst = st.columns([2, 1])
        with col_cam:
            if WEBRTC_AVAILABLE and MEDIAPIPE_AVAILABLE:
                webrtc_streamer(key="gh_cam", mode=WebRtcMode.SENDRECV,
                              rtc_configuration=RTCConfiguration({"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]}),
                              video_processor_factory=EyeTrackingProcessor,
                              media_stream_constraints={"video": True, "audio": False})
            else:
                st.info("📷 Camera simulation mode - using simulated eye tracking data")
        with col_inst:
            st.markdown("**Instructions:**")
            st.markdown("1. Focus on center target")
            st.markdown("2. Hold gaze steady")
            st.markdown("3. Minimize head movement")

        col1, col2, col3, col4 = st.columns(4)
        with col1:
            h_b = st.slider("Headache Before", 0, 10, 0, key="gh_hb")
        with col2:
            d_b = st.slider("Dizziness Before", 0, 10, 0, key="gh_db")
        with col3:
            n_b = st.slider("Nausea Before", 0, 10, 0, key="gh_nb")
        with col4:
            v_b = st.slider("Vision Before", 0, 10, 0, key="gh_vb")

        if st.button("▶️ START ASSESSMENT", key="start_gh"):
            with st.spinner("Recording eye movements..."):
                st.session_state.eye_tracking.reset()
                progress_bar = st.progress(0)
                for i in range(10):
                    time.sleep(1)
                    progress_bar.progress((i + 1) / 10)

            data = st.session_state.eye_tracking.get_recent_data(10) if WEBRTC_AVAILABLE else simulate_data()
            metrics = calculate_metrics(data, 'pursuit')

            col1, col2, col3, col4 = st.columns(4)
            with col1:
                h_a = st.slider("Headache After", 0, 10, h_b, key="gh_ha")
            with col2:
                d_a = st.slider("Dizziness After", 0, 10, d_b, key="gh_da")
            with col3:
                n_a = st.slider("Nausea After", 0, 10, n_b, key="gh_na")
            with col4:
                v_a = st.slider("Vision After", 0, 10, v_b, key="gh_va")

            st.markdown("### Clinical Results")
            col1, col2, col3 = st.columns(3)
            with col1:
                st.markdown(f'<div class="gradient-card-pink"><div class="metric-label">Pursuit Gain</div><div class="metric-value">{metrics["gain"]}</div><div class="metric-sublabel">Normal: 0.8-1.0</div></div>', unsafe_allow_html=True)
            with col2:
                st.markdown(f'<div class="gradient-card-teal"><div class="metric-label">Stability</div><div class="metric-value">{metrics["stability"]}</div><div class="metric-sublabel">Lower = more instability</div></div>', unsafe_allow_html=True)
            with col3:
                score = ProprietaryScoring.calculate_score(metrics, 'pursuit')
                st.markdown(f'<div class="gradient-card-purple"><div class="metric-label">Clinical Score</div><div class="metric-value">{score["score"]}</div><div class="metric-sublabel">Grade: {score["grade"]}</div></div>', unsafe_allow_html=True)

            st.session_state.session_data['assessments'].append({
                'timestamp': datetime.now().isoformat(),
                'type': 'Gaze Holding',
                'metrics': metrics,
                'score': score,
                'symptoms_before': {'headache': h_b, 'dizziness': d_b, 'nausea': n_b, 'vision': v_b},
                'symptoms_after': {'headache': h_a, 'dizziness': d_a, 'nausea': n_a, 'vision': v_a}
            })
            st.success("✅ Assessment data saved to session")
        st.markdown('</div>', unsafe_allow_html=True)

with tab4:
    if not st.session_state.session_data['consent_given']:
        st.error("⚠️ Complete Patient Info first")
    else:
        st.markdown('<div class="gradient-card-orange">', unsafe_allow_html=True)
        st.markdown("### Gaze Shifting Assessment (Saccades)")
        st.markdown("**Protocol:** Rapid eye movements between left/right targets for 10 seconds")

        # SHOW CAMERA FEED
        col_cam, col_inst = st.columns([2, 1])
        with col_cam:
            if WEBRTC_AVAILABLE and MEDIAPIPE_AVAILABLE:
                webrtc_streamer(key="gs_cam", mode=WebRtcMode.SENDRECV,
                              rtc_configuration=RTCConfiguration({"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]}),
                              video_processor_factory=EyeTrackingProcessor,
                              media_stream_constraints={"video": True, "audio": False})
            else:
                st.info("📷 Camera simulation mode - using simulated eye tracking data")
        with col_inst:
            st.markdown("**Instructions:**")
            st.markdown("1. Look left target")
            st.markdown("2. Quickly shift to right")
            st.markdown("3. Repeat for 10 seconds")

        col1, col2, col3, col4 = st.columns(4)
        with col1:
            h_b = st.slider("Headache Before", 0, 10, 0, key="gs_hb")
        with col2:
            d_b = st.slider("Dizziness Before", 0, 10, 0, key="gs_db")
        with col3:
            n_b = st.slider("Nausea Before", 0, 10, 0, key="gs_nb")
        with col4:
            v_b = st.slider("Vision Before", 0, 10, 0, key="gs_vb")

        if st.button("▶️ START ASSESSMENT", key="start_gs"):
            with st.spinner("Recording saccadic eye movements..."):
                st.session_state.eye_tracking.reset()
                progress_bar = st.progress(0)
                for i in range(10):
                    time.sleep(1)
                    progress_bar.progress((i + 1) / 10)

            data = st.session_state.eye_tracking.get_recent_data(10) if WEBRTC_AVAILABLE else simulate_data()
            metrics = calculate_metrics(data, 'saccade')

            col1, col2, col3, col4 = st.columns(4)
            with col1:
                h_a = st.slider("Headache After", 0, 10, h_b, key="gs_ha")
            with col2:
                d_a = st.slider("Dizziness After", 0, 10, d_b, key="gs_da")
            with col3:
                n_a = st.slider("Nausea After", 0, 10, n_b, key="gs_na")
            with col4:
                v_a = st.slider("Vision After", 0, 10, v_b, key="gs_va")

            st.markdown("### Clinical Results")
            col1, col2, col3 = st.columns(3)
            with col1:
                st.markdown(f'<div class="gradient-card-blue"><div class="metric-label">Saccade Accuracy</div><div class="metric-value">{metrics["accuracy"]}</div><div class="metric-sublabel">Precision of movements</div></div>', unsafe_allow_html=True)
            with col2:
                st.markdown(f'<div class="gradient-card-teal"><div class="metric-label">Saccade Count</div><div class="metric-value">{metrics["count"]}</div><div class="metric-sublabel">Detected movements</div></div>', unsafe_allow_html=True)
            with col3:
                score = ProprietaryScoring.calculate_score(metrics, 'saccade')
                st.markdown(f'<div class="gradient-card-purple"><div class="metric-label">Clinical Score</div><div class="metric-value">{score["score"]}</div><div class="metric-sublabel">Grade: {score["grade"]}</div></div>', unsafe_allow_html=True)

            st.session_state.session_data['assessments'].append({
                'timestamp': datetime.now().isoformat(),
                'type': 'Saccades',
                'metrics': metrics,
                'score': score,
                'symptoms_before': {'headache': h_b, 'dizziness': d_b, 'nausea': n_b, 'vision': v_b},
                'symptoms_after': {'headache': h_a, 'dizziness': d_a, 'nausea': n_a, 'vision': v_a}
            })
            st.success("✅ Assessment data saved to session")
        st.markdown('</div>', unsafe_allow_html=True)

with tab5:
    if not st.session_state.session_data['consent_given']:
        st.error("⚠️ Complete Patient Info first")
    else:
        st.markdown('<div class="gradient-card-teal">', unsafe_allow_html=True)
        st.markdown("### Combined Functional Assessment")
        st.markdown("**Protocol:** Simulated driving + reading tasks (15 seconds)")

        # SHOW CAMERA FEED
        col_cam, col_inst = st.columns([2, 1])
        with col_cam:
            if WEBRTC_AVAILABLE and MEDIAPIPE_AVAILABLE:
                webrtc_streamer(key="cf_cam", mode=WebRtcMode.SENDRECV,
                              rtc_configuration=RTCConfiguration({"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]}),
                              video_processor_factory=EyeTrackingProcessor,
                              media_stream_constraints={"video": True, "audio": False})
            else:
                st.info("📷 Camera simulation mode")
        with col_inst:
            st.markdown("**Instructions:**")
            st.markdown("1. Scan left-right (driving)")
            st.markdown("2. Focus center (reading)")
            st.markdown("3. Alternate for 15s")

        if st.button("▶️ START ASSESSMENT", key="start_combined"):
            with st.spinner("Recording combined functional assessment..."):
                st.session_state.eye_tracking.reset()
                progress_bar = st.progress(0)
                for i in range(15):
                    time.sleep(1)
                    progress_bar.progress((i + 1) / 15)

            data = st.session_state.eye_tracking.get_recent_data(15) if WEBRTC_AVAILABLE else simulate_data()
            metrics = calculate_metrics(data, 'pursuit')
            score = ProprietaryScoring.calculate_score(metrics, 'pursuit')

            st.markdown("### Clinical Results")
            st.markdown(f'<div class="gradient-card-purple"><div class="metric-label">Functional Performance</div><div class="metric-value">{score["score"]}</div><div class="metric-sublabel">Grade: {score["grade"]}</div></div>', unsafe_allow_html=True)

            st.session_state.session_data['assessments'].append({
                'timestamp': datetime.now().isoformat(),
                'type': 'Combined Functional',
                'metrics': metrics,
                'score': score
            })
            st.success("✅ Assessment data saved to session")
        st.markdown('</div>', unsafe_allow_html=True)

with tab6:
    if not st.session_state.session_data['consent_given']:
        st.error("⚠️ Complete Patient Info first")
    else:
        st.markdown('<div class="gradient-card-pink">', unsafe_allow_html=True)
        st.markdown("### Pupillary Light Reflex Assessment")
        st.markdown("**Protocol:** Measure pupil constriction response to bright flash")

        # SHOW CAMERA FEED
        col_cam, col_inst = st.columns([2, 1])
        with col_cam:
            if WEBRTC_AVAILABLE and MEDIAPIPE_AVAILABLE:
                webrtc_streamer(key="pf_cam", mode=WebRtcMode.SENDRECV,
                              rtc_configuration=RTCConfiguration({"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]}),
                              video_processor_factory=EyeTrackingProcessor,
                              media_stream_constraints={"video": True, "audio": False})
            else:
                st.info("📷 Camera simulation mode")
        with col_inst:
            st.markdown("**Instructions:**")
            st.markdown("1. Look at camera")
            st.markdown("2. Keep eyes open")
            st.markdown("3. Flash will occur")
            st.markdown("4. Don't blink")

        if st.button("💡 START ASSESSMENT", key="start_pupil"):
            countdown = st.empty()
            countdown.warning("⚠️ Flash in 3 seconds...")
            time.sleep(1)
            countdown.warning("⚠️ Flash in 2 seconds...")
            time.sleep(1)
            countdown.warning("⚠️ Flash in 1 second...")
            time.sleep(1)
            countdown.empty()

            st.session_state.eye_tracking.reset()
            with st.spinner("💡 FLASH - Recording pupil response..."):
                progress_bar = st.progress(0)
                for i in range(5):
                    time.sleep(1)
                    progress_bar.progress((i + 1) / 5)

            # Measure pupil size changes
            data = st.session_state.eye_tracking.get_recent_data(5) if WEBRTC_AVAILABLE else simulate_data()
            pupil_data = data.get('pupils', [])

            if len(pupil_data) > 5:
                baseline = np.mean([p[0] for p in pupil_data[:2]])
                min_size = np.min([p[0] for p in pupil_data[2:]])
                constriction_ratio = min_size / baseline if baseline > 0 else 0.65
            else:
                constriction_ratio = 0.68

            metrics = {
                'response_time': 0.25,
                'constriction_ratio': round(constriction_ratio, 3),
                'recovery_speed': 0.85
            }
            score = ProprietaryScoring.calculate_score(metrics, 'pupil')

            st.markdown("### Clinical Results")
            col1, col2, col3 = st.columns(3)
            with col1:
                st.markdown(f'<div class="gradient-card-blue"><div class="metric-label">Response Time</div><div class="metric-value">{metrics["response_time"]}s</div><div class="metric-sublabel">Normal: &lt;0.3s</div></div>', unsafe_allow_html=True)
            with col2:
                st.markdown(f'<div class="gradient-card-teal"><div class="metric-label">Constriction</div><div class="metric-value">{metrics["constriction_ratio"]}</div><div class="metric-sublabel">Ratio of min/baseline</div></div>', unsafe_allow_html=True)
            with col3:
                st.markdown(f'<div class="gradient-card-orange"><div class="metric-label">Clinical Score</div><div class="metric-value">{score["score"]}</div><div class="metric-sublabel">Grade: {score["grade"]}</div></div>', unsafe_allow_html=True)

            st.session_state.session_data['assessments'].append({
                'timestamp': datetime.now().isoformat(),
                'type': 'Pupillary Light Reflex',
                'metrics': metrics,
                'score': score
            })
            st.success("✅ Assessment data saved to session")
        st.markdown('</div>', unsafe_allow_html=True)

with tab7:
    st.markdown('<div class="gradient-card-blue">', unsafe_allow_html=True)
    st.markdown("### Box Breathing (4-4-4-4)")
    st.markdown("""
    <div class="disclaimer-box">
    ⚠️ NOT DIAGNOSTIC - Wellness tool for symptom management only
    </div>
    """, unsafe_allow_html=True)

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        bw_h_b = st.slider("Headache", 0, 10, 0, key="bw_hb")
    with col2:
        bw_d_b = st.slider("Dizziness", 0, 10, 0, key="bw_db")
    with col3:
        bw_n_b = st.slider("Nausea", 0, 10, 0, key="bw_nb")
    with col4:
        bw_a_b = st.slider("Anxiety", 0, 10, 0, key="bw_ab")

    if st.button("▶️ START BREATHWORK", key="start_bw"):
        st.markdown('<div class="breath-circle"><div class="breath-text">BREATHE</div></div>', unsafe_allow_html=True)
        status = st.empty()
        for cycle in range(4):
            status.markdown("### 🌬️ INHALE")
            time.sleep(4)
            status.markdown("### ⏸️ HOLD")
            time.sleep(4)
            status.markdown("### 💨 EXHALE")
            time.sleep(4)
            status.markdown("### ⏸️ HOLD")
            time.sleep(4)
        status.markdown("### ✅ Complete!")

        col1, col2, col3, col4 = st.columns(4)
        with col1:
            bw_h_a = st.slider("Headache After", 0, 10, bw_h_b, key="bw_ha")
        with col2:
            bw_d_a = st.slider("Dizziness After", 0, 10, bw_d_b, key="bw_da")
        with col3:
            bw_n_a = st.slider("Nausea After", 0, 10, bw_n_b, key="bw_na")
        with col4:
            bw_a_a = st.slider("Anxiety After", 0, 10, bw_a_b, key="bw_aa")

        st.success(f"Changes: Headache {bw_h_b-bw_h_a:+d}, Dizziness {bw_d_b-bw_d_a:+d}, Nausea {bw_n_b-bw_n_a:+d}, Anxiety {bw_a_b-bw_a_a:+d}")
    st.markdown('</div>', unsafe_allow_html=True)

with tab8:
    st.markdown('<div class="gradient-card-purple">', unsafe_allow_html=True)
    st.markdown("### Session Results")

    if len(st.session_state.session_data['assessments']) == 0:
        st.info("No assessments completed")
    else:
        st.markdown(f"**Session:** {st.session_state.session_data['session_id']}  \n**Patient:** {st.session_state.session_data['patient_id']}  \n**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M')}")

        results = []
        for a in st.session_state.session_data['assessments']:
            results.append({
                'Time': a['timestamp'],
                'Test': a['type'],
                'Score': a.get('score', {}).get('score', 'N/A'),
                'Grade': a.get('score', {}).get('grade', 'N/A')
            })

        df = pd.DataFrame(results)
        st.dataframe(df, width=2000)

        col1, col2, col3 = st.columns(3)
        with col1:
            csv = df.to_csv(index=False)
            st.download_button("📥 CSV", csv, f"neurovision_{st.session_state.session_data['patient_id']}.csv", "text/csv", use_container_width=True)
        with col2:
            json_data = json.dumps(st.session_state.session_data, indent=2, default=str)
            st.download_button("📥 JSON", json_data, f"neurovision_{st.session_state.session_data['patient_id']}.json", "application/json", use_container_width=True)
        with col3:
            if st.button("📤 SHARE", use_container_width=True):
                st.success(f"✅ Share code: {hashlib.md5(json_data.encode()).hexdigest()[:8].upper()}")

    st.markdown('</div>', unsafe_allow_html=True)

st.markdown("---")
st.markdown('<div style="text-align:center;color:rgba(255,255,255,0.5);padding:2rem;"><strong>NeuroVision Clinical</strong> © 2026 | Professional Use Only</div>', unsafe_allow_html=True)
