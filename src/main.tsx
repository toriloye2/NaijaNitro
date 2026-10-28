import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { NitroGame, type Telemetry } from './game/NitroGame';
import './style.css';

function App() {
  const canvasHost = useRef<HTMLDivElement>(null);
  const game = useRef<NitroGame | null>(null);
  const [info, setInfo] = useState<Telemetry>({ speed: 0, nitro: 100, lap: 1, time: 0, status: 'Loading engine', drift: false });
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!canvasHost.current) return;
    let cancelled = false;
    const instance = new NitroGame(canvasHost.current, data => { if (!cancelled) setInfo(data); });
    game.current = instance;
    void instance.init().then(() => { if (!cancelled) setReady(true); }).catch(e => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; instance.dispose(); game.current = null; };
  }, []);
  const start = () => { game.current?.start(); setStarted(true); };
  const touch = (key: string, value: boolean) => game.current?.setTouch(key, value);
  return <main>
    <div ref={canvasHost} className="viewport" />
    <header className="hud">
      <div className="panel"><h1>NAIJA <span>NITRO</span></h1><small>🇳🇬 LAGOS ASPHALT · PHYSICS MIGRATION</small><p>LAP {info.lap} / 3</p><p>{info.status}</p></div>
      <div className="panel right"><small>RACE TIME</small><strong>{Math.floor(info.time / 60).toString().padStart(2, '0')}:{(info.time % 60).toFixed(2).padStart(5, '0')}</strong><small>THIRD MAINLAND TEST CIRCUIT</small></div>
    </header>
    <div className="speed panel"><strong>{Math.round(info.speed * 3.6)}</strong> KM/H<div className="bar"><div style={{ width: info.nitro + '%' }} /></div><small>{info.drift ? 'DRIFT' : 'NITRO'} · {Math.round(info.nitro)}%</small></div>
    {!started && <section className="overlay"><div className="welcome"><h2>NAIJA NITRO</h2><p>Real rigid-body collisions with Rapier, rendered in Three.js. Drive a Lagos-inspired test circuit.</p><button disabled={!ready} onClick={start}>{error ? 'ENGINE ERROR' : ready ? 'START DRIVING' : 'LOADING PHYSICS...'}</button>{error && <p role="alert">{error}</p>}<p className="hint">WASD / Arrows · Space drift · Shift nitro · R reset</p></div></section>}
    <nav className="touch" aria-label="Touch driving controls">{[['left','◀'],['right','▶'],['gas','GAS'],['brake','BRAKE'],['drift','DRIFT'],['nitro','NITRO']].map(([key,label]) => <button key={key} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); touch(key,true); }} onPointerUp={() => touch(key,false)} onPointerCancel={() => touch(key,false)} onLostPointerCapture={() => touch(key,false)}>{label}</button>)}</nav>
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
