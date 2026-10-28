import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { NitroGame, type Telemetry } from './game/NitroGame';
import './style.css';

const blank: Telemetry = { speed:0, nitro:100, lap:1, time:0, status:'Loading', drift:false, boosting:false, phase:'menu', countdown:0, progress:0 };
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
        <div className="race-label">THIRD MAINLAND BRIDGE · LAGOS 🇳🇬</div>
        <div className="race-stat"><span>LAP</span><strong>{info.lap}<em>/3</em></strong></div>
        <div className="race-stat"><span>DIST.</span><strong>{Math.min(100,Math.floor(info.progress*100))}%</strong></div>
        <div className="race-status">{info.status}</div>
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
    {info.phase==='menu'&&<section className="front">
      <div className="front-stripe"/>
      <div className="front-content">
        <p className="eyebrow">🇳🇬 AN ORIGINAL NIGERIAN RACING EXPERIENCE</p>
        <h1 className="logo"><span>NAIJA</span><b>NITRO</b></h1>
        <div className="title-rule"/>
        <p className="subtitle">LAGOS ASPHALT <span>·</span> CAMRY MUSCLE EDITION</p>
        <h2>OWN THE <em>STREETS.</em><br/>RULE THE RACE.</h2>
        <p className="description">Take the Nigerian-favourite Camry Muscle across a stylized Third Mainland Bridge. Feel every turn, unleash blue nitro flames, and race the Lagos skyline.</p>
        <div className="menu-buttons">
          <button className="play-button" disabled={!ready||!!error} onClick={begin}>{error?'ENGINE ERROR':ready?'🏁 START RACE':'LOADING GAME...'}</button>
          <button className="outline-button" onClick={()=>setHelp(v=>!v)}>{help?'CLOSE CONTROLS':'HOW TO PLAY'}</button>
        </div>
        {help&&<div className="help">W / ↑ Accelerate · S / ↓ Brake · A / D Steer · Space Drift · Shift Nitro · P Pause · R Restart</div>}
        {error&&<p className="error" role="alert">{error}</p>}
      </div>
      <div className="edition"><strong>2010</strong><span>CAMRY MUSCLE<br/>LAGOS EDITION</span></div>
      <footer className="front-footer">PROTOTYPE BUILD · THREE.JS + RAPIER · MADE FOR BROWSER RACING</footer>
    </section>}
    {info.phase==='paused'&&<section className="modal-overlay">
      <div className="modal"><p className="eyebrow">LAGOS ASPHALT</p><h2>RACE PAUSED</h2><p>Your Camry is ready when you are.</p>
        <button className="play-button" onClick={()=>game.current?.togglePause()}>▶ RESUME</button>
        <button className="outline-button" onClick={()=>game.current?.backToMenu()}>MAIN MENU</button>
      </div>
    </section>}
    {info.phase==='finished'&&<section className="modal-overlay">
      <div className="modal"><p className="eyebrow">THIRD MAINLAND BRIDGE</p><h2>FINISH LINE! 🏁</h2><div className="final-time">{formatted(info.time)}</div>
        <button className="play-button" onClick={begin}>RACE AGAIN</button>
        <button className="outline-button" onClick={()=>game.current?.backToMenu()}>MAIN MENU</button>
      </div>
    </section>}
    {(info.phase==='race'||info.phase==='countdown')&&<nav className="touch" aria-label="Touch controls">{[['left','◀'],['right','▶'],['gas','GAS'],['brake','BRAKE'],['drift','DRIFT'],['nitro','⚡ NITRO']].map(([key,label])=><button key={key} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);touch(key,true)}} onPointerUp={()=>touch(key,false)} onPointerCancel={()=>touch(key,false)} onLostPointerCapture={()=>touch(key,false)}>{label}</button>)}</nav>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
