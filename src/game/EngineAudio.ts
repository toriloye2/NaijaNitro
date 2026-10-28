/**
 * Procedural Web Audio synthesizer: engine RPM, rushing wind and nitro hiss.
 * No copyrighted samples and no network downloads required.
 */
export class EngineAudio {
  private context: AudioContext | null = null;
  private motor: OscillatorNode | null = null;
  private overtone: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private nitroGain: GainNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private enabled = false;
  async start() {
    if (!this.context) {
      const ctx = new AudioContext();
      this.context = ctx;
      const motor = ctx.createOscillator(), overtone = ctx.createOscillator();
      motor.type = 'sawtooth'; overtone.type = 'triangle';
      const motorGain = ctx.createGain(), overtoneGain = ctx.createGain();
      const lowPass = ctx.createBiquadFilter(); lowPass.type = 'lowpass'; lowPass.frequency.value = 750;
      motor.connect(motorGain).connect(lowPass);
      overtone.connect(overtoneGain).connect(lowPass);
      lowPass.connect(ctx.destination);
      motorGain.gain.value = 0; overtoneGain.gain.value = .0;
      motor.start(); overtone.start();
      this.motor=motor; this.overtone=overtone; this.motorGain=motorGain;
      const seconds = 2, buffer = ctx.createBuffer(1, ctx.sampleRate*seconds,ctx.sampleRate);
      const samples=buffer.getChannelData(0);
      let last=0;
      for(let i=0;i<samples.length;i++){const noise=Math.random()*2-1;last=.96*last+.04*noise;samples[i]=last;}
      const wind=ctx.createBufferSource();wind.buffer=buffer;wind.loop=true;
      const windGain=ctx.createGain(),nitroGain=ctx.createGain();
      const filter=ctx.createBiquadFilter();filter.type='highpass';filter.frequency.value=520;
      wind.connect(filter);filter.connect(windGain).connect(ctx.destination);
      const nitroFilter=ctx.createBiquadFilter();nitroFilter.type='bandpass';nitroFilter.frequency.value=1300;
      wind.connect(nitroFilter);nitroFilter.connect(nitroGain).connect(ctx.destination);
      windGain.gain.value=0;nitroGain.gain.value=0;wind.start();
      this.windSource=wind;this.windGain=windGain;this.nitroGain=nitroGain;
      overtoneGain.gain.value=.02;
    }
    await this.context.resume();this.enabled=true;
  }
  setMuted(muted:boolean){this.enabled=!muted;}
  update(speed:number,boost:boolean,active:boolean) {
    const ctx=this.context;if(!ctx)return;
    const t=ctx.currentTime,ratio=Math.min(Math.abs(speed)/80,1),on=active&&this.enabled;
    this.motor?.frequency.setTargetAtTime(48+ratio*125+(boost?25:0),t,.07);
    this.overtone?.frequency.setTargetAtTime(96+ratio*250,t,.07);
    this.motorGain?.gain.setTargetAtTime(on ? .016+ratio*.027 : 0,t,.09);
    this.windGain?.gain.setTargetAtTime(on ? .025+ratio*.22 : 0,t,.1);
    this.nitroGain?.gain.setTargetAtTime(on&&boost ? .4 : 0,t,.05);
  }
  dispose(){this.windSource?.stop();this.motor?.stop();this.overtone?.stop();void this.context?.close();this.context=null;}
}
