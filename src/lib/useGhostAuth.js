import { useState, useEffect, useRef, useCallback } from 'react';
import {
  RingBuffer,
  extractMouseFeatures,
  calculateTrustScore,
  getTrustLevel,
  CUSUMDetector,
  DEFAULT_SAFE_PROFILE,
  computeAuraHash,
  shouldCamouflage,
} from './ghostauth';

const ENROLLMENT_DURATION_MS = 4000;
const INFERENCE_INTERVAL_MS = 800;

export function useGhostAuth() {
  const ringBuffer = useRef(new RingBuffer(512));
  const cusum = useRef(new CUSUMDetector());
  const enrolledProfile = useRef(null);
  const enrollmentBuffer = useRef([]);
  const inferenceTimer = useRef(null);

  const [phase, setPhase] = useState('idle');
  const [enrollProgress, setEnrollProgress] = useState(0);
  const [score, setScore] = useState(88);
  const [features, setFeatures] = useState(DEFAULT_SAFE_PROFILE);
  const [trustLevel, setTrustLevel] = useState(getTrustLevel(88));
  const [auraHash, setAuraHash] = useState('');
  const [camouflageActive, setCamouflageActive] = useState(false);
  const [alertLog, setAlertLog] = useState([]);
  const [scoreHistory, setScoreHistory] = useState(
    Array.from({ length: 20 }, (_, i) => ({ t: i, score: 85 + Math.sin(i * 0.4) * 4 }))
  );
  const [driftWarning, setDriftWarning] = useState(false);
  const [liveMousePos, setLiveMousePos] = useState({ x: 0, y: 0 });
  const [trajectoryPoints, setTrajectoryPoints] = useState([]);

  const startEnrollment = useCallback(() => {
    enrollmentBuffer.current = [];
    setPhase('enrolling');
    setEnrollProgress(0);

    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / ENROLLMENT_DURATION_MS) * 100, 100);
      setEnrollProgress(pct);

      if (elapsed >= ENROLLMENT_DURATION_MS) {
        clearInterval(tick);
        const profile = extractMouseFeatures(enrollmentBuffer.current);
        enrolledProfile.current = profile;
        cusum.current.reset();
        setPhase('enrolled');
        setScore(95);
        setTrustLevel(getTrustLevel(95));
        enrollmentBuffer.current = [];
      }
    }, 100);
  }, []);

  const recordEvent = useCallback((event) => {
    const enriched = { ...event, ts: Date.now() };

    if (phase === 'enrolling') {
      enrollmentBuffer.current.push(enriched);
    }

    ringBuffer.current.write(enriched);

    if (event.type === 'move' && event.x !== undefined) {
      setLiveMousePos({ x: event.x, y: event.y });
      setTrajectoryPoints(prev => {
        const next = [...prev, { x: event.x, y: event.y, ts: Date.now() }];
        return next.slice(-40); // keep last 40 points for trail
      });
    }
  }, [phase]);

  const runInference = useCallback(async () => {
    if (phase === 'enrolling' || phase === 'idle') return;

    const events = ringBuffer.current.readBatch();
    if (events.length < 3) return;

    const feat = extractMouseFeatures(events);
    const hasEnrolled = !!enrolledProfile.current;
    const newScore = calculateTrustScore(feat, enrolledProfile.current || DEFAULT_SAFE_PROFILE, cusum.current, hasEnrolled);
    const level = getTrustLevel(newScore);
    const hash = await computeAuraHash(feat);

    setFeatures(feat);
    setScore(newScore);
    setTrustLevel(level);
    setAuraHash(hash.slice(0, 32));
    setCamouflageActive(shouldCamouflage(newScore));

    setScoreHistory(prev => [...prev.slice(-49), { t: prev.length, score: newScore }]);

    if (newScore < 71) {
      setAlertLog(prev => [{
        ts: new Date().toLocaleTimeString(),
        score: newScore,
        action: level.action,
        level: level.level,
      }, ...prev.slice(0, 9)]);
    }

    if (newScore < 80 && newScore > 50) {
      setDriftWarning(true);
      setTimeout(() => setDriftWarning(false), 3000);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === 'enrolled' || phase === 'attacked') {
      inferenceTimer.current = setInterval(runInference, INFERENCE_INTERVAL_MS);
    }
    return () => clearInterval(inferenceTimer.current);
  }, [phase, runInference]);

  useEffect(() => {
    const fade = setInterval(() => {
      setTrajectoryPoints(prev => {
        const cutoff = Date.now() - 1500;
        return prev.filter(p => p.ts > cutoff);
      });
    }, 100);
    return () => clearInterval(fade);
  }, []);

  const simulateAttack = useCallback((type) => {
    setPhase('attacked');
    ringBuffer.current.clear();

    const attacks = {
      tap_anomaly: () => {
        for (let i = 0; i < 30; i++) {
          ringBuffer.current.write({ type: 'move', x: Math.random() * 400, y: Math.random() * 700, ts: Date.now() + i * 16 });
        }
      },
      tremor_spike: () => {
        for (let i = 0; i < 50; i++) {
          ringBuffer.current.write({
            type: 'move',
            x: 200 + (Math.random() - 0.5) * 60,
            y: 350 + (Math.random() - 0.5) * 60,
            ts: Date.now() + i * 5,
          });
        }
      },
      robot_session: () => {
        for (let i = 0; i < 30; i++) {
          ringBuffer.current.write({ type: 'move', x: i * 12, y: 300, ts: Date.now() + i * 50 });
        }
      },
      full_takeover: () => {
        for (let i = 0; i < 40; i++) {
          ringBuffer.current.write({
            type: 'move',
            x: Math.random() * 360,
            y: Math.random() * 700,
            ts: Date.now() + i * 8,
          });
        }
      },
    };

    attacks[type]?.();
    runInference();
  }, [runInference]);

  const resetProfile = useCallback(() => {
    ringBuffer.current.clear();
    cusum.current.reset();
    enrolledProfile.current = null;
    enrollmentBuffer.current = [];
    setPhase('idle');
    setScore(88);
    setEnrollProgress(0);
    setTrustLevel(getTrustLevel(88));
    setCamouflageActive(false);
    setAlertLog([]);
    setTrajectoryPoints([]);
    setScoreHistory(Array.from({ length: 20 }, (_, i) => ({ t: i, score: 85 + Math.sin(i * 0.4) * 4 })));
  }, []);

  return {
    phase, enrollProgress,
    score, features, trustLevel, auraHash,
    camouflageActive, alertLog, scoreHistory,
    driftWarning, liveMousePos, trajectoryPoints,
    hasEnrolled: !!enrolledProfile.current,
    recordEvent, startEnrollment, simulateAttack, resetProfile,
  };
}
