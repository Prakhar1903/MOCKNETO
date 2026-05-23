import { useState, useEffect, useRef, useCallback } from "react";
import {
  FaceLandmarker,
  PoseLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

// MediaPipe Face Mesh landmark indices for iris centers
// Left iris center: 468, Right iris center: 473
const LEFT_IRIS_CENTER = 468;
const RIGHT_IRIS_CENTER = 473;

// Outer corners of eyes for calibration reference
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;

export const useMediaPipeAnalysis = (videoRef) => {
  const [isReady, setIsReady] = useState(false);
  const [metrics, setMetrics] = useState({
    confidenceScore: 0,
    sentiment: "neutral",       // "happy" | "stressed" | "neutral"
    gazeZone: "camera",         // "camera" | "bottom" | "left" | "right"
    eyeContactPct: 100,         // rolling % of time looking at camera
    headPose: { yaw: 0, pitch: 0, roll: 0 },
    isSlouching: false,
    isFidgeting: false,
    lowEyeContactFlag: false,   // true if bottom-zone gaze > 3s continuous
  });

  const faceLandmarkerRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const isRunningRef = useRef(false);
  const sessionLogRef = useRef([]);
  const lastVideoTimeRef = useRef(-1);
  const frameCountRef = useRef(0);

  // Posture tracking
  const baselineShoulderYRef = useRef(null);
  const baselineShoulderCalibFramesRef = useRef(0);

  // Fidget tracking: store recent wrist positions with timestamps for jitter
  const wristHistoryRef = useRef([]); // [{ t, lx, ly, rx, ry }]

  // Gaze tracking for eye-contact %
  const gazeHistoryRef = useRef([]);  // rolling last 60 entries (1s each)
  const continuousGazeAwayRef = useRef(0); // seconds continuously away from camera

  useEffect(() => {
    let isMounted = true;
    const initializeModels = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          runningMode: "VIDEO",
          numFaces: 1,
        });

        poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });

        if (isMounted) setIsReady(true);
      } catch (error) {
        console.error("MediaPipe init error:", error);
      }
    };

    initializeModels();

    return () => {
      isMounted = false;
      if (faceLandmarkerRef.current) faceLandmarkerRef.current.close();
      if (poseLandmarkerRef.current) poseLandmarkerRef.current.close();
    };
  }, []);

  const analyzeFrame = useCallback(() => {
    if (!isRunningRef.current || !videoRef.current || !isReady) return;

    const video = videoRef.current;
    if (video.readyState < 2) {
      requestAnimationFrame(analyzeFrame);
      return;
    }

    const startTimeMs = performance.now();

    if (lastVideoTimeRef.current !== video.currentTime) {
      lastVideoTimeRef.current = video.currentTime;
      frameCountRef.current += 1;

      const newMetrics = {};
      let updated = false;

      // ─── FACE ANALYSIS (every frame) ─────────────────────────────────────
      if (faceLandmarkerRef.current) {
        const faceResults = faceLandmarkerRef.current.detectForVideo(video, startTimeMs);

        if (faceResults.faceLandmarks && faceResults.faceLandmarks.length > 0) {
          const landmarks = faceResults.faceLandmarks[0];

          // ── 1. PRECISE IRIS-BASED GAZE TRACKING ──────────────────────────
          // MediaPipe Face Mesh provides iris landmarks at indices 468-477
          // We compute iris position relative to the eye corners to determine gaze direction.
          const leftIris = landmarks[LEFT_IRIS_CENTER];
          const rightIris = landmarks[RIGHT_IRIS_CENTER];
          const leftEyeOuter = landmarks[LEFT_EYE_OUTER];
          const rightEyeOuter = landmarks[RIGHT_EYE_OUTER];

          if (leftIris && rightIris) {
            // Average iris center in normalized [0,1] screen space
            const irisCenterX = (leftIris.x + rightIris.x) / 2;
            const irisCenterY = (leftIris.y + rightIris.y) / 2;

            // Compute lateral offset of iris from eye-corner midpoint
            const eyeMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
            const lateralOffset = irisCenterX - eyeMidX;

            // Classify gaze zone
            // Bottom 30%: irisCenterY > 0.55 (face fills ~top 80% of frame)
            // Left/Right: lateral offset threshold
            let gazeZone = "camera";
            if (irisCenterY > 0.60) {
              gazeZone = "bottom";  // Looking at notes / own image / desk
            } else if (lateralOffset < -0.04) {
              gazeZone = "left";
            } else if (lateralOffset > 0.04) {
              gazeZone = "right";
            }

            newMetrics.gazeZone = gazeZone;

            // Track continuous away time
            if (gazeZone !== "camera") {
              continuousGazeAwayRef.current += (1 / 30); // approx 1/fps
            } else {
              continuousGazeAwayRef.current = 0;
            }
            newMetrics.lowEyeContactFlag = continuousGazeAwayRef.current > 3;
            updated = true;
          }
        }

        // ── 2. BLENDSHAPE-BASED SENTIMENT ────────────────────────────────
        if (faceResults.faceBlendshapes && faceResults.faceBlendshapes.length > 0) {
          const bs = faceResults.faceBlendshapes[0].categories;
          const get = (name) => bs.find((b) => b.categoryName === name)?.score || 0;

          const smileL = get("mouthSmileLeft");
          const smileR = get("mouthSmileRight");
          const browDownL = get("browDownLeft");
          const browDownR = get("browDownRight");
          const browInnerUp = get("browInnerUp");
          const jawOpen = get("jawOpen");

          // Confidence: smile + brow raise + slight jaw (engaged speaking)
          const engagementRaw = ((smileL + smileR) / 2) * 0.45
            + browInnerUp * 0.25
            + jawOpen * 0.1;
          const confidenceScore = Math.min(1, 0.3 + engagementRaw * 0.7);

          // Stress: furrowed brow (browDown both sides) with no smile
          const stressScore = ((browDownL + browDownR) / 2) * (1 - (smileL + smileR) / 2);

          let sentiment = "neutral";
          if ((smileL + smileR) / 2 > 0.35) sentiment = "happy";
          else if (stressScore > 0.4) sentiment = "stressed";

          newMetrics.confidenceScore = confidenceScore;
          newMetrics.sentiment = sentiment;
          updated = true;
        }

        // ── 3. HEAD POSE (from transformation matrix) ────────────────────
        if (
          faceResults.facialTransformationMatrixes &&
          faceResults.facialTransformationMatrixes.length > 0
        ) {
          const m = faceResults.facialTransformationMatrixes[0].data;
          const pitch = Math.atan2(m[6], m[10]) * (180 / Math.PI);
          const yaw = Math.atan2(-m[2], Math.sqrt(m[6] * m[6] + m[10] * m[10])) * (180 / Math.PI);
          const roll = Math.atan2(m[1], m[0]) * (180 / Math.PI);
          newMetrics.headPose = { yaw, pitch, roll };
          updated = true;
        }
      }

      // ─── POSE ANALYSIS (every 3rd frame ~10fps) ───────────────────────────
      if (poseLandmarkerRef.current && frameCountRef.current % 3 === 0) {
        const poseResults = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);

        if (poseResults.landmarks && poseResults.landmarks.length > 0) {
          const lm = poseResults.landmarks[0];

          // 11: left shoulder, 12: right shoulder
          const shoulderY = (lm[11].y + lm[12].y) / 2;

          // Calibrate baseline over first 30 pose frames for robustness
          if (baselineShoulderCalibFramesRef.current < 30) {
            if (baselineShoulderYRef.current === null) {
              baselineShoulderYRef.current = shoulderY;
            } else {
              // Exponential moving average for stable baseline
              baselineShoulderYRef.current =
                baselineShoulderYRef.current * 0.9 + shoulderY * 0.1;
            }
            baselineShoulderCalibFramesRef.current += 1;
          }

          const isSlouching =
            baselineShoulderYRef.current !== null &&
            shoulderY - baselineShoulderYRef.current > 0.05;
          newMetrics.isSlouching = isSlouching;

          // High-frequency fidget detection using wrist velocity history
          // 15: left wrist, 16: right wrist
          const now = performance.now();
          wristHistoryRef.current.push({
            t: now,
            lx: lm[15].x, ly: lm[15].y,
            rx: lm[16].x, ry: lm[16].y,
          });
          // Keep 1 second of history
          wristHistoryRef.current = wristHistoryRef.current.filter(
            (e) => now - e.t < 1000
          );

          let isFidgeting = false;
          if (wristHistoryRef.current.length > 3) {
            let totalVelocity = 0;
            const h = wristHistoryRef.current;
            for (let i = 1; i < h.length; i++) {
              const dLx = h[i].lx - h[i - 1].lx;
              const dLy = h[i].ly - h[i - 1].ly;
              const dRx = h[i].rx - h[i - 1].rx;
              const dRy = h[i].ry - h[i - 1].ry;
              totalVelocity +=
                Math.sqrt(dLx * dLx + dLy * dLy) +
                Math.sqrt(dRx * dRx + dRy * dRy);
            }
            // High-frequency: many small movements = jitter
            const avgVelocity = totalVelocity / (h.length - 1);
            isFidgeting = avgVelocity > 0.015 && h.length > 5;
          }
          newMetrics.isFidgeting = isFidgeting;
          updated = true;
        }
      }

      if (updated) {
        setMetrics((prev) => ({ ...prev, ...newMetrics }));
      }
    }

    requestAnimationFrame(analyzeFrame);
  }, [isReady, videoRef]);

  // ─── Session Logging (every second) ────────────────────────────────────────
  useEffect(() => {
    if (!isRunningRef.current) return;
    const interval = setInterval(() => {
      // Update rolling eye-contact %
      gazeHistoryRef.current.push(metrics.gazeZone === "camera" ? 1 : 0);
      if (gazeHistoryRef.current.length > 60) gazeHistoryRef.current.shift();
      const eyeContactPct = Math.round(
        (gazeHistoryRef.current.reduce((a, v) => a + v, 0) /
          gazeHistoryRef.current.length) *
          100
      );

      sessionLogRef.current.push({
        timestamp: Date.now(),
        confidenceScore: metrics.confidenceScore,
        sentiment: metrics.sentiment,
        gazeZone: metrics.gazeZone,
        eyeContactPct,
        headPose: metrics.headPose,
        isSlouching: metrics.isSlouching,
        isFidgeting: metrics.isFidgeting,
      });

      setMetrics((prev) => ({ ...prev, eyeContactPct }));
    }, 1000);
    return () => clearInterval(interval);
  }, [metrics]);

  const startAnalysis = useCallback(() => {
    if (!isReady) return;
    isRunningRef.current = true;
    sessionLogRef.current = [];
    gazeHistoryRef.current = [];
    wristHistoryRef.current = [];
    baselineShoulderYRef.current = null;
    baselineShoulderCalibFramesRef.current = 0;
    continuousGazeAwayRef.current = 0;
    requestAnimationFrame(analyzeFrame);
  }, [isReady, analyzeFrame]);

  const stopAnalysis = useCallback(() => {
    isRunningRef.current = false;
  }, []);

  return {
    isReady,
    ...metrics,
    sessionLog: sessionLogRef.current,
    startAnalysis,
    stopAnalysis,
  };
};
