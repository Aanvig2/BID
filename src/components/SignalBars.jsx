import { Activity, Zap, Waves, Clock, MousePointer, Navigation, TrendingUp } from 'lucide-react';

const SIGNALS = [
  { key: 'avgVelocity',       label: 'Velocity',          icon: TrendingUp,   desc: 'avg mouse speed' },
  { key: 'avgAcceleration',   label: 'Acceleration',      icon: Zap,          desc: 'speed change rate' },
  { key: 'avgCurvature',      label: 'Curvature',         icon: Waves,        desc: 'path curviness' },
  { key: 'avgJerk',           label: 'Jerk',              icon: Activity,     desc: 'accel change (gyro analog)' },
  { key: 'directionChanges',  label: 'Dir. Changes',      icon: Navigation,   desc: 'path reversals' },
  { key: 'clickRate',         label: 'Click Rate',        icon: MousePointer, desc: 'clicks / second' },
  { key: 'hesitation',        label: 'Hesitation',        icon: Clock,        desc: 'timing variance' },
];

function SignalBar({ value }) {
  const pct = Math.min(value * 100, 100);
  const color = pct > 65 ? '#22c55e' : pct > 35 ? '#eab308' : '#ef4444';
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
      <span className="text-xs font-mono text-white/40 w-8 text-right">{pct.toFixed(0)}%</span>
    </div>
  );
}

export default function SignalBars({ features }) {
  return (
    <div className="space-y-3">
      {SIGNALS.map(({ key, label, icon: Icon, desc }) => (
        <div key={key} className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Icon size={12} className="text-white/50" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1">
              <span className="text-xs font-medium text-white/70">{label}</span>
              <span className="text-xs text-white/25">{desc}</span>
            </div>
            <SignalBar value={features[key] || 0} />
          </div>
        </div>
      ))}
    </div>
  );
}
