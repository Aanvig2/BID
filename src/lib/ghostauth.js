export class RingBuffer {
  constructor(size = 512) {
    this.size = size;
    this.buffer = new Array(size).fill(null);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }
  write(event) {
    this.buffer[this.head % this.size] = { ...event, ts: Date.now() };
    this.head++;
    if (this.count < this.size) this.count++;
    else this.tail++;
  }
  readBatch() {
    const batch = [];
    for (let i = 0; i < this.count; i++) {
      const item = this.buffer[(this.tail + i) % this.size];
      if (item) batch.push(item);
    }
    return batch;
  }
  clear() { this.head = 0; this.tail = 0; this.count = 0; }
}

export function extractMouseFeatures(events) {
  const moves = events.filter(e => e.type === 'move' && e.x !== undefined);
  const clicks = events.filter(e => e.type === 'tap' || e.type === 'click');

  if (moves.length < 3) {
    return {
      avgVelocity: 0, avgAcceleration: 0, avgCurvature: 0,
      avgJerk: 0, directionChanges: 0, clickRate: 0,
      hesitation: 0, trajectory: []
    };
  }

  const trajectory = [];
  for (let i = 1; i < moves.length; i++) {
    const prev = moves[i - 1];
    const curr = moves[i];
    const dt = Math.max((curr.ts || 0) - (prev.ts || 0), 1);
    const dx = (curr.x || 0) - (prev.x || 0);
    const dy = (curr.y || 0) - (prev.y || 0);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const velocity = dist / dt;
    const angle = Math.atan2(dy, dx);
    trajectory.push({ velocity, angle, dx, dy, dt, dist });
  }

  const velocities = trajectory.map(p => p.velocity);
  const avgVelocity = mean(velocities);

  const accelerations = [];
  for (let i = 1; i < trajectory.length; i++) {
    accelerations.push(Math.abs(trajectory[i].velocity - trajectory[i - 1].velocity) / trajectory[i].dt);
  }
  const avgAcceleration = mean(accelerations);


  const jerks = [];
  for (let i = 1; i < accelerations.length; i++) {
    jerks.push(Math.abs(accelerations[i] - accelerations[i - 1]));
  }
  const avgJerk = mean(jerks);

  const curvatures = [];
  for (let i = 1; i < trajectory.length; i++) {
    const dAngle = Math.abs(trajectory[i].angle - trajectory[i - 1].angle);
    curvatures.push(Math.min(dAngle, Math.PI * 2 - dAngle)); // normalize
  }
  const avgCurvature = mean(curvatures);

  let directionChanges = 0;
  for (let i = 1; i < trajectory.length; i++) {
    if (Math.sign(trajectory[i].dx) !== Math.sign(trajectory[i - 1].dx) ||
        Math.sign(trajectory[i].dy) !== Math.sign(trajectory[i - 1].dy)) {
      directionChanges++;
    }
  }

  const sessionDuration = moves.length > 0
    ? ((moves[moves.length - 1].ts || 0) - (moves[0].ts || 0)) / 1000
    : 1;
  const clickRate = clicks.length / Math.max(sessionDuration, 1);

  const timings = moves.map(m => m.ts || 0);
  const gaps = [];
  for (let i = 1; i < timings.length; i++) gaps.push(timings[i] - timings[i - 1]);
  const hesitation = stddev(gaps);

  return {
    avgVelocity: clamp(avgVelocity / 2, 0, 1),
    avgAcceleration: clamp(avgAcceleration / 0.5, 0, 1),
    avgCurvature: clamp(avgCurvature / Math.PI, 0, 1),
    avgJerk: clamp(avgJerk / 0.3, 0, 1),
    directionChanges: clamp(directionChanges / 20, 0, 1),
    clickRate: clamp(clickRate / 3, 0, 1),
    hesitation: clamp(hesitation / 100, 0, 1),
    trajectory: trajectory.slice(0, 50), // keep last 50 points for DTW
  };
}
export function dtwSimilarity(seqA, seqB) {
  if (!seqA || !seqB || seqA.length === 0 || seqB.length === 0) return 0.5;

  const a = seqA.map(p => [p.velocity || 0, p.angle || 0]);
  const b = seqB.map(p => [p.velocity || 0, p.angle || 0]);

  const n = Math.min(a.length, 20);
  const m = Math.min(b.length, 20);
  const aN = a.slice(0, n);
  const bN = b.slice(0, m);

  const dtw = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(Infinity));
  dtw[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = Math.sqrt(
        (aN[i-1][0] - bN[j-1][0]) ** 2 +
        (aN[i-1][1] - bN[j-1][1]) ** 2
      );
      dtw[i][j] = cost + Math.min(dtw[i-1][j], dtw[i][j-1], dtw[i-1][j-1]);
    }
  }

  const rawDistance = dtw[n][m] / Math.max(n, m);
  return Math.exp(-rawDistance * 0.5);
}

export function cosineSimilarity(featA, featB) {
  const keys = ['avgVelocity', 'avgAcceleration', 'avgCurvature', 'avgJerk', 'directionChanges', 'clickRate', 'hesitation'];
  let dot = 0, normA = 0, normB = 0;
  for (const k of keys) {
    dot += (featA[k] || 0) * (featB[k] || 0);
    normA += (featA[k] || 0) ** 2;
    normB += (featB[k] || 0) ** 2;
  }
  if (normA === 0 || normB === 0) return 0.5;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class CUSUMDetector {
  constructor(k = 0.5, h = 5) {
    this.k = k; this.h = h;
    this.S_pos = 0; this.S_neg = 0;
    this.history = [];
  }
  update(score) {
    this.history.push(score);
    const avg = mean(this.history.slice(-20));
    this.S_pos = Math.max(0, this.S_pos + score - avg - this.k);
    this.S_neg = Math.max(0, this.S_neg - score + avg - this.k);
    return { drift: this.S_pos > this.h || this.S_neg > this.h };
  }
  reset() { this.S_pos = 0; this.S_neg = 0; this.history = []; }
}

export function calculateTrustScore(features, enrolledProfile, cusum, hasEnrolled) {
  let similarity;
  if (hasEnrolled && enrolledProfile.trajectory?.length > 3 && features.trajectory?.length > 3) {
    const dtwScore = dtwSimilarity(features.trajectory, enrolledProfile.trajectory);
    const cosScore = cosineSimilarity(features, enrolledProfile);
    similarity = 0.6 * dtwScore + 0.4 * cosScore;
  } else {
    similarity = cosineSimilarity(features, DEFAULT_SAFE_PROFILE);
  }

  const baseScore = Math.round(similarity * 100);
  const { drift } = cusum.update(baseScore);
  return clamp(baseScore - (drift ? 8 : 0), 0, 100);
}

export function getTrustLevel(score) {
  if (score >= 86) return { level: 'TRUSTED', color: '#22c55e', action: 'proceed', label: 'Trusted' };
  if (score >= 71) return { level: 'WATCH', color: '#eab308', action: 'silent_reauth', label: 'Silent Re-auth' };
  if (score >= 51) return { level: 'SUSPECT', color: '#f97316', action: 'otp_prompt', label: 'OTP Required' };
  return { level: 'THREAT', color: '#ef4444', action: 'camouflage', label: 'THREAT' };
}

export function shouldCamouflage(score) { return score <= 50; }

export function encodeDuressSignal(hexStr, duressCode) {
  const bytes = hexStr.split('').map(c => c.charCodeAt(0));
  for (let i = 0; i < 3; i++) bytes[i] = (bytes[i] & 0xFE) | ((duressCode >> i) & 1);
  return bytes.map(b => String.fromCharCode(b)).join('');
}

export async function computeAuraHash(features) {
  const data = JSON.stringify({ v: features.avgVelocity, a: features.avgAcceleration, c: features.avgCurvature }) + Date.now();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const DEFAULT_SAFE_PROFILE = {
  avgVelocity: 0.45,
  avgAcceleration: 0.3,
  avgCurvature: 0.25,
  avgJerk: 0.2,
  directionChanges: 0.4,
  clickRate: 0.3,
  hesitation: 0.2,
  trajectory: [],
};

function mean(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function stddev(arr) {
  if (!arr.length) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map(x => (x - m) ** 2)));
}
function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
