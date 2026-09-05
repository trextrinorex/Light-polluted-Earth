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

function latLon(lat:number, lon:number, r=2.025){
  const p=THREE.MathUtils.degToRad(lat), t=THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(r*Math.cos(p)*Math.cos(t), r*Math.sin(p), -r*Math.cos(p)*Math.sin(t));
}

function makeEarthTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=2048; canvas.height=1024;
  const ctx=canvas.getContext('2d')!;
  const ocean=ctx.createLinearGradient(0,0,0,1024);
  ocean.addColorStop(0,'#071d2b'); ocean.addColorStop(.5,'#06334a'); ocean.addColorStop(1,'#041923');
  ctx.fillStyle=ocean; ctx.fillRect(0,0,2048,1024);
  const land=[
    [[120,300],[210,220],[340,235],[430,315],[405,420],[300,470],[225,410]],
    [[455,130],[575,105],[680,165],[700,285],[625,330],[555,275],[480,300]],
    [[700,345],[820,300],[905,360],[875,485],[805,555],[745,505]],
    [[960,180],[1080,145],[1165,215],[1120,315],[1015,330],[940,270]],
    [[1135,355],[1245,330],[1310,425],[1275,555],[1170,535],[1110,445]],
    [[1360,170],[1495,145],[1590,215],[1560,330],[1450,345],[1365,285]],
    [[1540,390],[1650,365],[1760,430],[1720,520],[1605,535],[1535,480]],
    [[360,590],[430,540],[500,600],[490,760],[410,875],[345,790]],
    [[720,620],[805,570],[875,650],[850,820],[760,875],[700,760]],
    [[1240,650],[1340,600],[1425,670],[1380,820],[1280,875],[1215,770]],
  ];
  ctx.strokeStyle='#183e43'; ctx.lineWidth=3;
  land.forEach(poly=>{
    ctx.beginPath(); poly.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y)); ctx.closePath();
    const g=ctx.createLinearGradient(0,120,0,900); g.addColorStop(0,'#365b43'); g.addColorStop(.55,'#1f513d'); g.addColorStop(1,'#14372f');
    ctx.fillStyle=g; ctx.fill(); ctx.stroke();
  });
  ctx.globalAlpha=.18; ctx.strokeStyle='#d7e9e5'; ctx.lineWidth=8;
  for(let y=90;y<980;y+=95){ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(500,y-45,1450,y+45,2048,y-10);ctx.stroke();}
  ctx.globalAlpha=1;
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=4;
  return texture;
}

function CityLights({enabled}:{enabled:boolean}){
  const points=useMemo(()=>CITIES.map(c=>latLon(c.lat,c.lon)),[]);
  return <group visible={enabled}>{points.map((p,i)=><group key={i} position={p}>
    <mesh><sphereGeometry args={[0.022 + CITIES[i].light/7600,10,10]}/><meshBasicMaterial color="#ffd37c" toneMapped={false}/></mesh>
    <pointLight color="#ffb84d" intensity={0.55} distance={0.38}/>
  </group>)}</group>;
}

function Atmosphere(){
  return <mesh scale={1.055}>
    <sphereGeometry args={[2,96,96]}/>
    <meshBasicMaterial color="#5db8e5" transparent opacity={0.13} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false}/>
  </mesh>;
}

function Earth({dark,lights}:{dark:boolean;lights:boolean}){
  const ref=useRef<THREE.Group>(null);
  const texture=useMemo(makeEarthTexture,[]);
  useFrame((_,d)=>{ if(ref.current) ref.current.rotation.y += d*0.018; });
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <group ref={ref} position={[1.15,0,0]}>
    <mesh>
      <sphereGeometry args={[2,128,128]}/>
      <meshStandardMaterial map={texture} color={dark?'#9aa6a8':'#ffffff'} roughness={0.86} metalness={0.02} emissive={dark?'#010202':'#030708'} emissiveIntensity={dark?0.08:0.16}/>
    </mesh>
    <CityLights enabled={lights}/>
    <Atmosphere/>
  </group>;
}

function Scene({lights,dark}:{lights:boolean;dark:boolean}){
  return <>
    <color attach="background" args={['#020406']} />
    <ambientLight intensity={dark?0.06:0.16}/>
    <directionalLight position={[-4,2,5]} intensity={dark?0.38:1.05} color="#e3edf3"/>
    <Stars radius={80} depth={45} count={dark?4200:3000} factor={2.1} saturation={0} fade speed={0.25}/>
    <Sparkles count={dark?100:55} scale={9} size={1.2} speed={0.22} opacity={0.32}/>
    <Earth dark={dark} lights={lights}/>
    <OrbitControls enablePan={false} minDistance={3.15} maxDistance={7.5} enableDamping dampingFactor={0.055} rotateSpeed={0.38}/>
  </>;
}

function App(){
  const [lights,setLights]=useState(true), [dark,setDark]=useState(false), [query,setQuery]=useState(''), [city,setCity]=useState<City|null>(null), [time,setTime]=useState(2026), [menu,setMenu]=useState(false);
  const [reduced,setReduced]=useState(false);
  useEffect(()=>{setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)},[]);
  const results=query?CITIES.filter(c=>c.name.toLowerCase().includes(query.toLowerCase())).slice(0,4):[];
  const choose=(c:City)=>{setCity(c);setQuery(c.name)};
  return <main className={dark?'app dark-mode':'app'}>
    <Canvas dpr={[1,1.6]} camera={{position:[0,0,6.5],fov:42}} gl={{antialias:true,powerPreference:'high-performance'}}>
      <Suspense fallback={<Html center><div className="loader">CALIBRATING EARTH…</div></Html>}><Scene lights={lights} dark={dark}/></Suspense>
    </Canvas>
    <div className="grain"/>
    <header><div className="brand"><span className="brand-mark">◉</span><div><b>LIGHT-POLLUTED</b><small>EARTH / NIGHT ATLAS</small></div></div><button className="menu" onClick={()=>setMenu(!menu)} aria-label="Open navigation">{menu?'CLOSE':'MENU'} <span>☰</span></button></header>
    {menu&&<nav className="nav"><button>EXPLORE</button><button>DATA</button><button>CITIES</button><button>NIGHT SKY</button><button>STORY</button><button>ABOUT</button></nav>}
    <section className="hero"><p className="eyebrow">A PLANET AFTER SUNSET</p><h1>WHEN NIGHT<br/><em>NEVER ARRIVES.</em></h1><p className="lede">Explore Earth's artificial night — where cities glow, skies fade, and darkness becomes a disappearing resource.</p><div className="actions"><button className="primary" onClick={()=>document.getElementById('earth')?.scrollIntoView({behavior:reduced?'auto':'smooth'})}>EXPLORE EARTH <span>↗</span></button><button className="secondary" onClick={()=>setDark(!dark)}>{dark?'RESTORE LIGHT':'RESTORE THE DARK'} <span>◐</span></button></div></section>
    <aside className="control-card" id="earth"><div className="card-top"><span>EARTH / NIGHT VIEW</span><span className="status"><i/> LATEST AVAILABLE DATA</span></div><div className="search-wrap"><span>⌕</span><input aria-label="Search city" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search a city…"/>{results.length>0&&<div className="results">{results.map(c=><button key={c.name} onClick={()=>choose(c)}><b>{c.name}</b><span>{c.country}</span></button>)}</div>}</div><div className="toggles"><button className={lights?'active':''} onClick={()=>setLights(!lights)}><i/> CITY LIGHTS <span>{lights?'ON':'OFF'}</span></button><button className={dark?'active':''} onClick={()=>setDark(!dark)}><i/> DARKNESS MODE <span>{dark?'ON':'OFF'}</span></button></div><label className="timeline"><span>THEN</span><input type="range" min="1995" max="2026" value={time} onChange={e=>setTime(+e.target.value)}/><span>{time}</span></label></aside>
    {city&&<section className="city-panel"><button className="close" onClick={()=>setCity(null)}>×</button><p className="eyebrow">CITY PROFILE</p><h2>{city.name}</h2><p>{city.country}</p><div className="metric"><span>ARTIFICIAL LIGHT</span><strong>{city.light}<small>/100</small></strong></div><div className="metric"><span>POPULATION</span><strong>{city.population}</strong></div><p className="note">Illustrative city metric. Connect the production VIIRS pipeline to replace the demo values with measured radiance.</p></section>}
    <footer><span>LIGHT-POLLUTED EARTH © 2026</span><span>DATA VISUALIZATION / SCIENCE / DESIGN</span><span>DRAG TO ROTATE · SCROLL TO EXPLORE</span></footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
