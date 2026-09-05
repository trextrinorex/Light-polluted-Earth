import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import './styles.css';

/* ---------- Data ---------- */
type DebrisPoint = {
  id: string;
  name: string;
  shell: 'LEO' | 'MEO' | 'GEO';
  year: number;
  size: string;
  velocity: string;
  risk: 'LOW' | 'MOD' | 'HIGH';
  lat: number;
  lon: number;
  r: number;
};

const DEBRIS: DebrisPoint[] = [
  { id: 'd1', name: 'Iridium 33 Fragment', shell: 'LEO', year: 2009, size: '10–50 cm', velocity: '~7.6 km/s', risk: 'HIGH', lat: 28, lon: 40, r: 2.18 },
  { id: 'd2', name: 'Cosmos 2251 Remnant', shell: 'LEO', year: 2009, size: '5–20 cm', velocity: '~7.7 km/s', risk: 'HIGH', lat: -15, lon: -80, r: 2.22 },
  { id: 'd3', name: 'Fengyun-1C Debris', shell: 'LEO', year: 2007, size: '1–10 cm', velocity: '~7.5 km/s', risk: 'MOD', lat: 45, lon: 120, r: 2.15 },
  { id: 'd4', name: 'Rocket Body (SL-16)', shell: 'LEO', year: 1993, size: '>1 m', velocity: '~7.4 km/s', risk: 'MOD', lat: -30, lon: 10, r: 2.28 },
  { id: 'd5', name: 'GPS Block IIR Shell', shell: 'MEO', year: 2005, size: '50 cm–1 m', velocity: '~3.9 km/s', risk: 'LOW', lat: 20, lon: -40, r: 2.55 },
  { id: 'd6', name: 'GEO Graveyard Object', shell: 'GEO', year: 1998, size: '>1 m', velocity: '~3.1 km/s', risk: 'LOW', lat: 5, lon: 90, r: 2.95 },
  { id: 'd7', name: 'ASAT Test Fragment', shell: 'LEO', year: 2021, size: '1–30 cm', velocity: '~7.8 km/s', risk: 'HIGH', lat: 55, lon: -120, r: 2.12 },
  { id: 'd8', name: 'Spent Upper Stage', shell: 'MEO', year: 2012, size: '>1 m', velocity: '~4.1 km/s', risk: 'MOD', lat: -40, lon: 150, r: 2.48 },
];

const TIMELINE = [
  { year: 1957, title: 'Sputnik 1', body: 'First artificial satellite. The orbital age begins; spent stages start to accumulate.', critical: false },
  { year: 2007, title: 'Fengyun-1C ASAT Test', body: 'China’s anti-satellite test creates one of the largest debris clouds ever recorded in LEO.', critical: true },
  { year: 2009, title: 'Iridium–Cosmos Collision', body: 'First major accidental satellite-to-satellite collision. Thousands of trackable fragments generated.', critical: true },
  { year: 2021, title: 'Multiple ASAT Events', body: 'Further kinetic tests and on-orbit breakups continue to feed the debris population.', critical: true },
  { year: 2025, title: 'Active Debris Removal Era', body: 'Demonstration missions for sails, robotic capture, and net systems begin to scale.', critical: false },
];

const SOLUTIONS = [
  { tag: 'Passive', title: 'De-orbit Sails & Drag Devices', body: 'Deployable membranes increase atmospheric drag so objects re-enter and burn up faster at end of life.' },
  { tag: 'Robotic', title: 'Capture Arms & Magnetic Docking', body: 'Servicing spacecraft use robotic arms or magnetic interfaces to grapple and move defunct satellites.' },
  { tag: 'Kinetic', title: 'Harpoon & Net Capture', body: 'Projectile or net systems secure uncooperative targets for controlled de-orbit burns.' },
  { tag: 'Ground', title: 'Laser Ablation Concepts', body: 'Ground- or space-based lasers impart small Δv to tiny debris, altering orbits toward atmospheric decay.' },
];

/* ---------- Helpers ---------- */
function latLon(lat: number, lon: number, r = 2.02) {
  const phi = THREE.MathUtils.degToRad(lat);
  const theta = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(
    r * Math.cos(phi) * Math.cos(theta),
    r * Math.sin(phi),
    -r * Math.cos(phi) * Math.sin(theta)
  );
}

function makeEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  const ocean = ctx.createLinearGradient(0, 0, 0, 1024);
  ocean.addColorStop(0, '#061820');
  ocean.addColorStop(0.5, '#0a2a38');
  ocean.addColorStop(1, '#041018');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, 2048, 1024);

  const land = [
    [[120, 300], [210, 220], [340, 235], [430, 315], [405, 420], [300, 470], [225, 410]],
    [[455, 130], [575, 105], [680, 165], [700, 285], [625, 330], [555, 275], [480, 300]],
    [[700, 345], [820, 300], [905, 360], [875, 485], [805, 555], [745, 505]],
    [[960, 180], [1080, 145], [1165, 215], [1120, 315], [1015, 330], [940, 270]],
    [[1135, 355], [1245, 330], [1310, 425], [1275, 555], [1170, 535], [1110, 445]],
    [[1360, 170], [1495, 145], [1590, 215], [1560, 330], [1450, 345], [1365, 285]],
    [[1540, 390], [1650, 365], [1760, 430], [1720, 520], [1605, 535], [1535, 480]],
    [[360, 590], [430, 540], [500, 600], [490, 760], [410, 875], [345, 790]],
    [[720, 620], [805, 570], [875, 650], [850, 820], [760, 875], [700, 760]],
    [[1240, 650], [1340, 600], [1425, 670], [1380, 820], [1280, 875], [1215, 770]],
  ];
  ctx.strokeStyle = '#1a3a40';
  ctx.lineWidth = 2;
  land.forEach((poly) => {
    ctx.beginPath();
    poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 120, 0, 900);
    g.addColorStop(0, '#2a4a38');
    g.addColorStop(0.55, '#1a3a30');
    g.addColorStop(1, '#0e2820');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.stroke();
  });
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = '#c8e0dc';
  ctx.lineWidth = 6;
  for (let y = 90; y < 980; y += 100) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(500, y - 40, 1450, y + 40, 2048, y - 8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/* ---------- 3D Components ---------- */
function Atmosphere() {
  return (
    <mesh scale={1.06}>
      <sphereGeometry args={[2, 96, 96]} />
      <meshBasicMaterial
        color="#4a9ec4"
        transparent
        opacity={0.11}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/** Use primitive THREE.Line to avoid SVG <line> JSX type collision with DOM types. */
function OrbitRing({ radius, color, opacity = 0.35 }: { radius: number; color: string; opacity?: number }) {
  const line = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    return new THREE.Line(geom, mat);
  }, [radius, color, opacity]);

  useEffect(() => {
    return () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    };
  }, [line]);

  return <primitive object={line} />;
}

function DebrisCloud({
  shell,
  visible,
  onSelect,
}: {
  shell: 'LEO' | 'MEO' | 'GEO';
  visible: boolean;
  onSelect: (d: DebrisPoint) => void;
}) {
  const items = useMemo(() => DEBRIS.filter((d) => d.shell === shell), [shell]);
  const positions = useMemo(
    () => items.map((d) => latLon(d.lat, d.lon, d.r)),
    [items]
  );

  // Precompute positions + stable radii (never call Math.random during render)
  const extra = useMemo(() => {
    const n = shell === 'LEO' ? 180 : shell === 'MEO' ? 60 : 30;
    const baseR = shell === 'LEO' ? 2.2 : shell === 'MEO' ? 2.55 : 2.95;
    const arr: { pos: THREE.Vector3; radius: number }[] = [];
    for (let i = 0; i < n; i++) {
      const lat = (Math.random() - 0.5) * 140;
      const lon = Math.random() * 360 - 180;
      const jitter = (Math.random() - 0.5) * 0.12;
      arr.push({
        pos: latLon(lat, lon, baseR + jitter),
        radius: 0.008 + Math.random() * 0.01,
      });
    }
    return arr;
  }, [shell]);

  if (!visible) return null;

  const color =
    shell === 'LEO' ? '#ff6b6b' : shell === 'MEO' ? '#ffb86b' : '#939393';

  return (
    <group>
      {extra.map((p, i) => (
        <mesh key={`e-${shell}-${i}`} position={p.pos}>
          <sphereGeometry args={[p.radius, 6, 6]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
      {items.map((d, i) => (
        <group key={d.id} position={positions[i]}>
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              onSelect(d);
            }}
            onPointerOver={() => {
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default';
            }}
          >
            <sphereGeometry args={[0.028, 12, 12]} />
            <meshBasicMaterial
              color={d.risk === 'HIGH' ? '#ff4d4d' : d.risk === 'MOD' ? '#ff9f43' : '#939393'}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            color={d.risk === 'HIGH' ? '#ff4d4d' : '#ffb84d'}
            intensity={0.35}
            distance={0.4}
          />
        </group>
      ))}
    </group>
  );
}

function Earth({ shells, onSelect }: { shells: Record<string, boolean>; onSelect: (d: DebrisPoint) => void }) {
  const ref = useRef<THREE.Group>(null);
  const texture = useMemo(makeEarthTexture, []);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.012;
  });
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <group ref={ref} position={[0.9, 0, 0]}>
      <mesh>
        <sphereGeometry args={[2, 128, 128]} />
        <meshStandardMaterial
          map={texture}
          color="#ffffff"
          roughness={0.88}
          metalness={0.02}
          emissive="#030608"
          emissiveIntensity={0.12}
        />
      </mesh>
      <Atmosphere />
      <OrbitRing radius={2.2} color="#ff4d4d" opacity={0.4} />
      <OrbitRing radius={2.55} color="#ffb86b" opacity={0.28} />
      <OrbitRing radius={2.95} color="#5f5f5f" opacity={0.22} />
      <DebrisCloud shell="LEO" visible={shells.LEO} onSelect={onSelect} />
      <DebrisCloud shell="MEO" visible={shells.MEO} onSelect={onSelect} />
      <DebrisCloud shell="GEO" visible={shells.GEO} onSelect={onSelect} />
    </group>
  );
}

function Scene({ shells, onSelect }: { shells: Record<string, boolean>; onSelect: (d: DebrisPoint) => void }) {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.12} />
      <directionalLight position={[-5, 3, 4]} intensity={1.1} color="#e8f0f4" />
      <Stars radius={90} depth={50} count={4500} factor={2.2} saturation={0} fade speed={0.2} />
      <Sparkles count={80} scale={12} size={1.1} speed={0.18} opacity={0.28} />
      <Earth shells={shells} onSelect={onSelect} />
      <OrbitControls
        enablePan={false}
        minDistance={3.4}
        maxDistance={9}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.35}
      />
    </>
  );
}

/* ---------- UI ---------- */
function useMissionClock() {
  const [t, setT] = useState('00:00:00');
  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      const hh = String(Math.floor(s / 3600)).padStart(2, '0');
      const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      setT(`${hh}:${mm}:${ss}`);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  return t;
}

function App() {
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState<DebrisPoint | null>(null);
  const [shells, setShells] = useState({ LEO: true, MEO: true, GEO: true });
  const [reduced, setReduced] = useState(false);
  const clock = useMissionClock();

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default';
    };
  }, []);

  const toggleShell = (key: 'LEO' | 'MEO' | 'GEO') =>
    setShells((s) => ({ ...s, [key]: !s[key] }));

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    setMenu(false);
  };

  return (
    <main className="app">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0.3, 6.8], fov: 42 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense
          fallback={
            <Html center>
              <div className="loader">CALIBRATING ORBIT…</div>
            </Html>
          }
        >
          <Scene shells={shells} onSelect={setSelected} />
        </Suspense>
      </Canvas>

      <div className="hud-overlay" aria-hidden />

      <div className="crosshair tl">
        <span>OBS DECK // PRIMARY</span>
        <span className="coord">LAT 00.00 · LON 000.00</span>
        <span>RANGE 420 KM</span>
      </div>
      <div className="crosshair tr">
        <span>MISSION TIMER</span>
        <span className="coord">{clock}</span>
        <span>MODE: TRACK</span>
      </div>
      <div className="crosshair bl">
        <span>LEO DENSITY</span>
        <span className="coord">HIGH</span>
        <span>CATALOG ≈ 36k+</span>
      </div>
      <div className="crosshair br">
        <span>LINK SECURE</span>
        <span className="coord">NASA / ESA REF</span>
        <span>ΔV BUDGET —</span>
      </div>

      <div className="ui-layer">
        <header>
          <div className="brand">
            <div className="brand-mark">◉</div>
            <div>
              <b>ORBITAL DEBRIS</b>
              <small>OBSERVATORY / SPACE POLLUTION</small>
            </div>
          </div>
          <button className="menu-btn" onClick={() => setMenu(!menu)} aria-label="Menu">
            {menu ? 'CLOSE' : 'MENU'} ☰
          </button>
        </header>

        {menu && (
          <nav className="nav">
            <button type="button" className="active" onClick={() => scrollTo('hero')}>OVERVIEW</button>
            <button type="button" onClick={() => scrollTo('tracker')}>DEBRIS TRACKER</button>
            <button type="button" onClick={() => scrollTo('timeline')}>TIMELINE</button>
            <button type="button" onClick={() => scrollTo('solutions')}>SOLUTIONS</button>
          </nav>
        )}

        <section className="hero" id="hero">
          <p className="eyebrow">RESEARCH OBSERVATION DECK · LEO MONITOR</p>
          <h1>
            EARTH IS
            <br />
            <em>SURROUNDED.</em>
          </h1>
          <p className="lede">
            Since 1957, spent rockets, dead satellites, and collision fragments have filled Low Earth Orbit.
            This station visualizes the growing cloud that threatens global communications, navigation, and crewed flight.
          </p>
          <div className="actions">
            <button type="button" className="primary" onClick={() => scrollTo('tracker')}>
              ENTER TRACKER <span>↗</span>
            </button>
            <button type="button" className="secondary" onClick={() => scrollTo('solutions')}>
              VIEW SOLUTIONS
            </button>
          </div>
        </section>

        <aside className="telemetry" id="tracker">
          <div className="telemetry-top">
            <span>ORBITAL LAYER CONTROL</span>
            <span>
              <i className="status-dot" /> LIVE VIEW
            </span>
          </div>
          <div className="orbit-toggles">
            <button type="button" className={shells.LEO ? 'active' : ''} onClick={() => toggleShell('LEO')}>
              LEO
            </button>
            <button type="button" className={shells.MEO ? 'active' : ''} onClick={() => toggleShell('MEO')}>
              MEO
            </button>
            <button type="button" className={shells.GEO ? 'active' : ''} onClick={() => toggleShell('GEO')}>
              GEO
            </button>
          </div>
          <div className="stats-grid">
            <div className="stat">
              <label>Trackable objects</label>
              <strong className="alert">~36,000+</strong>
            </div>
            <div className="stat">
              <label>Est. &gt;1 cm</label>
              <strong>~1,000,000</strong>
            </div>
            <div className="stat">
              <label>LEO velocity</label>
              <strong>~7–8 km/s</strong>
            </div>
            <div className="stat">
              <label>Collision risk</label>
              <strong className="alert">RISING</strong>
            </div>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 11, color: 'var(--slate-light)', lineHeight: 1.5 }}>
            Click highlighted debris nodes for telemetry. Counts are educational approximations from public NASA/ESA ranges.
          </p>
        </aside>

        {selected && (
          <section className="debris-panel">
            <button type="button" className="close" onClick={() => setSelected(null)} aria-label="Close">
              ×
            </button>
            <p className="eyebrow">FRAGMENT PROFILE</p>
            <h2>{selected.name}</h2>
            <p className="meta">
              {selected.shell} · {selected.year}
            </p>
            <div className="metric">
              <span>Size class</span>
              <strong>{selected.size}</strong>
            </div>
            <div className="metric">
              <span>Velocity</span>
              <strong>{selected.velocity}</strong>
            </div>
            <div className="metric">
              <span>Risk band</span>
              <strong className={selected.risk === 'HIGH' ? 'alert' : ''}>{selected.risk}</strong>
            </div>
          </section>
        )}

        <section className="section" id="timeline">
          <div className="section-head">
            <p className="eyebrow">CHRONOLOGY</p>
            <h2>How the sky filled</h2>
            <p>
              From a single satellite to a cascading risk environment — major milestones in orbital littering and the
              emergence of the Kessler Syndrome.
            </p>
          </div>
          <div className="timeline-track">
            {TIMELINE.map((ev) => (
              <div key={ev.year} className={`timeline-item${ev.critical ? ' critical' : ''}`}>
                <div className="year">{ev.year}</div>
                <h3>{ev.title}</h3>
                <p>{ev.body}</p>
              </div>
            ))}
          </div>
          <div className="kessler">
            <h3>KESSLER SYNDROME</h3>
            <p>
              A theoretical cascade in which collisions generate more fragments, which then collide again — exponentially
              increasing the probability of further impacts. Beyond a critical density, parts of LEO could become
              effectively unusable for decades without active cleanup.
            </p>
          </div>
        </section>

        <section className="section" id="solutions">
          <div className="section-head">
            <p className="eyebrow">REMEDIATION</p>
            <h2>Cleanup & mitigation</h2>
            <p>
              The interface shifts from diagnosis to action. Aerospace programs are developing technologies to remove
              existing debris and prevent new generations of fragments.
            </p>
          </div>
          <div className="solutions-grid">
            {SOLUTIONS.map((s) => (
              <article key={s.title} className="solution-card">
                <div className="tag">{s.tag}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
          <div className="cta-row">
            <a
              className="cta-primary"
              href="https://www.esa.int/Space_Safety/Space_Debris"
              target="_blank"
              rel="noopener noreferrer"
            >
              ESA Space Debris <span>↗</span>
            </a>
            <a
              className="cta-ghost"
              href="https://orbitaldebris.jsc.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
            >
              NASA ODPO
            </a>
            <button
              type="button"
              className="cta-ghost"
              onClick={() => {
                if (navigator.share) {
                  navigator
                    .share({
                      title: 'Orbital Debris Observatory',
                      text: "Interactive educational view of Earth's orbital debris crisis.",
                      url: window.location.href,
                    })
                    .catch(() => {});
                } else if (navigator.clipboard?.writeText) {
                  navigator.clipboard.writeText(window.location.href).catch(() => {});
                }
              }}
            >
              Share this deck
            </button>
          </div>
        </section>

        <footer>
          <span>ORBITAL DEBRIS OBSERVATORY © 2026</span>
          <span>EDUCATIONAL / SCIENCE / DESIGN</span>
          <span>DRAG TO ROTATE · SCROLL · CLICK NODES</span>
        </footer>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
