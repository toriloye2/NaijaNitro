import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { NitroGame, type Telemetry } from './game/NitroGame';
import './style.css';

const paints = [
  { name:'Pearl Silver', color:0xd7dde4 },
  { name:'Lagos Green', color:0x08b77d },
  { name:'Midnight Black', color:0x202b38 },
  { name:'Sunset Red', color:0xc52b3c },
  { name:'Electric Blue', color:0x296de0 },
  { name:'Champagne Gold', color:0xb59a66 },
] as const;
const blank: Telemetry = { speed:0, nitro:100, lap:1, time:0, status:'Loading', drift:false, boosting:false, phase:'menu', countdown:0, progress:0, position:8, rivals:8, bestLap:0, lapTime:0 };
const formatted = (t:number) => {
  const minutes = String(Math.floor(t/60)).padStart(2,'0');
  const seconds = String(Math.floor(t%60)).padStart(2,'0');
  const hundredths = String(Math.floor(t*100)%100).padStart(2,'0');
  return minutes+':'+seconds+'.'+hundredths;
};

function App() {
  const mount = useRef<HTMLDivElement>(null);
  const game = useRef<NitroGame | null>(null);
  const [info,setInfo] = useState<Telemetry>(blank);
  const [ready,setReady] = useState(false);
  const [error,setError] = useState('');
  const [muted,setMuted] = useState(false);
  const [help,setHelp] = useState(false);
  const [paintIndex,setPaintIndex] = useState(0);
  const [garageTab,setGarageTab] = useState<'garage'|'race'|'customize'>('garage');
  useEffect(() => {
    if(!mount.current) return;
    let cancelled=false;
    const instance=new NitroGame(mount.current, d=>{if(!cancelled)setInfo(d)});
    game.current=instance;
    void instance.init().then(()=>{if(!cancelled)setReady(true)}).catch(e=>{if(!cancelled)setError(String(e))});
    return ()=>{cancelled=true;instance.dispose();game.current=null};
  },[]);
  const begin=()=>{setHelp(false);void game.current?.start()};
  const touch=(key:string,value:boolean)=>game.current?.setTouch(key,value);
  const selectPaint=(i:number)=>{setPaintIndex(i);game.current?.setPaint(paints[i].color)};
  const toggleSound=()=>{game.current?.setMuted(!muted);setMuted(!muted)};
  const active=info.phase==='race'||info.phase==='countdown'||info.phase==='paused'||info.phase==='finished';
  return <main className={info.boosting?'boosting':''}>
    <div ref={mount} className="viewport"/>
    <div className="vignette" aria-hidden="true"/>
    <div className="nitro-wash" aria-hidden="true"/>
    <div className="wind-overlay" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/></div>
    {active&&<header className="hud">
      <div className="race-panel">
        <div className="race-brand">NAIJA <b>NITRO</b></div>
        <div className="race-label">THIRD MAINLAND BRIDGE · 8-CAR RACE 🇳🇬</div>
        <div className="race-stat highlight-position"><span>POSITION</span><strong>{info.position}<em>/8</em></strong></div>
        <div className="race-stat"><span>LAP</span><strong>{info.lap}<em>/3</em></strong></div>
        <div className="race-stat"><span>DIST.</span><strong>{Math.min(100,Math.floor(info.progress*100))}%</strong></div>
        <div className="race-status">{info.status}</div>
        <div className="best-lap">BEST LAP · {info.bestLap>0 ? formatted(info.bestLap) : "--:--.--"}</div>
      </div>
      <div className="race-right">
        <button className="icon-button" aria-label="Pause or resume" onClick={()=>game.current?.togglePause()}>{info.phase==='paused'?'▶':'Ⅱ'}</button>
        <div className="clock"><small>RACE TIME</small><strong>{formatted(info.time)}</strong></div>
        <button className="icon-button sound" onClick={toggleSound} aria-label={muted?'Unmute':'Mute'}>{muted?'🔇':'🔊'}</button>
      </div>
    </header>}
    {active&&<section className="speed-hud" aria-label="Speed and nitro">
      <div className="speed-title">{info.boosting?'PERFECT NITRO':'SPEED'}</div>
      <div className="speed-digits">{Math.round(Math.abs(info.speed)*3.6)} <span>KM/H</span></div>
      <div className="nitro-track"><div style={{width:info.nitro+'%'}}/></div>
      <div className="nitro-label"><span>⚡ NITRO</span><span>{Math.round(info.nitro)}%</span></div>
      <div className="drift-indicator">{info.boosting?'⚡ BOOST ACTIVE':info.drift?'↝ DRIFTING':'SHIFT · NITRO / SPACE · DRIFT'}</div>
    </section>}
    {info.phase==='countdown'&&<div className="countdown" aria-live="polite">{info.countdown>0?Math.ceil(info.countdown):'GO!'}</div>}
    {info.phase==='menu'&&<section className="garage-ui">
      <div className="garage-shade"/>
      <header className="garage-header">
        <div className="garage-logo"><span>NAIJA</span><b>NITRO</b><small>🇳🇬 LAGOS RACING DIVISION</small></div>
        <div className="garage-racer"><span className="garage-racer-icon">NN</span><span>STREET RACER<br/><strong>WELCOME TO LAGOS</strong></span></div>
      </header>
      <aside className="garage-side">
        <span className="garage-eyebrow">YOUR GARAGE / 01</span>
        <h1>THE <em>STREET S1</em></h1>
        <p className="garage-model">NN S1 · LAGOS STREET EDITION</p>
        <span className="garage-flag">🇳🇬 NIGERIA COLLECTION</span>
        <div className="garage-stats">
          <div><span>TOP SPEED</span><div className="stat-meter"><i style={{width:'78%'}}/></div><b>78</b></div>
          <div><span>ACCELERATION</span><div className="stat-meter"><i style={{width:'72%'}}/></div><b>72</b></div>
          <div><span>HANDLING</span><div className="stat-meter"><i style={{width:'66%'}}/></div><b>66</b></div>
          <div><span>NITRO</span><div className="stat-meter"><i style={{width:'85%'}}/></div><b>85</b></div>
        </div>
        <div className="garage-paint">
          <span className="garage-eyebrow">PAINT FINISH <b>{paints[paintIndex].name.toUpperCase()}</b></span>
          <div className="paint-options">{paints.map((p,i)=><button key={p.name}
            className={i===paintIndex?'selected':''} aria-label={'Paint: '+p.name}
            aria-pressed={i===paintIndex} title={p.name} style={{background:'#'+p.color.toString(16).padStart(6,'0')}}
            onClick={()=>selectPaint(i)} />)}</div>
        </div>
      </aside>
      <div className="garage-rotate"><button onClick={()=>game.current?.rotateShowroom(-1)} aria-label="Rotate car left">⟲</button><span>ROTATE CAR</span><button onClick={()=>game.current?.rotateShowroom(1)} aria-label="Rotate car right">⟳</button></div>
      <aside className="garage-right">
        <div className="location-tag"><span>TRACK 01</span><strong>THIRD MAINLAND BRIDGE</strong><small>LAGOS LAGOON · NIGERIA</small></div>
        <div className="race-tile"><span>FEATURED EVENT</span><strong>THE LAGOS SPRINT</strong><small>8 RACERS · 3 LAPS · ARCADE</small></div>
        {garageTab==='customize'&&<div className="garage-info">Select a paint finish on the left to change your NN S1. More upgrades are planned.</div>}
        {garageTab==='race'&&<div className="garage-info">Three laps, seven rivals, nitro pickups. Win the Lagos Sprint!</div>}
        {help&&<div className="garage-info">W / ↑ Accelerate · S / ↓ Brake · A / D Steer · Space Drift · Shift Nitro · P Pause · R Restart</div>}
      </aside>
      <nav className="garage-nav">
        <button className={garageTab==='garage'?'active':''} onClick={()=>{setGarageTab('garage');setHelp(false)}}>⌂ <span>GARAGE</span></button>
        <button className={garageTab==='customize'?'active':''} onClick={()=>{setGarageTab('customize');setHelp(false)}}>◈ <span>CUSTOMIZE</span></button>
        <button onClick={()=>setHelp(v=>!v)}>ⓘ <span>CONTROLS</span></button>
        <button className="garage-race" disabled={!ready||!!error} onClick={begin}>
          {error?'ENGINE ERROR':ready?'🏁 RACE NOW':'LOADING...'}
        </button>
      </nav>
      {error&&<p className="garage-error" role="alert">{error}</p>}
    </section>}
    {info.phase==='paused'&&<section className="modal-overlay">
      <div className="modal"><p className="eyebrow">LAGOS ASPHALT</p><h2>RACE PAUSED</h2><p>Your street machine is ready when you are.</p>
        <button className="play-button" onClick={()=>game.current?.togglePause()}>▶ RESUME</button>
        <button className="outline-button" onClick={()=>game.current?.backToMenu()}>MAIN MENU</button>
      </div>
    </section>}
    {info.phase==='finished'&&<section className="modal-overlay">
      <div className="modal"><p className="eyebrow">THIRD MAINLAND BRIDGE</p><h2>FINISH LINE! 🏁</h2><div className="final-time">{formatted(info.time)}</div><p>FINISHED P{info.position}/8 · BEST LAP {info.bestLap>0?formatted(info.bestLap):"—"}</p>
        <button className="play-button" onClick={begin}>RACE AGAIN</button>
        <button className="outline-button" onClick={()=>game.current?.backToMenu()}>MAIN MENU</button>
      </div>
    </section>}
    {(info.phase==='race'||info.phase==='countdown')&&<nav className="touch" aria-label="Touch controls">{[['left','◀'],['right','▶'],['gas','GAS'],['brake','BRAKE'],['drift','DRIFT'],['nitro','⚡ NITRO']].map(([key,label])=><button key={key} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);touch(key,true)}} onPointerUp={()=>touch(key,false)} onPointerCancel={()=>touch(key,false)} onLostPointerCapture={()=>touch(key,false)}>{label}</button>)}</nav>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
