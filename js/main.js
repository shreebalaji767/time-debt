(() => {
  "use strict";
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const $ = id => document.getElementById(id);
  const ui = {
    start: $("startScreen"), end: $("endScreen"), pause: $("pauseScreen"), logoLink: $("logoLink"), pauseBtn: $("pauseBtn"), exitBtn: $("exitBtn"), landingPlayBtn: $("landingPlayBtn"), gameLayout: $("gameLayout"), landingIntro: $("landingIntro"), resumeBtn: $("resumeBtn"), startBtn: $("startBtn"), retryBtn: $("retryBtn"),
    time: $("timeValue"), timeMeter: $("timeMeter"), debt: $("debtValue"), debtMeter: $("debtMeter"),
    best: $("bestValue"), gates: $("gateValue"), paid: $("paidValue"), level: $("levelLabel"),
    x: $("coordX"), y: $("coordY"), world: $("worldStatus"), latency: $("latency"),
    run: $("runStatus"), toast: $("toast"), sound: $("soundBtn"), soundState: $("soundState")
  };
  const W = 960, H = 600, FLOOR = 526, TOTAL = 45;
  let dpr = 1, running = false, paused = false, ended = false, last = 0, elapsed = 0, debt = 0, paid = 0;
  let soundOn = true, audio = null, toastTimer = 0, shake = 0, frameCount = 0, fpsFrames = 0, fpsTime = 0;
  let player, platforms, hazards, motes, gates, shards, keys = Object.create(null), cameraX = 0, worldTime = 0, borrowedNow = false;
  let best = Number(localStorage.getItem("td-best") || 0);
  let unlocked = Number(localStorage.getItem("td-gates") || 0);
  ui.best.textContent = best ? best.toFixed(1) + "s" : "—";
  ui.gates.innerHTML = Math.min(unlocked, 3) + " <small>/ 3</small>";
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const rand = (a,b) => a + Math.random()*(b-a);
  const mod = (n,m) => ((n%m)+m)%m;

  function resize(){
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width*dpr));
    canvas.height = Math.max(1, Math.round(rect.width*(H/W)*dpr));
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    draw();
  }
  function tone(freq=440,duration=.08,type="sine",volume=.035){
    if(!soundOn) return;
    try{
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if(audio.state==="suspended") audio.resume();
      const osc=audio.createOscillator(), gain=audio.createGain();
      osc.type=type; osc.frequency.setValueAtTime(freq,audio.currentTime);
      gain.gain.setValueAtTime(volume,audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
      osc.connect(gain); gain.connect(audio.destination); osc.start(); osc.stop(audio.currentTime+duration);
    }catch(_){}
  }
  function say(message){
    ui.toast.textContent=message; ui.toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>ui.toast.classList.remove("show"),1500);
  }
  function reset(){
    elapsed=0; debt=0; paid=0; paused=false; worldTime=0; cameraX=0; shake=0; ended=false; borrowedNow=false;
    player={x:68,y:450,w:24,h:34,vx:0,vy:0,ground:false,face:1,trail:[],invuln:0};
    platforms=[
      {x:0,y:FLOOR,w:430,h:74},{x:492,y:FLOOR,w:210,h:74},{x:772,y:FLOOR,w:270,h:74},
      {x:356,y:420,w:112,h:16},{x:548,y:342,w:105,h:16},{x:710,y:435,w:100,h:16},
      {x:914,y:365,w:130,h:16},{x:1088,y:460,w:160,h:16},{x:1310,y:394,w:118,h:16},
      {x:1505,y:326,w:110,h:16},{x:1690,y:435,w:170,h:16},{x:1900,y:365,w:130,h:16},
      {x:2100,y:455,w:200,h:74},{x:2370,y:390,w:130,h:16},{x:2550,y:320,w:150,h:16},
      {x:2780,y:450,w:340,h:74}
    ];
    hazards=[
      {x:270,y:FLOOR-18,w:32,h:18,base:0,range:85,speed:1.25,phase:0},
      {x:605,y:286,w:22,h:34,base:0,range:65,speed:1.5,phase:1.2},
      {x:843,y:FLOOR-20,w:30,h:20,base:0,range:78,speed:1.3,phase:2},
      {x:1170,y:418,w:24,h:34,base:0,range:58,speed:1.8,phase:.4},
      {x:1440,y:350,w:25,h:30,base:0,range:64,speed:1.5,phase:1.8},
      {x:1800,y:392,w:32,h:20,base:0,range:95,speed:1.7,phase:2.7},
      {x:2225,y:FLOOR-20,w:34,h:20,base:0,range:75,speed:1.6,phase:1.4},
      {x:2620,y:278,w:25,h:30,base:0,range:60,speed:1.7,phase:3}
    ];
    hazards.forEach(h=>h.base=h.x);
    gates=[{x:1010,y:456,hit:false},{x:2020,y:456,hit:false},{x:2930,y:380,hit:false}];
    shards=[{x:390,y:382,got:false},{x:640,y:304,got:false},{x:875,y:390,got:false},{x:1195,y:390,got:false},{x:1550,y:288,got:false},{x:1840,y:382,got:false},{x:2415,y:350,got:false},{x:2665,y:280,got:false}];
    motes=Array.from({length:110},()=>({x:rand(0,3100),y:rand(25,520),r:rand(.5,2),p:rand(0,6.28),s:rand(.15,.8)}));
    ui.time.textContent=TOTAL.toFixed(1); ui.timeMeter.style.width="100%";
    ui.debt.innerHTML='0.0<span>s</span>'; ui.debtMeter.style.width="0%";
    ui.paid.innerHTML='0.0<span>s</span>'; ui.world.textContent="WORLD FLOW: 1.0×";
    ui.run.textContent="AWAITING INPUT"; ui.level.textContent="SECTOR 01 / THE BREACH";
    ui.start.classList.remove("hidden"); ui.end.classList.add("hidden"); ui.pause.classList.add("hidden"); ui.pauseBtn.innerHTML="Ⅱ <span>PAUSE</span>";
    ui.gates.innerHTML=Math.min(unlocked,3)+" <small>/ 3</small>";
    draw();
  }
  function showGame(){
    ui.gameLayout.classList.remove("is-hidden");
    ui.pauseBtn.classList.remove("hidden"); ui.exitBtn.classList.remove("hidden");
    ui.landingIntro.classList.add("game-intro");
    ui.gameLayout.scrollIntoView({behavior:"smooth",block:"start"});
  }
  function exitGame(){
    running=false; paused=false; ended=false; keys=Object.create(null);
    ui.gameLayout.classList.add("is-hidden");
    ui.pauseBtn.classList.add("hidden"); ui.exitBtn.classList.add("hidden");
    ui.landingIntro.classList.remove("game-intro");
    reset(); window.scrollTo({top:0,behavior:"smooth"});
  }
  function start(){
    if(running)return;
    reset(); running=true; paused=false; ui.start.classList.add("hidden"); ui.run.textContent="TIMELINE ACTIVE";
    last=performance.now(); tone(520,.12,"triangle"); requestAnimationFrame(loop);
  }
  function setPaused(value){
    if(!running||ended)return;
    paused=Boolean(value);
    ui.pause.classList.toggle("hidden",!paused);
    ui.pauseBtn.innerHTML=paused?"▶ <span>RESUME</span>":"Ⅱ <span>PAUSE</span>";
    ui.run.textContent=paused?"TIMELINE PAUSED":"TIMELINE ACTIVE";
    if(!paused){last=performance.now();requestAnimationFrame(loop);}
  }
  function finish(win,reason){
    if(ended)return; ended=true; running=false;
    ui.end.classList.remove("hidden");
    $("endKicker").textContent=win?"TEMPORAL EXIT CONFIRMED":"TIMELINE COLLAPSED";
    $("endSymbol").textContent=win?"✓":"×";
    $("endTitle").textContent=win?"You escaped time.":"Debt collected.";
    $("endCopy").textContent=win?("Gate reached with "+Math.max(0,TOTAL-elapsed).toFixed(1)+" seconds remaining. The future is yours."):reason;
    ui.run.textContent=win?"RUN COMPLETE":"RUN TERMINATED";
    if(win){
      if(!best||elapsed<best){best=elapsed;localStorage.setItem("td-best",String(best));ui.best.textContent=best.toFixed(1)+"s";}
      unlocked=Math.max(unlocked,3);localStorage.setItem("td-gates",String(unlocked));ui.gates.innerHTML="3 <small>/ 3</small>";
      tone(660,.15,"triangle");setTimeout(()=>tone(880,.22,"triangle"),100);
    }else{shake=10;tone(110,.4,"sawtooth",.045);}
  }
  function jump(){
    if(!running||ended)return;
    if(player.ground){player.vy=-590;player.ground=false;tone(270,.055,"triangle",.02);}
  }
  function borrow(){return running&&!ended&&(keys.KeyE||keys.ShiftLeft||keys.ShiftRight||keys[" " + "Borrow"]);}
  function update(dt){
    if(ended)return;
    elapsed+=dt;
    if(elapsed>=TOTAL){elapsed=TOTAL;ui.time.textContent="0.0";ui.timeMeter.style.width="0%";finish(false,"Your reserve reached zero. Time always collects.");return;}
    const isBorrow=keys.KeyE||keys.ShiftLeft||keys.ShiftRight;
    const wasBorrow=borrowedNow; borrowedNow=isBorrow && elapsed<TOTAL-1;
    let flow=1;
    if(borrowedNow){debt=Math.min(12,debt+dt*1.65);flow=.12;if(!wasBorrow){say("TIME BORROWED // HAZARDS FROZEN");tone(180,.16,"sine");}}
    else if(debt>0){const due=Math.min(debt,dt*2);debt-=due;paid+=due;flow=2.05;if(wasBorrow){say("DEBT COLLECTOR ACTIVE // 2.05×");tone(360,.1,"sawtooth",.025);}}
    else flow=1;
    worldTime+=dt*flow;
    const left=TOTAL-elapsed;
    ui.time.textContent=left.toFixed(1);ui.timeMeter.style.width=(left/TOTAL*100)+"%";
    ui.time.style.color=left<10?"var(--red)":"var(--cyan)";
    ui.debt.innerHTML=debt.toFixed(1)+'<span>s</span>';ui.debtMeter.style.width=(debt/12*100)+"%";
    ui.paid.innerHTML=paid.toFixed(1)+'<span>s</span>';ui.world.textContent="WORLD FLOW: "+flow.toFixed(2)+"×";
    const accel=borrowedNow?0:flow;
    const dir=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0);
    player.vx=dir*245; if(dir)player.face=dir;
    player.x+=player.vx*dt; player.x=clamp(player.x,0,3060);
    player.vy+=1350*dt;player.y+=player.vy*dt;player.ground=false;
    const prevY=player.y-player.vy*dt;
    for(const p of platforms){
      if(player.x+player.w>p.x&&player.x<p.x+p.w&&prevY+player.h<=p.y+5&&player.y+player.h>=p.y&&player.vy>=0){
        player.y=p.y-player.h;player.vy=0;player.ground=true;
      }
    }
    if(player.y>H+90){finish(false,"You fell outside the timeline. Find the next platform.");return;}
    for(const h of hazards){
      if(!borrowedNow)h.x=h.base+Math.sin(worldTime*h.speed+h.phase)*h.range;
      if(!borrowedNow&&player.invuln<=0&&player.x+player.w>h.x&&player.x<h.x+h.w&&player.y+player.h>h.y&&player.y<h.y+h.h){
        player.invuln=.9;player.vy=-340;player.vx=-player.face*140;elapsed=Math.min(TOTAL,elapsed+2.5);shake=8;say("PARADOX HIT // 2.5 SEC LOST");tone(90,.2,"square",.035);
      }
    }
    player.invuln=Math.max(0,player.invuln-dt);
    if(!borrowedNow&&player.invuln<=0){
      // brief collision immunity after impact
    }
    shards.forEach(s=>{
      if(!s.got && player.x+player.w>s.x-10 && player.x<s.x+10 && player.y+player.h>s.y-10 && player.y<s.y+10){
        s.got=true; elapsed=Math.max(0,elapsed-2.5); say("CHRONO SHARD // +2.5 SEC"); tone(820,.12,"triangle");
      }
    });
    gates.forEach((g,i)=>{
      if(!g.hit&&player.x+player.w>g.x&&player.x<g.x+28&&player.y+player.h>g.y-45&&player.y<g.y+48){
        g.hit=true;unlocked=Math.max(unlocked,i+1);localStorage.setItem("td-gates",String(unlocked));
        ui.gates.innerHTML=Math.min(unlocked,3)+" <small>/ 3</small>";say("GATE "+String(i+1).padStart(2,"0")+" STABILIZED");tone(740,.15,"triangle");
      }
    });
    if(player.x>2885&&player.y<470){finish(true);return;}
    player.trail.push({x:player.x+player.w/2,y:player.y+player.h/2,a:1});
    if(player.trail.length>12)player.trail.shift();
    player.trail.forEach(t=>t.a-=dt*1.8);
    cameraX=clamp(player.x- W*.32,0, W*2.25);
    ui.x.textContent=String(Math.round(player.x)).padStart(3,"0");ui.y.textContent=String(Math.round(player.y)).padStart(3,"0");
    ui.level.textContent=player.x<1000?"SECTOR 01 / THE BREACH":player.x<2000?"SECTOR 02 / LOST FUTURE":"SECTOR 03 / LAST CHANCE";
    if(elapsed>=TOTAL)finish(false,"Your reserve reached zero. Time always collects.");
  }
  function line(x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function draw(){
    ctx.save();ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    ctx.fillStyle="#080d16";ctx.fillRect(0,0,W,H);
    const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#0b1524");bg.addColorStop(1,"#080d16");ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    // Procedural star field and parallax grid.
    for(let i=0;i<110;i++){const x=mod(i*137.3-cameraX*.12,W),y=mod(i*73.7,H);ctx.globalAlpha=.15+(Math.sin(worldTime*.7+i)*.1+.1);ctx.fillStyle=i%5===0?"#ffb454":"#8bdce9";ctx.fillRect(x,y,i%7===0?2:1,1);}
    ctx.globalAlpha=1;
    for(let x=-mod(cameraX*.35,48);x<W;x+=48)line(x,0,x,H,"#142235",1);
    for(let y=28;y<H;y+=48)line(0,y,W,y,"#142235",1);
    // Distant broken skyline.
    for(let i=0;i<26;i++){const x=mod(i*113-cameraX*.23, W+130)-40;const h=55+mod(i*41,140);ctx.fillStyle="#0a111e";ctx.fillRect(x,FLOOR-h,35+mod(i*17,42),h);line(x,FLOOR-h,x+35+mod(i*17,42),FLOOR-h,"#1b3446",1);}
    ctx.save();ctx.translate(-cameraX,0);
    // platforms
    for(const p of platforms){
      ctx.fillStyle="#101d2b";ctx.fillRect(p.x,p.y,p.w,p.h);
      ctx.fillStyle="#27465a";ctx.fillRect(p.x,p.y,p.w,2);
      for(let xx=p.x+10;xx<p.x+p.w;xx+=28){line(xx,p.y+8,xx,p.y+p.h,"#16283a",1);}
      ctx.fillStyle="#24465a";ctx.fillRect(p.x+7,p.y+8,12,2);
    }
    // Collectible chrono shards, drawn entirely in Canvas.
    shards?.forEach((s,i)=>{if(s.got)return;const pulse=1+Math.sin(worldTime*5+i)*.15;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(worldTime*.8+i);ctx.scale(pulse,pulse);ctx.shadowBlur=18;ctx.shadowColor="#5de7f4";ctx.fillStyle="#bafaff";ctx.beginPath();ctx.moveTo(0,-9);ctx.lineTo(7,0);ctx.lineTo(0,9);ctx.lineTo(-7,0);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle="#5de7f4";ctx.stroke();ctx.restore();});
    // Gate markers and exit portal
    gates.forEach((g,i)=>{
      ctx.globalAlpha=g.hit?.3:1;
      ctx.strokeStyle=g.hit?"#5de7f4":"#ffb454";ctx.lineWidth=2;ctx.strokeRect(g.x,g.y-44,28,44);
      line(g.x+5,g.y-34,g.x+23,g.y-34,g.hit?"#5de7f4":"#ffb454",1);
      ctx.fillStyle=g.hit?"#5de7f4":"#ffb454";ctx.font="9px monospace";ctx.fillText("G"+(i+1),g.x+4,g.y-52);
      ctx.globalAlpha=1;
    });
    // Exit beacon.
    const pulse=1+Math.sin(worldTime*4)*.1;
    ctx.save();ctx.translate(2985,410);ctx.scale(pulse,pulse);
    ctx.shadowBlur=30;ctx.shadowColor="#5de7f4";ctx.strokeStyle="#5de7f4";ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,29,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,19,-Math.PI/2,Math.PI*1.5);ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle="#c7fbff";ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();ctx.restore();
    // Hazard sentinels.
    hazards.forEach((h,i)=>{
      ctx.save();ctx.translate(h.x+h.w/2,h.y+h.h/2);
      const col=borrowedNow?"#5de7f4":"#ff5d70";
      ctx.shadowBlur=borrowedNow?22:12;ctx.shadowColor=col;ctx.fillStyle=col;
      if(h.h>h.w){ctx.beginPath();ctx.moveTo(0,-h.h/2);ctx.lineTo(h.w/2,h.h/2);ctx.lineTo(-h.w/2,h.h/2);ctx.closePath();ctx.fill();}
      else{ctx.fillRect(-h.w/2,-h.h/2,h.w,h.h);ctx.fillStyle="#101722";ctx.fillRect(-h.w/4,-h.h/4,h.w/2,h.h/2);}
      ctx.shadowBlur=0;ctx.restore();
      if(borrowedNow){ctx.strokeStyle="#5de7f455";ctx.setLineDash([3,5]);ctx.beginPath();ctx.arc(h.x+h.w/2,h.y+h.h/2,22+Math.sin(worldTime*4+i)*3,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
    });
    // Player temporal afterimages
    player?.trail?.forEach(t=>{if(t.a<=0)return;ctx.globalAlpha=clamp(t.a,0,.28);ctx.fillStyle="#5de7f4";ctx.fillRect(t.x-8,t.y-11,16,22);});ctx.globalAlpha=1;
    if(player){
      const px=player.x,py=player.y;
      ctx.save();ctx.translate(px+player.w/2,py+player.h/2);
      const blink=player.invuln>0&&Math.floor(performance.now()/65)%2===0;
      if(!blink){
        ctx.shadowBlur=borrowedNow?26:14;ctx.shadowColor=borrowedNow?"#5de7f4":"#56c6d8";
        ctx.fillStyle="#d5fbff";ctx.fillRect(-player.w/2,-player.h/2,player.w,player.h);
        ctx.shadowBlur=0;ctx.fillStyle="#0b1826";ctx.fillRect(player.face===1?1:-7,-7,6,5);
        ctx.fillStyle="#5de7f4";ctx.fillRect(-player.w/2+3,player.h/2-5,player.w-6,3);
      }
      ctx.restore();
      // borrow aura
      if(borrowedNow){ctx.strokeStyle="#5de7f477";ctx.lineWidth=1;ctx.beginPath();ctx.arc(px+12,py+17,30+Math.sin(worldTime*9)*3,0,Math.PI*2);ctx.stroke();}
    }
    ctx.restore();
    // HUD overlays on canvas
    if(borrowedNow){ctx.fillStyle="#5de7f40b";ctx.fillRect(0,0,W,H);ctx.strokeStyle="#5de7f4";ctx.globalAlpha=.55;ctx.lineWidth=2;ctx.strokeRect(8,8,W-16,H-16);ctx.globalAlpha=1;}
    // screen scanlines
    ctx.fillStyle="#d6f7ff06";for(let y=0;y<H;y+=4)ctx.fillRect(0,y,W,1);
    if(shake>0){shake=Math.max(0,shake-.7);}
    ctx.restore();
  }
  function loop(now){
    if(!running||paused)return;
    const dt=Math.min((now-last)/1000,.033);last=now;
    update(dt);draw();
    fpsFrames++;fpsTime+=dt;if(fpsTime>=.5){ui.latency.textContent=String(Math.round(fpsTime*1000/fpsFrames)).padStart(2,"0");fpsFrames=0;fpsTime=0;}
    if(running)requestAnimationFrame(loop);
  }
  window.addEventListener("keydown",e=>{
    const code=e.code;
    if(["ArrowLeft","ArrowRight","ArrowUp","Space","ShiftLeft","ShiftRight"].includes(code))e.preventDefault();
    keys[code]=true;
    if((code==="Space"||code==="ArrowUp"||code==="KeyW")&&!e.repeat)jump();
    if(code==="Enter"&&!running&&!ui.gameLayout.classList.contains("is-hidden"))start();
    if((code==="KeyP"||code==="Escape")&&running&&!ended){setPaused(!paused);return;}
    if(code==="KeyR"&&ended)start();
  });
  window.addEventListener("keyup",e=>{keys[e.code]=false;});
  window.addEventListener("blur",()=>{keys=Object.create(null);if(running&&!ended)setPaused(true);});
  // Pointer/touch controls are intentionally integrated into the playfield.
  let touchX=null;
  canvas.addEventListener("pointerdown",e=>{
    if(!running)return;
    canvas.setPointerCapture?.(e.pointerId);
    const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width;
    if(x<.3)keys.ArrowLeft=true;else if(x<.62)keys.ArrowRight=true;else jump();
    touchX=e.pointerId;
  });
  canvas.addEventListener("pointerup",e=>{if(touchX===e.pointerId){keys.ArrowLeft=false;keys.ArrowRight=false;touchX=null;}});
  canvas.addEventListener("pointercancel",()=>{keys.ArrowLeft=false;keys.ArrowRight=false;touchX=null;});
  ui.logoLink.addEventListener("click",e=>{e.preventDefault();if(!ui.gameLayout.classList.contains("is-hidden"))exitGame();else window.scrollTo({top:0,behavior:"smooth"});});
  ui.landingPlayBtn.addEventListener("click",()=>{showGame();});
  ui.exitBtn.addEventListener("click",exitGame);
  ui.startBtn.addEventListener("click",start);ui.retryBtn.addEventListener("click",start);
  ui.pauseBtn.addEventListener("click",()=>setPaused(!paused));ui.resumeBtn.addEventListener("click",()=>setPaused(false));
  document.querySelectorAll("[data-control]").forEach(button=>{
    const control=button.dataset.control;
    const down=e=>{e.preventDefault();button.classList.add("is-active");if(control==="left")keys.ArrowLeft=true;else if(control==="right")keys.ArrowRight=true;else if(control==="jump")jump();else if(control==="borrow")keys.KeyE=true;};
    const up=e=>{e.preventDefault();button.classList.remove("is-active");if(control==="left")keys.ArrowLeft=false;else if(control==="right")keys.ArrowRight=false;else if(control==="borrow")keys.KeyE=false;};
    button.addEventListener("pointerdown",down);button.addEventListener("pointerup",up);button.addEventListener("pointercancel",up);button.addEventListener("lostpointercapture",up);
  });
  ui.sound.addEventListener("click",()=>{soundOn=!soundOn;ui.soundState.textContent=soundOn?"ON":"OFF";ui.sound.style.color=soundOn?"var(--cyan)":"#718096";if(soundOn)tone(600,.08);});
  window.addEventListener("resize",resize);
  reset();resize();
})();