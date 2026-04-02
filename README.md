# GhostAuth - Behavioral Biometrics for Mobile Banking
Traditional security checks identity once at login. GhostAuth checks identity continuously — every 1.5 seconds — without the user doing anything extra.

## What This Prototype Demonstrates

| Feature | What you see |
|---|---|
| Live Trust Score | Animated 0-100 ring, updates every 1.5s from real interaction data |
| Behavioral Signals | Real-time bars for tap pattern, pressure, tremor, hesitation, navigation |
| Score History | Recharts sparkline with trust threshold reference lines |
| Attack Simulator | 4 attack scenarios that inject anomalous behavioral data |
| Camouflage Engine | Score < 50 → phone shows fake Rs.847 balance to attacker |
| Silent Duress Alert | Pulsing alert badge + fraud log when camouflage activates |
| OTP Re-auth Gate | Transactions > Rs.10,000 trigger re-authentication flow |
| Aura Hash | Live SHA-256 behavioral fingerprint shown in hex |
| CUSUM Drift | Baseline drift detection with warning indicator |
| Tech Details Panel | Expandable 7-layer architecture breakdown |

## Architecture (7 Layers)

```
Layer 0  Input Capture      Lock-free ring buffer (512 events, CAS ops, 60Hz)
Layer 1  Feature Extraction tap · pressure · tremor · hesitation · navDepth
Layer 2  LSTM Scoring       Cosine similarity vs. enrolled safe profile
Layer 2b CUSUM Detection    Drift detection (k=0.5, h=5) — prevents false lockouts
Layer 3  Trust Score        0-100 with adaptive threshold
Layer 4  Adaptive Action    proceed → silent re-auth → OTP → camouflage
Layer 5a Camouflage Engine  Shadow DOM fake UI (JS-injection proof)
Layer 5b Duress Signal      LSB steganography in X-Session-Signature header
Layer 6  Privacy            No PII · AES-256-GCM · GDPR + DPDP compliant
```

### Trust Score Zones
| Score | Level | Action |
|---|---|---|
| 86-100 | TRUSTED | Proceed normally |
| 71-85 | WATCH | Silent re-auth in background |
| 51-70 | SUSPECT | OTP / PIN prompt |
| 0-50 | THREAT | Camouflage engine + silent fraud alert |

## Local Development

```bash
git clone https://github.com/YOUR_USERNAME/ghostauth.git
cd ghostauth
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview production build
```

Node.js 18+ required.

## Deployment

### Vercel (recommended)
```bash
npm install -g vercel
vercel --prod
```
Or connect GitHub repo at vercel.com for auto-deploy on push.

### Netlify
```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

## Project Structure

```
ghostauth/
├── public/ghost.svg
├── src/
│   ├── lib/
│   │   ├── ghostauth.js        # Core engine (all 7 layers)
│   │   └── useGhostAuth.js     # React hook + inference loop
│   ├── components/
│   │   ├── BankingApp.jsx      # Mock Canara Bank UI
│   │   ├── GhostAuthDashboard.jsx
│   │   ├── TrustScoreRing.jsx  # Animated canvas score ring
│   │   ├── SignalBars.jsx
│   │   ├── ScoreChart.jsx
│   │   └── CamouflageOverlay.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── vercel.json
└── vite.config.js
```