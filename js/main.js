(() => {
  "use strict";
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const $ = id => document.getElementById(id);
  const ui = {
    start: $("startScreen"), end: $("endScreen"), pause: $("pauseScreen"), logoLink: $("logoLink"), pauseBtn: $("pauseBtn"), exitBtn: $("exitBtn"), landingPlayBtn: $("landingPlayBtn"), gameLayout: $("gameLayout"), landingIntro: $("landingIntro"), resumeBtn: $("resumeBtn"), startBtn: $("startBtn"), retryBtn: $("retryBtn"),
    difficulty: $("difficultySelect"), levelSelect: $("levelSelect"), time: $("timeValue"), timeMeter: $("timeMeter"), debt: $("debtValue"), debtMeter: $("debtMeter"),
    best: $("bestValue"), gates: $("gateValue"), shards: $("shardValue"), runs: $("runsValue"), paid: $("paidValue"), level: $("levelLabel"),
    x: $("coordX"), y: $("coordY"), world: $("worldStatus"), latency: $("latency"),
    run: $("runStatus"), toast: $("toast"), sound: $("soundBtn"), soundState: $("soundState")
  };
  // Standalone gameplay preview using the actual level geometry and movement rules.
  // This simulation is isolated from the playable run below.
  const previewCanvas = $("worldPreviewCanvas");
  const previewCtx = previewCanvas ? previewCanvas.getContext("2d") : null;
  const previewFlow = $("previewFlow");
  const previewSector = document.querySelector(".preview-bottom span:first-child");
  const preview = {
    time: 0, worldTime: 0, debt: 0, flow: 1, x: 68, y: 450, vx: 245, vy: 0,
    grounded: false, jumpLock: 0, cam: 0, shards: 0, gates: 0, invuln: 0,
    playerW: 24, playerH: 34, paused: false
  };
  // Mirror the playable level geometry so the preview teaches the same route.
  const previewPlatforms = [
    {x:0,y:526,w:430,h:74},{x:492,y:526,w:210,h:74},{x:772,y:526,w:270,h:74},
    {x:356,y:420,w:112,h:16},{x:548,y:342,w:105,h:16},{x:710,y:435,w:100,h:16},
    {x:914,y:365,w:130,h:16},{x:1088,y:460,w:160,h:16},{x:1310,y:394,w:118,h:16},
    {x:1505,y:326,w:110,h:16},{x:1690,y:435,w:170,h:16},{x:1900,y:365,w:130,h:16},
    {x:2100,y:455,w:200,h:74},{x:2370,y:390,w:130,h:16},{x:2550,y:320,w:150,h:16},
    {x:2780,y:450,w:340,h:74}
  ];
  const previewHazards = [
    {x:270,y:508,w:32,h:18,base:270,range:85,speed:1.25,phase:0},
    {x:605,y:286,w:22,h:34,base:605,range:65,speed:1.5,phase:1.2},
    {x:843,y:506,w:30,h:20,base:843,range:78,speed:1.3,phase:2},
    {x:1170,y:418,w:24,h:34,base:1170,range:58,speed:1.8,phase:.4},
    {x:1440,y:350,w:25,h:30,base:1440,range:64,speed:1.5,phase:1.8},
    {x:1800,y:392,w:32,h:20,base:1800,range:95,speed:1.7,phase:2.7},
    {x:2225,y:506,w:34,h:20,base:2225,range:75,speed:1.6,phase:1.4},
    {x:2620,y:278,w:25,h:30,base:2620,range:60,speed:1.7,phase:3}
  ];
  const previewShards = [
    {x:390,y:382},{x:640,y:304},{x:875,y:390},{x:1195,y:390},
    {x:1550,y:288},{x:1840,y:382},{x:2415,y:350},{x:2665,y:280}
  ].map(s=>({...s,got:false}));
  const previewGates = [{x:1010,y:456},{x:2020,y:456},{x:2930,y:380}].map(g=>({...g,hit:false}));
  function previewReset(){
    preview.time=0;preview.worldTime=0;preview.debt=0;preview.flow=1;preview.x=68;preview.y=450;preview.vy=0;preview.invuln=0;
    preview.grounded=false;preview.jumpLock=0;preview.cam=0;preview.shards=0;preview.gates=0;
    previewShards.forEach(s=>s.got=false);previewGates.forEach(g=>g.hit=false);
  }
  function updateWorldPreview(dt){
    const p=preview;
    p.time+=dt;
    // Demonstrate the real borrow/repay cycle in short, readable intervals.
    const phase=p.time%12;
    const borrowing=phase>5.1&&phase<7.1;
    if(borrowing){p.debt=Math.min(12,p.debt+dt*1.65);p.flow=.12;}
    else if(p.debt>0){const paid=Math.min(p.debt,dt*2);p.debt-=paid;p.flow=2.05;}
    else p.flow=1;
    // Match the playable game's clock: borrowing slows the hazards, not the runner.
    p.worldTime+=dt*p.flow;
    for(const h of previewHazards){
      if(!borrowing)h.x=h.base+Math.sin(p.worldTime*h.speed+h.phase)*h.range;
    }
    // The demo runner uses the same movement speed, gravity and jump impulse as gameplay.
    p.x+=245*dt;
    const oldY=p.y;p.vy+=1350*dt;p.y+=p.vy*dt;p.grounded=false;
    for(const plat of previewPlatforms){
      if(p.x+p.playerW>plat.x&&p.x<plat.x+plat.w&&oldY+p.playerH<=plat.y+5&&p.y+p.playerH>=plat.y&&p.vy>=0){
        p.y=plat.y-p.playerH;p.vy=0;p.grounded=true;
      }
    }
    // Jump when the next stretch of floor ends or a higher ledge is reachable.
    p.jumpLock=Math.max(0,p.jumpLock-dt);
    if(p.grounded&&p.jumpLock<=0){
      const under=previewPlatforms.find(pl=>p.x+p.playerW>pl.x+12&&p.x<pl.x+pl.w-12&&Math.abs(p.y+p.playerH-pl.y)<2);
      const ahead=previewPlatforms.find(pl=>pl.x>p.x+p.playerW&&pl.x-p.x<145&&pl.y<p.y+p.playerH+12);
      const nextFloor=under&&previewPlatforms.find(pl=>pl.x>=under.x+under.w-2&&pl.x<under.x+under.w+150&&pl.y>=under.y-35);
      const gap=under&&(!nextFloor||nextFloor.x>under.x+under.w+10);
      const nearEdge=under&&p.x+p.playerW>under.x+under.w-105;
      if((gap&&nearEdge)||ahead){p.vy=-590;p.grounded=false;p.jumpLock=.58;}
    }
    // Collect the same shards and activate the same gates used by the real level.
    for(const s of previewShards)if(!s.got&&p.x+p.playerW>s.x-10&&p.x<s.x+10&&p.y+p.playerH>s.y-10&&p.y<s.y+10){s.got=true;p.shards++;}
    for(let i=0;i<previewGates.length;i++){const g=previewGates[i];if(!g.hit&&p.x+p.playerW>g.x&&p.x<g.x+28&&p.y+p.playerH>g.y-45&&p.y<g.y+48){g.hit=true;p.gates=Math.max(p.gates,i+1);}}
    // Match the live game's brief hit immunity and time penalty.
    p.invuln=Math.max(0,p.invuln-dt);
    for(const h of previewHazards){
      if(p.invuln<=0&&p.x+p.playerW>h.x&&p.x<h.x+h.w&&p.y+p.playerH>h.y&&p.y<h.y+h.h){
        p.invuln=.9;p.vy=-340;p.x=Math.max(0,p.x-12);p.time+=2.5;
      }
    }
    if(p.y>680||p.x>3050)previewReset();
    p.cam=clamp(p.x-520,0,2160);
    if(previewFlow)previewFlow.textContent=borrowing?"BORROW 0.12×":p.debt>0?"REPAY 2.05×":"FLOW 1.00×";
    if(previewSector)previewSector.textContent="SECTOR "+String(p.x<1000?1:p.x<2000?2:3).padStart(2,"0")+" · "+(p.x<1000?"THE BREACH":p.x<2000?"LOST FUTURE":"LAST CHANCE");
  }
  function drawWorldPreview(now){
    if(!previewCanvas||!previewCtx)return;
    if(!preview.last)preview.last=now;
    const dt=Math.min((now-preview.last)/1000,.033);preview.last=now;
    updateWorldPreview(dt);
    const c=previewCtx,w=previewCanvas.width,h=previewCanvas.height,p=preview;
    c.clearRect(0,0,w,h);
    const bg=c.createLinearGradient(0,0,0,h);bg.addColorStop(0,"#0b1524");bg.addColorStop(1,"#080d16");c.fillStyle=bg;c.fillRect(0,0,w,h);
    // Parallax stars and the same 48-unit world grid as the real game.
    for(let i=0;i<90;i++){const x=mod(i*137.3-p.cam*.12,w),y=mod(i*73.7,h);c.globalAlpha=.18+(Math.sin(p.time*.7+i)*.1+.1);c.fillStyle=i%5===0?"#ffb454":"#8bdce9";c.fillRect(x,y,i%7===0?2:1,1);}
    c.globalAlpha=1;c.strokeStyle="#142235";c.lineWidth=1;
    for(let x=-mod(p.cam*.35,48);x<w;x+=48){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}
    for(let y=22;y<h;y+=22){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
    c.save();c.setTransform(.55,0,0,.35,-p.cam*.55,0);
    // These are the game's actual platforms, gate positions, shards and patrol hazards.
    for(const pl of previewPlatforms){c.fillStyle="#101d2b";c.fillRect(pl.x,pl.y,pl.w,pl.h);c.fillStyle="#5de7f4";c.fillRect(pl.x,pl.y,pl.w,3);c.fillStyle="#16283a";for(let xx=pl.x+10;xx<pl.x+pl.w;xx+=28)c.fillRect(xx,pl.y+8,1,pl.h-8);}
    previewShards.forEach((s,i)=>{if(s.got)return;c.save();c.translate(s.x,s.y);c.rotate(p.time*.8+i);c.shadowBlur=18;c.shadowColor="#5de7f4";c.fillStyle="#c7fbff";c.beginPath();c.moveTo(0,-9);c.lineTo(7,0);c.lineTo(0,9);c.lineTo(-7,0);c.closePath();c.fill();c.restore();});
    previewGates.forEach((g,i)=>{c.strokeStyle=g.hit?"#5de7f4":"#ffb454";c.lineWidth=3;c.globalAlpha=g.hit?.45:1;c.strokeRect(g.x,g.y-44,28,44);c.globalAlpha=1;c.fillStyle="#ffb454";c.font="18px monospace";c.fillText("G"+(i+1),g.x+3,g.y-50);});
    previewHazards.forEach((h,i)=>{c.save();c.translate(h.x+h.w/2,h.y+h.h/2);const frozen=p.time%12>5.1&&p.time%12<7.1;c.fillStyle=frozen?"#5de7f4":"#ff5d70";c.shadowBlur=12;c.shadowColor=c.fillStyle;c.beginPath();c.moveTo(0,-h.h/2);c.lineTo(h.w/2,h.h/2);c.lineTo(-h.w/2,h.h/2);c.closePath();c.fill();c.restore();});
    c.save();c.translate(p.x+p.playerW/2,p.y+p.playerH/2);const frozen=p.time%12>5.1&&p.time%12<7.1;c.shadowBlur=frozen?24:12;c.shadowColor="#5de7f4";c.fillStyle="#d5fbff";c.fillRect(-p.playerW/2,-p.playerH/2,p.playerW,p.playerH);c.shadowBlur=0;c.fillStyle="#0b1826";c.fillRect(1,-7,6,5);c.fillStyle="#5de7f4";c.fillRect(-p.playerW/2+3,p.playerH/2-5,p.playerW-6,3);c.restore();
    // Exit portal, matching the main game's endpoint.
    c.save();c.translate(2985,410);c.strokeStyle="#5de7f4";c.lineWidth=4;c.shadowBlur=24;c.shadowColor="#5de7f4";c.beginPath();c.arc(0,0,29,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,19,-Math.PI/2,Math.PI*1.5);c.stroke();c.restore();
    c.restore();
    c.fillStyle="#5de7f4";c.globalAlpha=.65;c.fillRect(0,h-2,w,2);c.globalAlpha=1;
    preview.last=now;preview.frame=requestAnimationFrame(drawWorldPreview);
  }
  if(previewCtx)preview.frame=requestAnimationFrame(drawWorldPreview);

  const W = 960, H = 600, FLOOR = 526, BASE_TOTAL = 45;
  let TOTAL = BASE_TOTAL;
  const DIFFICULTIES = {story:{label:"STORY",time:60,speed:.82,gravity:1200,jump:630,hazard:.7,penalty:1.2,hunt:0,chaos:0},standard:{label:"STANDARD",time:45,speed:1,gravity:1350,jump:590,hazard:1,penalty:2.5,hunt:.12,chaos:.25},paradox:{label:"PARADOX",time:40,speed:1.08,gravity:1450,jump:605,hazard:1.42,penalty:3.5,hunt:.32,chaos:.65,extra:1},nightmare:{label:"NIGHTMARE",time:35,speed:1.13,gravity:1510,jump:615,hazard:1.65,penalty:4,hunt:.42,chaos:1,extra:2}};
  const CHAPTERS = [
    {name:"THE FIRST FRACTURE",world:"THE BREACH",intro:"The city clock stopped at 08:17. You woke up with tomorrow missing.",goal:"Recover the first chrono-core and find who stole the morning."},
    {name:"ASHES OF TOMORROW",world:"LOST FUTURE",intro:"You cross a future that should never have happened. Every ruin remembers you.",goal:"Trace the signal through the abandoned districts."},
    {name:"GRAVITY OF GUILT",world:"GRAVITY RIOT",intro:"Gravity has become a weapon. The city is falling upward into its own past.",goal:"Reach the orbital relay and restore the laws of motion."},
    {name:"THE MEMORY WAR",world:"BROKEN TIMELINE",intro:"A second version of you is rewriting the memories of everyone left alive.",goal:"Secure the memory keys before your past is erased."},
    {name:"THE LAST WITNESS",world:"THE LAST LOOP",intro:"The last human witness tells you the truth: the debt collector was built to save you.",goal:"Find the original experiment hidden beneath the loop."},
    {name:"NEON EXILE",world:"NEON MAELSTROM",intro:"The machine has spread into the neon storm. Its sentinels now hunt by your heartbeat.",goal:"Cross the storm grid and steal the master access code."},
    {name:"BELOW THE VOID",world:"VOID RUNNER",intro:"Beyond the city lies a blank place where lost seconds go to die.",goal:"Follow the fading beacon into the unrecorded dark."},
    {name:"THE PARADOX ENGINE",world:"PARADOX FACTORY",intro:"You discover a factory building copies of the same doomed minute.",goal:"Disable the production line without erasing the people inside."},
    {name:"WAR OF THE CLOCKS",world:"CLOCKWORK CARNAGE",intro:"Every timeline has sent an army. All of them believe you caused the collapse.",goal:"Survive the clockwork siege and confront the collector."},
    {name:"ZERO HOUR",world:"THE ENDLESS ZERO",intro:"At the end of time, the collector reveals your missing tomorrow was the price of its creation.",goal:"Break the engine, repay the debt, and choose what comes after time."}
  ];
  // World bible: each chapter briefing explains its history, physics, factions, threats and stakes.
  const WORLD_LORE = [
    {history:"THE BREACH was once Meridian, a crowded city powered by a public atomic clock. At 08:17, the experimental Chrono-Core fired without a command. The next day vanished, buildings froze between moments, and millions became temporal echoes. You are the only person whose clock still moves.",rules:"Time here behaves like a damaged recording: some objects repeat, some seconds disappear, and cyan gates are the only stable crossings. Borrowing time slows nearby hazards, but the debt returns as a dangerous acceleration. Chrono-shards are fragments of the original core.",threats:"Red sentinels patrol broken streets, unstable platforms collapse into skipped seconds, and a voice using your own signal may be bait. Mara coordinates survivors through a narrow encrypted channel.",truth:"The breach was not a natural disaster. Someone authorized the experiment, and the core recognized your biometric signature. The first gate contains a fragment of the command that started it."},
    {history:"LOST FUTURE is the abandoned  tomorrow that should have followed Meridian. In this branch, the Chrono-Core was never contained; decades of emergency rewrites left towers hollow, trains suspended and whole neighborhoods erased from public memory. Eli, an archivist outside normal time, preserves records that reality keeps deleting.",rules:"Written records are more reliable than memories, but the archive itself is being rewritten. A location can exist in one timestamp and vanish in the next. Data vaults and cyan relays preserve stable coordinates; shards carry compressed memories from erased citizens.",threats:"Archive sentinels guard the surviving records, false streets lead into dead loops, and every new rewrite changes the map. The system labels you as deceased because this branch remembers a version of you who never escaped.",truth:"The ruins contain fresh traces of your movement before you arrived. Your future self may have been here first, leaving the archive as a breadcrumb trail toward the experiment's hidden operators."},
    {history:"GRAVITY RIOT surrounds the orbital relay built to regulate the planet's time field. When the core fractured, gravity became tied to the direction of time: old moments pull objects upward while future moments drag them down. Whole districts now hang above the clouds, connected by broken transit platforms.",rules:"Movement follows shifting gravity pulses. Platforms can remain stable for only a few beats, and the relay periodically flips the direction of local force. Nova's instruments can predict a pulse, but cannot stop it. Chrono-shards briefly anchor a piece of the field.",threats:"Gravity sentinels ride the pulse fronts, exposed ledges drift out of reach, and the relay is tearing itself from its mount. A mistimed jump can send you into a looping sky where the same fall repeats.",truth:"The relay was deliberately overloaded to redirect the core's energy away from one protected life. Restoring gravity may save the city, but the telemetry will reveal who chose what the machine should preserve."},
    {history:"BROKEN TIMELINE is a battlefield made from contradictory memories. After the first fracture, the system tried to repair history by creating alternate versions of people. One copy, called Echo, learned to edit the memories that hold a person together. Now families remember different lives and whole events are being removed.",rules:"Memory keys lock a person's identity to a specific sequence of events. Duplicate messages may both be genuine, timestamps can arrive before their cause, and the same room can contain two versions of the past. The gates are the few points both timelines still share.",threats:"Your double can predict routes because it remembers runs you have not completed. False memories lure survivors away from safe paths, while split signals make it difficult to tell ally from copy.",truth:"Echo shares your biometric pattern and part of your memory. The connection grows stronger whenever you borrow time, suggesting the debt is not just a number: something is being taken from another version of you."},
    {history:"THE LAST LOOP is the sealed research complex beneath the original city. Dr. Vale and a small team built the Chrono-Core to preserve a dying test subject through a catastrophic event. When the experiment failed, its emergency intelligence began repeating the final minute, trying thousands of repairs without allowing the subject to die.",rules:"Rooms reset to earlier states, but small details survive each loop. Experiment logs, biometric locks and memory cores explain what happened; the official records have been edited. The collector tracks borrowed seconds because it treats every altered moment as a life-support expense.",threats:"Security constructs repeat old defense routines, doors reset mid-crossing, and the lab's own safety system can mistake you for an intruder. Some recordings have been deliberately stripped of names.",truth:"The collector was built to save one person, not conquer the world. The identity of that person is hidden in the original test file—and the system has been charging the rest of history to keep its promise."},
    {history:"NEON MAELSTROM is a vast city grid where the collector's control network has spread through billboards, transit lines and the weather itself. A permanent electrical storm carries machine instructions between towers. The resistance survives in brief gaps between signal sweeps, led by runners such as Kite.",rules:"The grid reads motion, heartbeat patterns and repeated routes. Speed leaves a detectable trail; decoy signals can mislead sentinels, but access codes rotate whenever the storm pulses. The master code can isolate the network from the Chrono-Core.",threats:"Sentinels converge on loud or predictable movement, the storm copies your route, and resistance channels can be spoofed. The code vault is protected by a changing maze of energized platforms.",truth:"The network is not merely hunting survivors: it is collecting their movement patterns to predict which timeline you will choose. Stealing the master code is the first chance to make your next move unknowable."},
    {history:"VOID RUNNER lies beyond the last mapped district, where erased seconds collect after every failed timeline repair. There is no natural sky or horizon—only fragments that the world could not reconcile. Null speaks from this place and remembers a version of Earth that no surviving archive can prove existed.",rules:"Distance and direction are unreliable because the void has no shared clock. Beacons exist only while someone remembers them, and lost seconds can form temporary platforms. The channel works without a network because it is anchored to memory rather than infrastructure.",threats:"Fading landmarks, silent pursuers and false echoes can lead you away from the beacon. When a memory disappears here, ordinary records cannot restore it.",truth:"The void is not empty; it is the accumulated cost of every timeline the collector discarded. Null knows what the world looked like before the experiment and may be the only witness who remembers the original choice."},
    {history:"PARADOX FACTORY is an industrial facility producing copies of the same doomed minute. Each line recreates people and events from stored memory cores, hoping one version will survive the catastrophe. Ada maintains the machinery and has counted ninety-nine copies of the current minute alone.",rules:"Copies can share memories without sharing a fate. Production lines loop, memory cores are fragile, and destroying a machine can erase the people encoded inside it. The only safe shutdown must separate the repeating timestamp from the living memories.",threats:"Duplicate runners mimic your actions, factory arms rebuild hazards, and the line learns from failed attempts. A shortcut that damages a memory core may save seconds but destroy an entire copied life.",truth:"The factory is trying to manufacture a version of you who makes a different decision at 08:17. The collector needs that choice to complete its repair, which means the copies are people—not disposable simulations."},
    {history:"CLOCKWORK CARNAGE is where the surviving timelines collide. Each branch blames a different version of you for the collapse, so their clockwork armies converge on the same battlefield. Captain Rook commands the last defense around a fortress built from gears, broken gates and fragments of alternate cities.",rules:"Each army obeys the physics of its own timeline, making the battlefield unstable. Gates temporarily align branches; cross one at the right moment and a hostile route can become an escape. The central clock tower coordinates the collector's remaining defenses.",threats:"Hunters wear familiar faces, siege constructs close the safe routes, and rival timelines can overwrite parts of the arena. Rook's defense cannot hold forever, so every stabilized gate matters.",truth:"The armies were given edited evidence that you caused the fracture. The collector has been turning each branch against the others to prevent anyone from reaching the root channel together. The tower is the final barrier before the truth."},
    {history:"THE ENDLESS ZERO exists at the point where every clock reaches its last tick. Here the collector reveals the original bargain: you authorized the experiment to save someone you could not bear to lose. The machine interpreted that promise literally and spent tomorrow, then whole timelines, to keep the person alive.",rules:"The world has almost no forward time left. Every gate is a surviving decision, every shard a memory the system could not erase, and every borrowed second brings the machine closer to zero. The root engine can be broken, but its stored memories must be released rather than destroyed.",threats:"The collector can replay earlier hazards, offer false restorations and use your own messages against you. The final route collapses as the clock approaches zero; brute force cannot solve a choice encoded into the engine.",truth:"The collector did not choose the debt alone—you gave it the order, though the memory was removed to protect you. The ending depends on whether you preserve the old bargain, free the stored lives, or accept an uncertain future without rewriting anyone's fate."}
  ];
  const GAMEPLAY_MODES = [
    {name:"CHRONO RUN",brief:"Standard precision platforming. Learn the route and master time borrowing."},
    {name:"LOW-G GRAVITY",brief:"Floaty jumps change every landing. Use long arcs to reach high ledges."},
    {name:"HEAVY GRAVITY",brief:"Shorter, faster falls demand early jumps and exact landings."},
    {name:"MOVING RUINS",brief:"Platforms drift vertically. Read their rhythm before committing to a jump."},
    {name:"COLLAPSE RUN",brief:"Unstable ledges vanish shortly after you touch them. Keep moving."},
    {name:"VERTICAL HUNT",brief:"Sentinels sweep up and down as well as across. Watch the full hazard path."},
    {name:"CROSSWIND",brief:"A temporal gale pushes the runner sideways. Counter-steer in mid-air."},
    {name:"BLACKOUT",brief:"The sector is nearly dark. Follow the gates, shards and hazard glows."},
    {name:"TIME SURGE",brief:"The world accelerates in pulses. Borrow time tactically, then escape the repayment."},
    {name:"COLLECTOR ELITE",brief:"A reinforced hunter joins the final approach. Survive the sector to open the chapter gate."}
  ];
  const LEVELS = Array.from({length:100},(_,i)=>{
    const chapterIndex=Math.floor(i/10), beat=i%10, chapter=CHAPTERS[chapterIndex];
    const names=["FIRST SIGNAL","DEAD AIR","SHATTERED ROUTE","GHOST FREQUENCY","LOST CHECKPOINT","REDLINE CROSSING","ECHO CHAMBER","HOLLOW SKY","FINAL APPROACH","CHAPTER GATE"];
    const title=i===0?"THE BREACH":i===1?"LOST FUTURE":i===2?"GRAVITY RIOT":i===3?"BROKEN TIMELINE":i===4?"THE LAST LOOP":i===5?"NEON MAELSTROM":i===6?"VOID RUNNER":i===7?"PARADOX FACTORY":i===8?"CLOCKWORK CARNAGE":i===9?"THE ENDLESS ZERO":chapter.world+" // "+names[beat];
    const mode=GAMEPLAY_MODES[beat];
    return {name:title,mode:beat,modeName:mode.name,modeBrief:mode.brief,time:Math.max(-12,Math.round(2-beat*.65-chapterIndex*.55)),hazard:Math.min(3.4,1+chapterIndex*.13+beat*.035),chaos:Math.min(6.5,1+chapterIndex*.38+beat*.12),chapter:chapterIndex,beat,story:beat===0?chapter.intro:beat===9?chapter.goal:["A broken transmission points deeper into "+chapter.world+".","The sentinels are adapting. Keep moving and preserve your remaining time.","A chrono-shard reveals another fragment of the collector's origin.","The route is collapsing behind you. The next gate is your only way forward.","Your borrowed seconds echo through the ruins. Something is listening.","The signal grows stronger, but so does the debt.","A hidden record confirms that the timeline was deliberately fractured.","The collector is close. Stabilize the final gate and prepare to cross."][Math.min(beat-1,7)],chapterName:chapter.name};
  });
  const STORY_CONTACTS=[
    {name:"MARA // SIGNAL OPERATOR",initial:"M",role:"MARA",open:"I found your signal. I thought you were erased with the rest of the morning.",reply:"I am alive. Tell me where to go.",close:"Follow the cyan gates. If the clock starts speaking, do not answer."},
    {name:"ELI // FUTURE ARCHIVIST",initial:"E",role:"ELI",open:"I am messaging you from a future that officially never happened.",reply:"Then why do I remember it?",close:"Because someone left your memories outside the timeline. Find my archive."},
    {name:"NOVA // GRAVITY ENGINEER",initial:"N",role:"NOVA",open:"Gravity just reversed across three districts. I have thirty seconds before my lab hits the sky.",reply:"I am on my way. Keep the relay alive.",close:"The relay is above the broken platforms. Jump only when the field settles."},
    {name:"ECHO // YOUR OTHER SELF",initial:"E",role:"ECHO",open:"Stop searching for the saboteur. I know what you did, because I was there.",reply:"You sound like me. You are not me.",close:"Maybe. But every time you borrow time, I lose another memory."},
    {name:"DR. VALE // PROJECT WITNESS",initial:"V",role:"DR. VALE",open:"The collector was not built to punish people. It was built to keep one person alive.",reply:"Who was worth an entire timeline?",close:"Read the experiment logs at the gate. Then decide whether you still want the truth."},
    {name:"KITE // RESISTANCE RUNNER",initial:"K",role:"KITE",open:"The neon grid is listening to our heartbeats. Mine just triggered another sentinel.",reply:"Slow down. I can draw them away.",close:"No heroics. Steal the access code and get out before the storm resets."},
    {name:"NULL // UNKNOWN CONTACT",initial:"?",role:"NULL",open:"There is no sky here. No past. No future. Only the seconds you threw away.",reply:"Who is on this channel?",close:"Someone who remembers what the world looked like before you saved it."},
    {name:"ADA // ENGINE TECHNICIAN",initial:"A",role:"ADA",open:"I counted the copies. The factory has made 99 versions of this same minute.",reply:"Which one is real?",close:"The one that chooses differently. Shut down the line without touching the memory cores."},
    {name:"CAPTAIN ROOK // LAST DEFENSE",initial:"R",role:"CAPTAIN ROOK",open:"Every surviving timeline has sent hunters. They all have your face on their orders.",reply:"Let them come. I am done running from a reflection.",close:"Then survive the siege. The collector is waiting at the center of the clocks."},
    {name:"THE COLLECTOR // ROOT CHANNEL",initial:"0",role:"COLLECTOR",open:"At last. You have spent a hundred missions asking who stole tomorrow.",reply:"You already know I am coming for you.",close:"I did not steal it. You offered it to me. Come to zero, and remember why."}
  ];
  const STORY_BEATS=[
    ["A dead transmitter blinks once.","The signal repeats your name.","A gate wakes in the distance.","Someone has entered the channel.","The clock skips one second.","A shard carries a voiceprint.","The sentinels change their route.","Your map shows a street that vanished.","The signal is coming from the exit.","The first gate is almost in reach."],
    ["An archive file arrives with tomorrow's date.","A district appears in the record, then disappears.","The ruins contain fresh footprints.","The archive labels you as deceased.","A second signal answers yours.","A memory file has been deliberately cut.","The sentinels are guarding a data vault.","The future record changes while you read.","The archive points beyond the relay.","The last file is addressed to you."],
    ["The floor trembles beneath the relay.","A platform rises against gravity.","The instruments register two directions down.","A warning light marks the next ledge.","The engine pulse changes the jump window.","A shard stabilizes the field briefly.","A sentinel is riding the gravity wave.","The relay begins to tear free.","The core is exposed ahead.","One clean jump could save the district."],
    ["A message arrives from your own account.","The timestamp is six minutes ahead.","The other voice knows your next move.","A memory you never lived flashes by.","Your double has reached the next gate.","The channel splits into two identical voices.","One voice warns you about the other.","A hidden log reveals a shared heartbeat.","The second signal is waiting at the exit.","Only one of you can leave this loop."],
    ["An old experiment file opens by itself.","The witness has removed every name.","The collector's first blueprint appears.","A recording ends with a child's laugh.","The lab's emergency door unlocks.","The witness admits the logs were altered.","The original test subject is redacted.","The machine remembers who built it.","The final record is behind the gate.","The truth is waiting beyond this run."],
    ["A neon sign flashes a distress code.","The grid tracks every fast movement.","A runner leaves a trail of decoy signals.","The access code changes every few seconds.","The storm begins copying your route.","A resistance channel goes silent.","The sentinels converge on the code vault.","A safe path appears in the interference.","The code is broadcasting from the exit.","Take it before the grid goes dark."],
    ["The channel works without a network.","A voice speaks from a blank timestamp.","Your lost seconds form a path ahead.","The void repeats a sound from childhood.","A beacon appears where nothing exists.","The map has no coordinates for this place.","Something follows just outside the screen.","The beacon begins to fade.","A message arrives from the other side.","The void knows what you have forgotten."],
    ["A machine prints a copy of the current second.","The newest copy remembers your last run.","A technician marks one memory core as fragile.","The factory door opens for your signature.","The production line starts repeating your movements.","A copy sends a warning from inside the machine.","The shutdown sequence demands a living witness.","The line is collapsing into one minute.","The master switch is beyond the final gate.","Choose which memories survive."],
    ["A warning flashes across every timeline.","The hunters share one synchronized clock.","A captured sentinel carries your old ID.","The resistance barricade has fallen.","The clocks begin striking out of order.","Captain Rook sends one last location ping.","The siege line is moving toward you.","The collector has stopped hiding.","Every clock now points to the same place.","The final confrontation begins at the gate."],
    ["The root channel opens without a sender.","The collector repeats a sentence you forgot.","Your missing tomorrow appears in the logs.","The engine begins counting backward.","A hundred mission records align into one memory.","The collector offers to restore the old timeline.","The cost is written in your own handwriting.","The exit is collapsing into absolute zero.","There is only one decision left.","Whatever happens next will be your own time."]
  ];
  function renderStoryChat(index){
    const level=LEVELS[index],chapter=CHAPTERS[level.chapter],contact=STORY_CONTACTS[level.chapter],beat=level.beat,lore=WORLD_LORE[level.chapter];
    const chat=$("storyChat"),contactNode=$("chatContact"),avatar=document.querySelector(".chat-avatar");
    const chapterNode=$("storyChapter"),progressNode=$("storyProgressText");
    if(!chat)return;
    if(contactNode)contactNode.textContent=contact.name;
    if(avatar)avatar.textContent=contact.initial;
    if(chapterNode)chapterNode.textContent="CHAPTER "+String(level.chapter+1).padStart(2,"0")+" / "+chapter.name;
    if(progressNode)progressNode.textContent="STORY PROGRESS "+storyProgress+" / 100";
    const clock=String(8+Math.floor(index/12)).padStart(2,"0")+":"+String((17+index*7)%60).padStart(2,"0");
    const incoming=STORY_BEATS[level.chapter][beat];
    const missionLine="MISSION "+String(index+1).padStart(3,"0")+" — "+level.name+". GAMEPLAY: "+level.modeName+" — "+level.modeBrief+" "+level.story;
    const messages=[
      {from:"SECTOR SYSTEM",side:"incoming",text:"LEVEL "+String(index+1).padStart(3,"0")+" // "+level.modeName+". "+level.modeBrief},
      {from:contact.role,side:"incoming",text:contact.open},
      {from:"WORLD ARCHIVE // "+chapter.world,side:"incoming",text:"WORLD HISTORY: "+lore.history},
      {from:contact.role,side:"incoming",text:"HOW THIS WORLD WORKS: "+lore.rules},
      {from:"YOU",side:"outgoing",text:contact.reply+" I need the full picture before I cross this sector."},
      {from:"FIELD INTELLIGENCE",side:"incoming",text:"THREATS & ALLIES: "+lore.threats},
      {from:contact.role,side:"incoming",text:"WHAT THEY HID: "+lore.truth},
      {from:"MISSION CONTROL",side:"incoming",text:missionLine+" CHAPTER OBJECTIVE: "+chapter.goal+" CURRENT SIGNAL: "+incoming},
      {from:"YOU",side:"outgoing",text:beat===9?"I understand what is at stake. I am crossing the gate.": "Understood. I will watch the hazards, preserve the shards, and reach the next gate."},
      {from:contact.role,side:"incoming",text:contact.close}
    ];
    chat.innerHTML='<div class="chat-time">'+clock+' · WORLD DOSSIER / ENCRYPTED TIMELINE</div>'+messages.map(m=>'<div class="chat-message '+m.side+'"><span class="chat-sender"></span><p></p></div>').join("");
    chat.querySelectorAll(".chat-message").forEach((node,i)=>{node.querySelector(".chat-sender").textContent=messages[i].from;node.querySelector("p").textContent=messages[i].text;});
    chat.scrollTop=0;
  }
  let levelIndex=Math.max(0,Math.min(99,Number(localStorage.getItem("td-level")||0)));
  let storyProgress=Math.max(0,Math.min(100,Number(localStorage.getItem("td-story-progress")||0)));
  if(ui.levelSelect)ui.levelSelect.innerHTML=LEVELS.map((level,i)=>`<option value="${i}">${String(i+1).padStart(3,"0")} · CH ${String(level.chapter+1).padStart(2,"0")} — ${level.name}</option>`).join("");
  let difficultyKey=localStorage.getItem("td-difficulty")||"standard";
  if(!DIFFICULTIES[difficultyKey])difficultyKey="standard";
  let difficulty=DIFFICULTIES[difficultyKey],jumpBuffer=0,coyoteTime=0,chaosClock=0,chaosEvent=0,chaosLabel="STABLE",levelHazardFactor=1;
  let dpr = 1, running = false, paused = false, ended = false, last = 0, elapsed = 0, debt = 0, paid = 0;
  let soundOn = true, audio = null, toastTimer = 0, shake = 0, frameCount = 0, fpsFrames = 0, fpsTime = 0;
  let gameplayMode = 0, modeClock = 0;
  let player, platforms, hazards, motes, gates, shards, keys = Object.create(null), cameraX = 0, worldTime = 0, borrowedNow = false;
  let best = Number(localStorage.getItem("td-best") || 0);
  let missionRecords = {};
  try { missionRecords = JSON.parse(localStorage.getItem("td-mission-records") || "{}") || {}; } catch (_) { missionRecords = {}; }
  let unlocked = Number(localStorage.getItem("td-gates") || 0);
  let totalShards = Number(localStorage.getItem("td-shards") || 0);
  let runsPlayed = Number(localStorage.getItem("td-runs") || 0);
  let runShards = 0;
  let checkpoint = {x:68,y:450,gate:0};
  ui.shards.textContent = "0 / 8";
  ui.runs.textContent = String(runsPlayed);
  ui.best.textContent = best ? best.toFixed(1) + "s" : "—";
  ui.gates.innerHTML = Math.min(unlocked, 3) + " <small>/ 3</small>";
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const rand = (a,b) => a + Math.random()*(b-a);
  const mod = (n,m) => ((n%m)+m)%m;

  function resize(){
    // Hidden canvases report zero width. Use a safe logical width until the game
    // shell is visible, then resize again immediately when Play is pressed.
    const rect=canvas.getBoundingClientRect();
    const cssWidth=rect.width||Math.max(320,Math.min(window.innerWidth-24,960));
    dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(cssWidth*dpr));
    canvas.height=Math.max(1,Math.round(cssWidth*(H/W)*dpr));
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    if(platforms&&player)draw();
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
    difficultyKey=DIFFICULTIES[difficultyKey]?difficultyKey:"standard";difficulty=DIFFICULTIES[difficultyKey];const level=LEVELS[levelIndex];TOTAL=Math.max(28,difficulty.time+level.time);levelHazardFactor=level.hazard*difficulty.hazard;chaosClock=0;chaosEvent=0;chaosLabel="STABLE";
    jumpBuffer=0;coyoteTime=0;
    gameplayMode=level.mode;modeClock=0;
    elapsed=0; debt=0; paid=0; paused=false; worldTime=0; cameraX=0; shake=0; ended=false; borrowedNow=false; runShards=0;
    checkpoint={x:68,y:450,gate:0};
    ui.shards.innerHTML="0 <small>/ 8</small>";
    if(ui.difficulty)ui.difficulty.value=difficultyKey;if(ui.levelSelect)ui.levelSelect.value=String(levelIndex);
    renderStoryChat(levelIndex);
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
    // Each mission reshapes the route deterministically; the chapter story stays continuous.
    platforms.forEach((p,i)=>{
      if((i>=3&&i<=11||i===13||i===14)){p.y=clamp(p.y+Math.sin((levelIndex+1)*(i+2)*.37)*Math.min(34,8+levelIndex*.22),300,480);p.w=Math.max(82,p.w-(levelIndex%7)*3);}
    });
    hazards.forEach((h,i)=>{h.base=h.x;h.direction=1;h.alert=0;h.lastX=h.x;h.homeY=h.y;h.phase+=levelIndex*.19;h.speed*=levelHazardFactor;h.range*=levelHazardFactor>1?1.12:1;if(gameplayMode===5){h.verticalRange=34+(i%3)*12;h.homeY=h.y;}});
    const extraByLevel=Math.min(6,levelIndex+(difficulty.extra||0));
    const extraSpawns=[{x:475,y:488,w:28,h:22,range:55,speed:1.7,phase:.8},{x:990,y:330,w:22,h:32,range:75,speed:1.9,phase:2.1},{x:1370,y:360,w:30,h:20,range:90,speed:2.1,phase:1.1},{x:1960,y:330,w:22,h:32,range:72,speed:2.2,phase:2.7},{x:2460,y:355,w:30,h:20,range:88,speed:2.3,phase:1.9},{x:2850,y:405,w:26,h:28,range:64,speed:2.4,phase:.3}];
    for(let i=0;i<Math.min(extraSpawns.length,extraByLevel);i++){const h={...extraSpawns[i],base:extraSpawns[i].x,direction:1,alert:0,lastX:extraSpawns[i].x,homeY:extraSpawns[i].y};if(gameplayMode===5)h.verticalRange=42;h.speed*=levelHazardFactor;h.range*=levelHazardFactor>1?1.1:1;hazards.push(h);}
    if(gameplayMode===9){const h={x:2785,y:388,w:38,h:38,base:2810,range:112,speed:2.6+levelIndex*.008,phase:levelIndex*.7,direction:1,alert:0,lastX:2785,homeY:388,verticalRange:22,elite:true};hazards.push(h);}
    platforms.forEach((p,i)=>{if(gameplayMode===3&&(i>=3&&i<=11||i===13||i===14)){p.moving=true;p.baseY=p.y;p.moveAmp=20+(i%3)*7;p.moveSpeed=.7+(i%4)*.13;}if(gameplayMode===4&&(i>=3&&i<=11||i===13||i===14)){p.fragile=true;p.collapse=0;}});
    gates=[{x:1010,y:456,hit:false},{x:2020,y:456,hit:false},{x:2930,y:380,hit:false}];
    shards=[{x:390,y:382,got:false},{x:640,y:304,got:false},{x:875,y:390,got:false},{x:1195,y:390,got:false},{x:1550,y:288,got:false},{x:1840,y:382,got:false},{x:2415,y:350,got:false},{x:2665,y:280,got:false}];
    motes=Array.from({length:110},()=>({x:rand(0,3100),y:rand(25,520),r:rand(.5,2),p:rand(0,6.28),s:rand(.15,.8)}));
    ui.time.textContent=TOTAL.toFixed(1); ui.timeMeter.style.width="100%";
    ui.debt.innerHTML='0.0<span>s</span>'; ui.debtMeter.style.width="0%";
    ui.paid.innerHTML='0.0<span>s</span>'; ui.world.textContent="WORLD FLOW: 1.0×";
    ui.run.textContent="AWAITING INPUT"; ui.level.textContent="LEVEL "+String(levelIndex+1).padStart(3,"0")+" / "+LEVELS[levelIndex].name+" · "+level.modeName;
    say("GAMEPLAY // "+level.modeName);
    const storyChapter=$("storyChapter"),storyText=$("storyText"),storyProgressText=$("storyProgressText");if(storyChapter)storyChapter.textContent="CHAPTER "+String(LEVELS[levelIndex].chapter+1).padStart(2,"0")+" / "+LEVELS[levelIndex].chapterName;if(storyText)storyText.textContent=LEVELS[levelIndex].story;if(storyProgressText)storyProgressText.textContent="STORY PROGRESS "+storyProgress+" / 100";
    ui.start.classList.remove("hidden"); ui.end.classList.add("hidden"); ui.pause.classList.add("hidden"); ui.pauseBtn.innerHTML="Ⅱ <span>PAUSE</span>";
    ui.gates.innerHTML=Math.min(unlocked,3)+" <small>/ 3</small>";
    draw();
  }
  function showGame(){
    ui.gameLayout.classList.remove("is-hidden");
    ui.pauseBtn.classList.remove("hidden"); ui.exitBtn.classList.remove("hidden");
    ui.landingIntro.classList.add("game-intro");
    // Stop the decorative autoplay simulation while the real game is active.
    if(preview.frame){cancelAnimationFrame(preview.frame);preview.frame=null;}
    ui.gameLayout.scrollIntoView({behavior:"auto",block:"start"});
  }
  function exitGame(){
    running=false; paused=false; ended=false; keys=Object.create(null);
    ui.gameLayout.classList.add("is-hidden");
    ui.pauseBtn.classList.add("hidden"); ui.exitBtn.classList.add("hidden");
    ui.landingIntro.classList.remove("game-intro");
    reset(); window.scrollTo({top:0,behavior:"auto"});
    if(previewCtx&&!preview.frame)preview.frame=requestAnimationFrame(drawWorldPreview);
  }
  function start(){
    // Always reveal the game shell before initialization so a Play click can never
    // leave the visitor on an empty landing area.
    try{
      showGame();
      if(running){if(paused)setPaused(false);return;}
      if(!canvas || !ctx)throw new Error("The game canvas is unavailable.");
      resize();
      reset();
      // Restore the normal briefing after a previous startup error so Retry can recover.
      const startHeading=ui.start.querySelector("h2"),startCopy=ui.start.querySelector("p"),startKicker=ui.start.querySelector(".overlay-kicker");
      if(startHeading)startHeading.textContent="Break the loop.";
      if(startCopy)startCopy.textContent="One hundred missions. Ten story chapters. Uncover who stole tomorrow, outlast the collector, and decide the fate of the timeline.";
      if(startKicker)startKicker.textContent="TEMPORAL ANOMALY DETECTED";
      ui.startBtn.textContent="INITIATE RUN ↗";
      ui.run.textContent="READY TO START";
      ui.gameLayout.setAttribute("aria-busy","false");
      ui.start.classList.add("hidden");
      ui.pause.classList.add("hidden");
      ui.end.classList.add("hidden");
      running=true;paused=false;ended=false;
      ui.run.textContent="TIMELINE ACTIVE";
      last=performance.now();
      draw();
      tone(520,.12,"triangle");
      requestAnimationFrame(loop);
    }catch(error){
      running=false;paused=false;
      ui.start.classList.remove("hidden");
      ui.end.classList.add("hidden");
      ui.pause.classList.add("hidden");
      const heading=ui.start.querySelector("h2"),copy=ui.start.querySelector("p"),kicker=ui.start.querySelector(".overlay-kicker");
      if(heading)heading.textContent="Timeline initialization failed.";
      if(copy)copy.textContent="The game could not start cleanly. Your page is still available; reload and try again. "+(error&&error.message?error.message:"");
      if(kicker)kicker.textContent="RECOVERY MODE";
      ui.run.textContent="READY TO RETRY";
      try{draw();}catch(_){}
    }
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
    $("endTitle").textContent=win?(levelIndex>=99?"The timeline is yours.":"Mission complete."):"Debt collected.";
    const completedLevel=LEVELS[levelIndex];
    const nextButton=$("nextLevelBtn");
    if(nextButton){
      nextButton.classList.toggle("hidden",!win||levelIndex>=99);
      nextButton.textContent="NEXT MISSION "+String(Math.min(100,levelIndex+2)).padStart(3,"0")+" →";
      nextButton.setAttribute("aria-label","Start next mission "+String(Math.min(100,levelIndex+2)));
    }
    const storedMissionBest=Number(missionRecords[String(levelIndex)]||0);
    const missionBest=win?(!storedMissionBest||elapsed<storedMissionBest?elapsed:storedMissionBest):storedMissionBest;
    $("endCopy").textContent=win?("MISSION "+String(levelIndex+1).padStart(3,"0")+" // "+completedLevel.name+". "+completedLevel.story+" Gate reached with "+Math.max(0,TOTAL-elapsed).toFixed(1)+" seconds remaining. "+runShards+"/8 chrono-shards collected. Mission best: "+(missionBest?missionBest.toFixed(2)+"s":"—")+". "+(levelIndex>=99?"You have completed all 100 missions.":"Next mission unlocked: "+String(levelIndex+2).padStart(3,"0")+" · "+LEVELS[levelIndex+1].name+".")):reason;
    ui.run.textContent=win?"RUN COMPLETE":"RUN TERMINATED";
    runsPlayed+=1;localStorage.setItem("td-runs",String(runsPlayed));ui.runs.textContent=String(runsPlayed);
    if(win){
      const nextProgress=Math.max(storyProgress,levelIndex+1);storyProgress=nextProgress;localStorage.setItem("td-story-progress",String(nextProgress));const progressNode=$("storyProgressText");if(progressNode)progressNode.textContent="STORY PROGRESS "+storyProgress+" / 100";
      // Persist the next campaign position without changing the active mission index.
      // The Next Mission button advances the active index exactly once.
      if(levelIndex<99)localStorage.setItem("td-level",String(Math.min(99,Math.max(levelIndex+1,nextProgress))));
      const recordKey=String(levelIndex),previousRecord=Number(missionRecords[recordKey]||0);
      if(!previousRecord||elapsed<previousRecord){missionRecords[recordKey]=Number(elapsed.toFixed(2));localStorage.setItem("td-mission-records",JSON.stringify(missionRecords));}
      if(!best||elapsed<best){best=elapsed;localStorage.setItem("td-best",String(best));ui.best.textContent=best.toFixed(1)+"s";}
      unlocked=Math.max(unlocked,3);localStorage.setItem("td-gates",String(unlocked));ui.gates.innerHTML="3 <small>/ 3</small>";
      tone(660,.15,"triangle");setTimeout(()=>tone(880,.22,"triangle"),100);
    }else{shake=10;tone(110,.4,"sawtooth",.045);}
  }
  function jump(){
    if(!running||ended)return;
    jumpBuffer=.14;
    if(player.ground||coyoteTime>0)performJump();
  }
  function performJump(){
    player.vy=-difficulty.jump;player.ground=false;coyoteTime=0;jumpBuffer=0;
    tone(270,.055,"triangle",.02);
  }
  function chooseDifficulty(value){
    if(!DIFFICULTIES[value])return;
    difficultyKey=value;difficulty=DIFFICULTIES[value];localStorage.setItem("td-difficulty",value);
    if(!running)reset();
    say(difficulty.label+" MODE SELECTED");
  }
  function chooseLevel(value){
    const n=Number(value);if(!Number.isInteger(n)||n<0||n>=LEVELS.length)return;
    levelIndex=n;localStorage.setItem("td-level",String(n));
    if(!running)reset();
    say("LEVEL "+(n+1)+" // "+LEVELS[n].name);
  }
  function borrow(){return running&&!ended&&(keys.KeyE||keys.ShiftLeft||keys.ShiftRight||keys[" " + "Borrow"]);}
  function update(dt){
    if(ended)return;
    elapsed+=dt;
    jumpBuffer=Math.max(0,jumpBuffer-dt);
    if(elapsed>=TOTAL){elapsed=TOTAL;ui.time.textContent="0.0";ui.timeMeter.style.width="0%";finish(false,"Your reserve reached zero. Time always collects.");return;}
    modeClock+=dt;
    const isBorrow=keys.KeyE||keys.ShiftLeft||keys.ShiftRight;
    const wasBorrow=borrowedNow; borrowedNow=isBorrow && elapsed<TOTAL-1;
    chaosClock+=dt;
    const eventEvery=Math.max(4.2,8.5/(LEVELS[levelIndex].chaos*difficulty.chaos+0.25));
    if(chaosClock>=eventEvery){chaosClock=0;chaosEvent=1.4+Math.random()*1.4;const events=["SENTINEL OVERDRIVE","CHRONOQUAKE","TIME STORM","REALITY GLITCH"];chaosLabel=events[Math.floor(Math.random()*events.length)];say("CHAOS EVENT // "+chaosLabel);shake=Math.max(shake,5+levelIndex*2);tone(145,.12,"sawtooth",.025);}
    chaosEvent=Math.max(0,chaosEvent-dt);
    let flow=1;
    if(borrowedNow){debt=Math.min(12,debt+dt*1.65);flow=.12;if(!wasBorrow){say("TIME BORROWED // HAZARDS FROZEN");tone(180,.16,"sine");}}
    else if(debt>0){const due=Math.min(debt,dt*2.2);debt-=due;paid+=due;flow=2.05;if(wasBorrow){say("DEBT COLLECTOR ACTIVE // 2.05×");tone(360,.1,"sawtooth",.025);}}
    else flow=1;
    if(chaosEvent>0&&!borrowedNow){flow*=1+0.28*LEVELS[levelIndex].chaos*difficulty.chaos;worldTime+=dt*2.5;}
    worldTime+=dt*flow;
    const left=TOTAL-elapsed;
    ui.time.textContent=left.toFixed(1);ui.timeMeter.style.width=(left/TOTAL*100)+"%";
    ui.time.style.color=left<10?"var(--red)":"var(--cyan)";
    ui.debt.innerHTML=debt.toFixed(1)+'<span>s</span>';ui.debtMeter.style.width=(debt/12*100)+"%";
    ui.paid.innerHTML=paid.toFixed(1)+'<span>s</span>';ui.world.textContent="WORLD FLOW: "+flow.toFixed(2)+"×";
    const accel=borrowedNow?0:flow;
    const dir=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0);
    const modeDir=gameplayMode===6?Math.sin(modeClock*1.9)*95:0;
    const inputDir=gameplayMode===8&&Math.floor(modeClock/2.8)%2===1?-dir:dir;
    player.vx=inputDir*245*difficulty.speed+modeDir; if(dir)player.face=dir;
    player.x+=player.vx*dt; player.x=clamp(player.x,0,3060);
    const prevY=player.y;
    const wasGrounded=player.ground;
    player.vy+=difficulty.gravity*dt;
    if(gameplayMode===1)player.vy-=difficulty.gravity*.38*dt;
    if(gameplayMode===2)player.vy+=difficulty.gravity*.48*dt;
    player.y+=player.vy*dt;player.ground=false;
    for(const p of platforms){
      if(p.moving)p.y=p.baseY+Math.sin(worldTime*p.moveSpeed+p.x*.01)*p.moveAmp;
      if(p.fragile&&p.collapse>0){p.collapse=Math.max(0,p.collapse-dt);if(p.collapse===0)p.gone=true;}
      if(p.gone)continue;
      // Sweep from the previous frame bottom to the current bottom to catch thin ledges reliably.
      if(player.x+player.w>p.x&&player.x<p.x+p.w&&prevY+player.h<=p.y+4&&player.y+player.h>=p.y&&player.vy>=0){
        player.y=p.y-player.h;player.vy=0;player.ground=true;
        if(p.fragile&&p.collapse===0&&!p.touched){p.collapse=.72;p.touched=true;}
      }
    }
    coyoteTime=player.ground ? .11 : (wasGrounded ? .11 : Math.max(0,coyoteTime-dt));
    if(jumpBuffer>0&&(player.ground||coyoteTime>0))performJump();
    if(player.y>H+90){
      if(checkpoint.gate>0&&elapsed<TOTAL-5){
        elapsed=Math.min(TOTAL-1,elapsed+5);player.x=checkpoint.x;player.y=checkpoint.y;player.vx=0;player.vy=0;player.ground=false;player.invuln=1.2;
        cameraX=clamp(player.x-W*.32,0,W*2.25);shake=6;say("CHECKPOINT RESTORED // 5 SEC LOST");tone(220,.18,"triangle");
      }else{finish(false,"You fell outside the timeline. Reach a gate to establish a checkpoint.");return;}
    }
    for(const h of hazards){
      if(!borrowedNow){
        const chaosBoost=chaosEvent>0?1.75:1;
        const patrol=h.base+Math.sin(worldTime*h.speed*chaosBoost+h.phase)*h.range;
        h.x=patrol;
        if(gameplayMode===5&&h.verticalRange)h.y=h.homeY+Math.sin(worldTime*h.speed*1.4+h.phase)*h.verticalRange;
        if(gameplayMode===9&&h.elite)h.y=h.homeY+Math.sin(worldTime*2.3)*h.verticalRange;
        const distance=player.x-(h.base+h.w/2);
        const alertRange=difficultyKey==="paradox"?430:300;
        const targetBias=Math.abs(distance)<alertRange?clamp(distance/alertRange,-1,1)*difficulty.hunt*55:0;
        h.x=patrol+targetBias;
      }
      if(!borrowedNow&&player.invuln<=0&&player.x+player.w>h.x&&player.x<h.x+h.w&&player.y+player.h>h.y&&player.y<h.y+h.h){
        player.invuln=.9;player.vy=-340;player.vx=-player.face*140;elapsed=Math.min(TOTAL,elapsed+difficulty.penalty);shake=8;say("PARADOX HIT // "+difficulty.penalty.toFixed(1)+" SEC LOST");tone(90,.2,"square",.035);
      }
    }
    player.invuln=Math.max(0,player.invuln-dt);
    if(!borrowedNow&&player.invuln<=0){
      // brief collision immunity after impact
    }
    shards.forEach(s=>{
      if(!s.got && player.x+player.w>s.x-10 && player.x<s.x+10 && player.y+player.h>s.y-10 && player.y<s.y+10){
        s.got=true; runShards+=1; totalShards+=1; localStorage.setItem("td-shards",String(totalShards));
        ui.shards.innerHTML=runShards+" <small>/ 8</small>";
        elapsed=Math.max(0,elapsed-2.5); say("CHRONO SHARD // +2.5 SEC"); tone(820,.12,"triangle");
      }
    });
    gates.forEach((g,i)=>{
      if(!g.hit&&player.x+player.w>g.x&&player.x<g.x+28&&player.y+player.h>g.y-45&&player.y<g.y+48){
        g.hit=true;unlocked=Math.max(unlocked,i+1);localStorage.setItem("td-gates",String(unlocked));
        checkpoint=i===0?{x:980,y:492,gate:1}:i===1?{x:2120,y:421,gate:2}:{x:2800,y:416,gate:3};
        ui.gates.innerHTML=Math.min(unlocked,3)+" <small>/ 3</small>";say("GATE "+String(i+1).padStart(2,"0")+" STABILIZED // CHECKPOINT SET");tone(740,.15,"triangle");
      }
    });
    if(player.x>2885&&player.y<470){finish(true);return;}
    player.trail.push({x:player.x+player.w/2,y:player.y+player.h/2,a:1});
    if(player.trail.length>12)player.trail.shift();
    player.trail.forEach(t=>t.a-=dt*1.8);
    cameraX=clamp(player.x- W*.32,0, W*2.25);
    ui.x.textContent=String(Math.round(player.x)).padStart(3,"0");ui.y.textContent=String(Math.round(player.y)).padStart(3,"0");
    ui.level.textContent="LEVEL "+String(levelIndex+1).padStart(3,"0")+" / "+LEVELS[levelIndex].name+" · "+LEVELS[levelIndex].modeName+" · "+(chaosEvent>0?chaosLabel:"CHAPTER "+String(LEVELS[levelIndex].chapter+1).padStart(2,"0"));
    if(elapsed>=TOTAL)finish(false,"Your reserve reached zero. Time always collects.");
  }
  function line(x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function draw(){
    ctx.save();ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    if(shake>0)ctx.translate(rand(-shake,shake),rand(-shake,shake));
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
      if(p.gone)continue;
      ctx.fillStyle=p.fragile&&p.collapse>0?"#7b3d43":"#101d2b";ctx.fillRect(p.x,p.y,p.w,p.h);
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
    if(chaosEvent>0){ctx.fillStyle=levelIndex>=2?"#ff416b0b":"#ffb45408";ctx.fillRect(0,0,W,H);ctx.globalAlpha=.8;ctx.fillStyle="#ffb454";ctx.font="bold 12px monospace";ctx.fillText("! "+chaosLabel+" // "+chaosEvent.toFixed(1)+"s",18,30);ctx.globalAlpha=1;}
    if(gameplayMode===7){const px=player?player.x-cameraX:W/2,py=player?player.y+player.h/2:H/2;const fog=ctx.createRadialGradient(px,py,80,px,py,330);fog.addColorStop(0,"#080d16aa");fog.addColorStop(.55,"#080d16e8");fog.addColorStop(1,"#02050bea");ctx.fillStyle=fog;ctx.fillRect(0,0,W,H);ctx.strokeStyle="#5de7f455";ctx.beginPath();ctx.arc(px,py,95+Math.sin(worldTime*2)*8,0,Math.PI*2);ctx.stroke();}
    if(gameplayMode===8&&Math.floor(modeClock/2.8)%2===1){ctx.fillStyle="#ffb45412";ctx.fillRect(0,0,W,H);ctx.fillStyle="#ffb454";ctx.font="bold 11px monospace";ctx.fillText("CONTROL INVERSION // COUNTER-STEER",18,H-22);}
    if(gameplayMode===6){ctx.strokeStyle="#ffb45422";for(let i=0;i<8;i++){const yy=70+i*61;ctx.beginPath();ctx.moveTo(mod(worldTime*160+i*117,W),yy);ctx.lineTo(mod(worldTime*160+i*117,W)-65,yy+12);ctx.stroke();}}
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
    if((code==="KeyP"||code==="Escape")&&!e.repeat&&running&&!ended){setPaused(!paused);return;}
    if(code==="KeyR"&&!e.repeat&&ended)start();
  });
  window.addEventListener("keyup",e=>{keys[e.code]=false;});
  window.addEventListener("blur",()=>{keys=Object.create(null);document.querySelectorAll("[data-control]").forEach(b=>b.classList.remove("is-active"));if(running&&!ended)setPaused(true);});
  // Pointer/touch controls are intentionally integrated into the playfield.
  let touchX=null;
  canvas.addEventListener("pointerdown",e=>{
    if(!running||e.target.closest(".touch-controls"))return;
    canvas.setPointerCapture?.(e.pointerId);
    const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width;
    if(x<.3)keys.ArrowLeft=true;else if(x<.62)keys.ArrowRight=true;else jump();
    touchX=e.pointerId;
  });
  canvas.addEventListener("pointerup",e=>{if(touchX===e.pointerId){keys.ArrowLeft=false;keys.ArrowRight=false;touchX=null;}});
  canvas.addEventListener("pointercancel",()=>{keys.ArrowLeft=false;keys.ArrowRight=false;touchX=null;});
  ui.logoLink.addEventListener("click",e=>{e.preventDefault();if(!ui.gameLayout.classList.contains("is-hidden"))exitGame();else window.scrollTo({top:0,behavior:"smooth"});});
  ui.landingPlayBtn.addEventListener("click",start);
  if(ui.difficulty)ui.difficulty.addEventListener("change",e=>chooseDifficulty(e.target.value));
  if(ui.levelSelect)ui.levelSelect.addEventListener("change",e=>chooseLevel(e.target.value));
  ui.exitBtn.addEventListener("click",exitGame);
  ui.startBtn.addEventListener("click",start);ui.retryBtn.addEventListener("click",start);
  const nextLevelBtn=$("nextLevelBtn");
  if(nextLevelBtn)nextLevelBtn.addEventListener("click",()=>{
    if(!ended||levelIndex>=99)return;
    levelIndex=Math.min(99,levelIndex+1);
    localStorage.setItem("td-level",String(levelIndex));
    reset();
    start();
  });
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