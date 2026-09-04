import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import './styles.css';

type City = { name: string; country: string; lat: number; lon: number; light: number; population: string };
const CITIES: City[] = [
  {name:'Delhi',country:'India',lat:28.61,lon:77.21,light:96,population:'33M'},
  {name:'Mumbai',country:'India',lat:19.07,lon:72.88,light:94,population:'22M'},
  {name:'New York',country:'United States',lat:40.71,lon:-74.01,light:98,population:'19M'},
  {name:'London',country:'United Kingdom',lat:51.51,lon:-0.13,light:92,population:'9M'},
  {name:'Tokyo',country:'Japan',lat:35.68,lon:139.69,light:99,population:'37M'},
  {name:'Sydney',country:'Australia',lat:-33.87,lon:151.21,light:82,population:'5M'},
  {name:'Cairo',country:'Egypt',lat:30.04,lon:31.24,light:90,population:'23M'},
];

function latLon(lat:number, lon:number, r=2.02){
  const p=THREE.MathUtils.degToRad(lat), t=THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(r*Math.cos(p)*Math.cos(t), r*Math.sin(p), -r*Math.cos(p)*Math.sin(t));
}

function CityLights({enabled}:{enabled:boolean}){
  const points=useMemo(()=>CITIES.map(c=>latLon(c.lat,c.lon)),[]);
  return <group visible={enabled}>{points.map((p,i)=><group key={i} position={p}><mesh><sphereGeometry args={[0.018 + CITIES[i].light/7000,8,8]}/><meshBasicMaterial color="#ffc66d" toneMapped={false}/></mesh><pointLight color="#ffb84d" intensity={0.45} distance={0.35}/></group>)}</group>
}

function Earth({dark}:{dark:boolean}){
  const ref=useRef<THREE.Mesh>(null);
  useFrame((_,d)=>{ if(ref.current) ref.current.rotation.y += d*0.025; });
  return <group ref={ref}>
    <mesh><sphereGeometry args={[2,96,96]}/><meshStandardMaterial color={dark?'#050607':'#10151a'} roughness={0.92} metalness={0.05} emissive={dark?'#000000':'#080d12'} emissiveIntensity={0.8}/></mesh>
    <mesh scale={1.045}><sphereGeometry args={[2,96,96]}/><meshBasicMaterial color="#5b7891" transparent opacity={0.055} side={THREE.BackSide}/></mesh>
  </group>
}

function Scene({lights,dark}:{lights:boolean;dark:boolean}){
  return <>
    <color attach="background" args={['#020304']} />
    <ambientLight intensity={dark?0.08:0.18}/><directionalLight position={[5,3,4]} intensity={0.75} color="#d8e4ef"/>
    <Stars radius={80} depth={45} count={dark?4200:2600} factor={2.1} saturation={0} fade speed={0.35}/>
    <Sparkles count={dark?90:45} scale={8} size={1.2} speed={0.25} opacity={0.35}/>
    <Earth dark={dark}/><CityLights enabled={lights}/>
    <OrbitControls enablePan={false} minDistance={3.1} maxDistance={7} enableDamping dampingFactor={0.055} rotateSpeed={0.38}/>
  </>
}

function App(){
  const [lights,setLights]=useState(true), [dark,setDark]=useState(false), [query,setQuery]=useState(''), [city,setCity]=useState<City|null>(null), [time,setTime]=useState(2026), [menu,setMenu]=useState(false);
  const [reduced,setReduced]=useState(false);
  useEffect(()=>{setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)},[]);
  const results=query?CITIES.filter(c=>c.name.toLowerCase().includes(query.toLowerCase())).slice(0,4):[];
  const choose=(c:City)=>{setCity(c);setQuery(c.name)};
  return <main className={dark?'app dark-mode':'app'}>
    <Canvas dpr={[1,1.6]} camera={{position:[0,0,6],fov:42}} gl={{antialias:true,powerPreference:'high-performance'}}>
      <Suspense fallback={<Html center><div className="loader">CALIBRATING EARTH…</div></Html>}><Scene lights={lights} dark={dark}/></Suspense>
    </Canvas>
    <div className="grain"/>
    <header><div className="brand"><span className="brand-mark">◉</span><div><b>LIGHT-POLLUTED</b><small>EARTH / NIGHT ATLAS</small></div></div><button className="menu" onClick={()=>setMenu(!menu)} aria-label="Open navigation">{menu?'CLOSE':'MENU'} <span>☰</span></button></header>
    {menu&&<nav className="nav"><button>EXPLORE</button><button>DATA</button><button>CITIES</button><button>NIGHT SKY</button><button>STORY</button><button>ABOUT</button></nav>}
    <section className="hero"><p className="eyebrow">A PLANET AFTER SUNSET</p><h1>WHEN NIGHT<br/><em>NEVER ARRIVES.</em></h1><p className="lede">Explore Earth's artificial night — where cities glow, skies fade, and darkness becomes a disappearing resource.</p><div className="actions"><button className="primary" onClick={()=>document.getElementById('earth')?.scrollIntoView({behavior:reduced?'auto':'smooth'})}>EXPLORE EARTH <span>↗</span></button><button className="secondary" onClick={()=>setDark(!dark)}>{dark?'RESTORE LIGHT':'RESTORE THE DARK'} <span>◐</span></button></div></section>
    <aside className="control-card" id="earth"><div className="card-top"><span>EARTH / NIGHT VIEW</span><span className="status"><i/> LATEST AVAILABLE DATA</span></div><div className="search-wrap"><span>⌕</span><input aria-label="Search city" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search a city…"/>{results.length>0&&<div className="results">{results.map(c=><button key={c.name} onClick={()=>choose(c)}><b>{c.name}</b><span>{c.country}</span></button>)}</div>}</div><div className="toggles"><button className={lights?'active':''} onClick={()=>setLights(!lights)}><i/> CITY LIGHTS <span>{lights?'ON':'OFF'}</span></button><button className={dark?'active':''} onClick={()=>setDark(!dark)}><i/> DARKNESS MODE <span>{dark?'ON':'OFF'}</span></button></div><label className="timeline"><span>THEN</span><input type="range" min="1995" max="2026" value={time} onChange={e=>setTime(+e.target.value)}/><span>{time}</span></label></aside>
    {city&&<section className="city-panel"><button className="close" onClick={()=>setCity(null)}>×</button><p className="eyebrow">CITY PROFILE</p><h2>{city.name}</h2><p>{city.country}</p><div className="metric"><span>ARTIFICIAL LIGHT</span><strong>{city.light}<small>/100</small></strong></div><div className="metric"><span>POPULATION</span><strong>{city.population}</strong></div><p className="note">Illustrative city metric. Connect the production VIIRS pipeline to replace the demo values with measured radiance.</p></section>}
    <footer><span>LIGHT-POLLUTED EARTH © 2026</span><span>DATA VISUALIZATION / SCIENCE / DESIGN</span><span>DRAG TO ROTATE · SCROLL TO EXPLORE</span></footer>
  </main>
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
