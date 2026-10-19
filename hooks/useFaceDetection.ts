"use client";
import { useEffect, useRef, useState } from "react";

export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  cameraOn: boolean
) {
  const [faceInside, setFaceInside] = useState(false);
  const [faceMessage, setFaceMessage] = useState("Cargando detector...");
  const [qualityMessage, setQualityMessage] = useState("");

  const detectorRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const lastRunRef = useRef(0);
  const initializingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!cameraOn) return;

    mountedRef.current = true;

    const waitForVideoReady = (video: HTMLVideoElement) => {
      return new Promise<void>((resolve) => {
        const check = () => {
          if (!mountedRef.current) return;
          if (
            video &&
            video.videoWidth > 0 &&
            video.videoHeight > 0 &&
            video.readyState >= 2 &&
            !video.paused
          ) {
            resolve();
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      });
    };

    const init = async () => {
      initializingRef.current = true;
      try {
        setFaceMessage("Cargando detector...");

        const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        if (!mountedRef.current) return;

        detectorRef.current = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite",
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.7,
        });

        const video = videoRef.current;
        if (!video || !mountedRef.current) return;

        await waitForVideoReady(video);

        if (!mountedRef.current) return;

        initializingRef.current = false;
        setFaceMessage("Detector listo");

        detect();
      } catch (error) {
        initializingRef.current = false;
        console.error("FaceDetector init error:", error);
        setFaceMessage("Detector no disponible");
      }
    };

    const detect = () => {
      if (!mountedRef.current || initializingRef.current) return;

      const video = videoRef.current;
      const detector = detectorRef.current;

      if (!video || !detector || video.paused || video.ended) {
        if (mountedRef.current) rafRef.current = requestAnimationFrame(detect);
        return;
      }

      const isReady =
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        video.readyState >= 2;

      if (!isReady) {
        if (mountedRef.current) rafRef.current = requestAnimationFrame(detect);
        return;
      }

      const now = Math.round(performance.now());

      // Ensure at least 40ms has passed AND now is strictly greater than last timestamp
      if (now - lastRunRef.current < 40 || now <= lastRunRef.current) {
        if (mountedRef.current) rafRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        if (!detectorRef.current || !mountedRef.current) return;

        // Perform video detection with monotonic timestamp
        const result = detector.detectForVideo(video, now);
        lastRunRef.current = now;

        if (!mountedRef.current) return;

        if (!result || !result.detections || result.detections.length === 0) {
          setFaceInside(false);
          setFaceMessage("No se detecta rostro");
          setQualityMessage("Mira a la cámara");
        } else {
          const box = result.detections[0]?.boundingBox;

          if (!box) return;

          const centerX = video.videoWidth / 2;
          const centerY = video.videoHeight / 2;

          const faceX = box.originX + box.width / 2;
          const faceY = box.originY + box.height / 2;

          const dx = Math.abs(centerX - faceX);
          const dy = Math.abs(centerY - faceY);

          const centered = dx < 100 && dy < 120;

          setFaceInside(centered);
          setFaceMessage(centered ? "Rostro detectado ✔" : "Centra tu rostro");
          setQualityMessage(centered ? "Buen encuadre" : "Ajusta posición");
        }
      } catch (err) {
        // Suppress transient frame detection glitches from MediaPipe
      }

      if (mountedRef.current) {
        rafRef.current = requestAnimationFrame(detect);
      }
    };

    init();

    return () => {
      mountedRef.current = false;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const activeDetector = detectorRef.current;
      detectorRef.current = null;
      if (activeDetector) {
        try {
          activeDetector.close();
        } catch {
          /* ignore */
        }
      }
    };
  }, [cameraOn, videoRef]);

  return {
    faceInside,
    faceMessage,
    qualityMessage,
  };
}