import { useState } from 'react';
import { useGhostAuth } from './lib/useGhostAuth';
import BankingApp from './components/BankingApp';
import GhostAuthDashboard from './components/GhostAuthDashboard';
import CamouflageOverlay from './components/CamouflageOverlay';
import { Shield, Info, X } from 'lucide-react';

function ToastNotification({ message, type, onClose }) {
  if (!message) return null;
  const colors = {
    success: 'bg-green-500/20 border-green-500/40 text-green-400',
    warning: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    danger: 'bg-red-500/20 border-red-500/40 text-red-400',
  };
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium max-w-sm backdrop-blur-xl ${colors[type]}`}>
      <span>{message}</span>
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
}

export default function App() {
  const ghost = useGhostAuth();
  const [toast, setToast] = useState(null);
  const [showInfo, setShowInfo] = useState(true);

  const showToast = (message, type = 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSendMoney = (amount, to, verified) => {
    if (ghost.camouflageActive) {
      showToast('Transaction silently blocked — attacker sees fake success', 'danger');
      return;
    }
    if (verified || parseInt(amount) <= 10000) {
      showToast('Sent Rs.' + parseInt(amount).toLocaleString('en-IN') + ' to ' + (to || 'recipient'), 'success');
    }
  };

  return (
    <div className="min-h-screen bg-[#080c16] flex flex-col" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/20 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-sm">GhostAuth</span>
            <span className="text-white/30 text-xs ml-2">× Canara Bank — Hackathon Demo</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {ghost.phase === 'enrolled' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400">DTW Active</span>
            </div>
          )}
          {ghost.phase === 'idle' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="text-xs text-blue-400">Awaiting Enrollment</span>
            </div>
          )}
          <button
            onClick={() => setShowInfo(p => !p)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white/70 transition-all"
          >
            <Info size={14} />
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="mx-4 mt-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-white/50 leading-relaxed">
          <strong className="text-blue-400">How to demo: </strong>
          1) Click <strong className="text-white/70">"Start Enrollment"</strong> in the dashboard, then move your mouse naturally over the phone for 4 seconds — this trains your DTW baseline.
          2) After enrollment, your real mouse movement drives the trust score using Dynamic Time Warping ML.
          3) Use <strong className="text-orange-400">Attack Simulator</strong> to inject inhuman patterns and watch the score drop.
          4) Score below 50 → <strong className="text-red-400">Camouflage Engine</strong> activates.
          <button onClick={() => setShowInfo(false)} className="ml-2 text-blue-400 underline">Dismiss</button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0">
        {/* Phone mockup */}
        <div className="flex justify-center lg:justify-start">
          <div className="relative" style={{ width: 360, flexShrink: 0 }}>
            <div
              className="relative rounded-[44px] overflow-hidden shadow-2xl"
              style={{
                width: 360, height: 740,
                background: '#1a1a2e',
                border: '8px solid #1e2235',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(59,130,246,0.1)',
              }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#1a1a2e] rounded-b-2xl z-50" />
              <BankingApp
                onInteract={ghost.recordEvent}
                camouflageActive={ghost.camouflageActive}
                trustLevel={ghost.trustLevel}
                onSendMoney={handleSendMoney}
                phase={ghost.phase}
                enrollProgress={ghost.enrollProgress}
                trajectoryPoints={ghost.trajectoryPoints}
              />
              <CamouflageOverlay active={ghost.camouflageActive} />
              {!ghost.camouflageActive && ghost.phase !== 'idle' && (
                <div
                  className="absolute top-10 left-3 z-50 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs backdrop-blur-md"
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid ' + ghost.trustLevel.color + '40',
                    color: ghost.trustLevel.color,
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ghost.trustLevel.color }} />
                  <span className="font-mono font-bold">{ghost.score}</span>
                </div>
              )}
            </div>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/20 rounded-full" />
          </div>
        </div>

        {/* Dashboard */}
        <div className="flex-1 min-w-0 max-w-xl">
          <GhostAuthDashboard
            score={ghost.score}
            features={ghost.features}
            trustLevel={ghost.trustLevel}
            auraHash={ghost.auraHash}
            alertLog={ghost.alertLog}
            scoreHistory={ghost.scoreHistory}
            driftWarning={ghost.driftWarning}
            simulateAttack={ghost.simulateAttack}
            resetProfile={ghost.resetProfile}
            phase={ghost.phase}
            enrollProgress={ghost.enrollProgress}
            hasEnrolled={ghost.hasEnrolled}
            startEnrollment={ghost.startEnrollment}
          />
        </div>
      </div>

      {toast && <ToastNotification {...toast} onClose={() => setToast(null)} />}

      <div className="text-center py-3 text-xs text-white/15 border-t border-white/5">
        Team Laxman Rekha · Canara Bank Hackathon · GhostAuth v1.0 · DTW Mouse ML
      </div>
    </div>
  );
}
