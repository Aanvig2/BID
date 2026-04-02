import { Shield, AlertTriangle, Activity, Cpu, Lock, Zap, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import TrustScoreRing from './TrustScoreRing';
import SignalBars from './SignalBars';
import ScoreChart from './ScoreChart';

const LEVEL_CONFIG = {
  TRUSTED: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: Shield },
  WATCH: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: Activity },
  SUSPECT: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', icon: AlertTriangle },
  THREAT: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: AlertTriangle },
};

const ATTACK_SCENARIOS = [
  { id: 'tap_anomaly', label: 'Tap Anomaly', desc: 'Abnormal tap patterns', icon: '👆', severity: 'medium' },
  { id: 'tremor_spike', label: 'Tremor Spike', desc: 'Extreme micro-movements', icon: '📳', severity: 'medium' },
  { id: 'robot_session', label: 'Bot Session', desc: 'Perfect inhuman precision', icon: '🤖', severity: 'high' },
  { id: 'full_takeover', label: 'Full Takeover', desc: 'Complete behavioral mismatch', icon: '💀', severity: 'critical' },
];

export default function GhostAuthDashboard({
  score, features, trustLevel, auraHash, alertLog,
  scoreHistory, driftWarning, simulateAttack, resetProfile,
  phase, enrollProgress, hasEnrolled, startEnrollment
}) {
  const [showTechDetails, setShowTechDetails] = useState(false);
  const config = LEVEL_CONFIG[trustLevel.level] || LEVEL_CONFIG.TRUSTED;
  const LevelIcon = config.icon;

  return (
    <div
      className="h-full flex flex-col gap-4 overflow-y-auto"
      style={{ fontFamily: '"Space Grotesk", sans-serif', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
            <Shield size={16} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">GhostAuth</h1>
            <p className="text-xs text-white/40">Cognitive Trust Monitor</p>
          </div>
        </div>
        <button
          onClick={resetProfile}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50 hover:bg-white/10 hover:text-white/80 transition-all"
        >
          <RefreshCw size={11} />
          Reset
        </button>
      </div>

      {/* Enrollment panel */}
      {!hasEnrolled && phase !== 'enrolling' && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧠</span>
            <div>
              <p className="text-sm font-semibold text-blue-300">Enroll Your Behavior</p>
              <p className="text-xs text-white/40">Move mouse over the app for 4 seconds to train your ML baseline</p>
            </div>
          </div>
          <button
            onClick={startEnrollment}
            className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold transition-all active:scale-98"
          >
            Start Enrollment →
          </button>
        </div>
      )}

      {phase === 'enrolling' && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <p className="text-sm font-semibold text-green-400 mb-2">📡 Recording baseline...</p>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-green-400 rounded-full transition-all duration-100"
              style={{ width: `${enrollProgress}%` }} />
          </div>
          <p className="text-xs text-green-400/60 mt-1 font-mono">{Math.round(enrollProgress)}% — move mouse over the phone</p>
        </div>
      )}

      {hasEnrolled && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
          <span className="text-green-400 text-sm">✓</span>
          <span className="text-xs text-green-400">DTW baseline enrolled — using real mouse ML</span>
        </div>
      )}


      <div className={`rounded-2xl border p-4 ${config.bg} ${config.border} flex items-center gap-4`}>
        <TrustScoreRing score={score} level={trustLevel} />
        <div className="flex-1 space-y-3">
          <div className={`flex items-center gap-2 ${config.text}`}>
            <LevelIcon size={16} />
            <span className="font-bold text-sm">{trustLevel.level}</span>
          </div>
          <div className="space-y-1">
            <ActionBadge level={trustLevel.level} />
          </div>
          {driftWarning && (
            <div className="text-xs text-yellow-400/80 flex items-center gap-1">
              <Activity size={11} />
              <span>CUSUM drift detected — adapting baseline</span>
            </div>
          )}
        </div>
      </div>

      {/* Score history */}
      <div className="bg-white/3 border border-white/10 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/40 uppercase tracking-widest">Score History</span>
          <span className="text-xs font-mono text-white/30">last 50 ticks</span>
        </div>
        <ScoreChart data={scoreHistory} />
        <div className="flex justify-between mt-2">
          {[{ label: '86+ Trusted', color: '#22c55e' }, { label: '71 Silent', color: '#eab308' }, { label: '51 OTP', color: '#f97316' }, { label: '0 Camouf.', color: '#ef4444' }].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-white/30">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Behavioral signals */}
      <div className="bg-white/3 border border-white/10 rounded-xl p-3">
        <span className="text-xs text-white/40 uppercase tracking-widest">Behavioral Signals</span>
        <div className="mt-3">
          <SignalBars features={features} />
        </div>
      </div>

      {/* Aura hash */}
      <div className="bg-white/3 border border-white/10 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Lock size={12} className="text-blue-400" />
          <span className="text-xs text-white/40 uppercase tracking-widest">Aura Hash (SHA-256)</span>
        </div>
        <p className="font-mono text-xs text-blue-400/70 break-all leading-relaxed">{auraHash}...</p>
        <p className="text-xs text-white/25 mt-1">TPM-bound · device-specific · non-exportable</p>
      </div>

      {/* Attack simulator */}
      <div className="bg-white/3 border border-white/10 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={12} className="text-orange-400" />
          <span className="text-xs text-white/40 uppercase tracking-widest">Attack Simulator</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ATTACK_SCENARIOS.map(({ id, label, desc, icon, severity }) => (
            <button
              key={id}
              onClick={() => simulateAttack(id)}
              className={`flex flex-col items-start gap-1 p-2.5 rounded-xl border text-left transition-all active:scale-95 hover:opacity-90 ${
                severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                'bg-white/5 border-white/10'
              }`}
            >
              <div className="text-base">{icon}</div>
              <div className="text-xs font-semibold text-white/80">{label}</div>
              <div className="text-xs text-white/30 leading-tight">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Alert log */}
      {alertLog.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={12} className="text-red-400" />
            <span className="text-xs text-white/40 uppercase tracking-widest">Alert Log</span>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {alertLog.map((alert, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-white/30 font-mono">{alert.ts}</span>
                <span className="text-red-400/80">{alert.level}</span>
                <span className="text-white/40 font-mono">score:{alert.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tech details toggle */}
      <button
        onClick={() => setShowTechDetails(p => !p)}
        className="flex items-center justify-between w-full p-3 bg-white/3 border border-white/10 rounded-xl text-xs text-white/40 hover:text-white/60 hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-2">
          <Cpu size={12} />
          <span className="uppercase tracking-widest">Technical Details</span>
        </div>
        {showTechDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {showTechDetails && (
        <div className="bg-white/3 border border-white/10 rounded-xl p-3 space-y-2 text-xs">
          {[
            ['Layer 0', 'Lock-free ring buffer (512 events, CAS ops)', 'text-purple-400'],
            ['Layer 1', 'Feature extraction: tap, pressure, tremor, hesitation, nav', 'text-blue-400'],
            ['Layer 2', 'LSTM cosine similarity vs. enrolled safe profile', 'text-cyan-400'],
            ['Layer 2b', 'CUSUM drift detection (k=0.5, h=5)', 'text-teal-400'],
            ['Layer 3', 'Trust score 0-100 with adaptive threshold', 'text-green-400'],
            ['Layer 4', 'Adaptive action: proceed → silent → OTP → camouflage', 'text-yellow-400'],
            ['Layer 5a', 'Shadow DOM camouflage engine (JS-injection proof)', 'text-orange-400'],
            ['Layer 5b', 'LSB stego duress signal in X-Session-Signature header', 'text-red-400'],
            ['Layer 6', 'No PII stored · AES-256-GCM · GDPR + DPDP compliant', 'text-white/40'],
          ].map(([layer, desc, color]) => (
            <div key={layer} className="flex gap-2">
              <span className={`font-mono ${color} flex-shrink-0`}>{layer}</span>
              <span className="text-white/30">{desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionBadge({ level }) {
  const map = {
    TRUSTED: { label: '✓ Proceed normally', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    WATCH: { label: '⟳ Silent re-auth in background', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    SUSPECT: { label: '🔒 OTP required for transactions', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    THREAT: { label: '👻 Camouflage engine activated', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  };
  const config = map[level] || map.TRUSTED;
  return (
    <div className={`text-xs px-2 py-1 rounded-lg border font-medium ${config.color} ${config.bg}`}>
      {config.label}
    </div>
  );
}
