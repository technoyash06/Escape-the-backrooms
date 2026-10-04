'use strict'; const canvas = document.querySelector('#game'), ctx = canvas.getContext('2d'); const W = canvas.width,
H = canvas.height, keys = Object.create(null); const { ASSET, ART_CROP } = window.ShiftbreakerAssets; const img = {
}, assetCount=Object.keys(ASSET).length; let loadedAssets=0, assetsReady=false; for (const [name, src] of Object.entries(ASSET))
{ const picture=img[name]=new Image(); picture.assetKey=name; picture.onload=()=>{ loadedAssets++; if(loadedAssets===assetCount){
assetsReady=true; const play=document.querySelector('#play'); play.disabled=false; play.textContent='BEGIN THE SHIFT';
} }; picture.onerror=()=>{ loadedAssets++; console.warn('Could not load '+src); }; picture.src=src; } const trimCache
= new Map(); // Visible bounds measured once from the supplied transparent PNG files. No runtime pixel scanning.
const { forms, LEVELS } = window.ShiftbreakerData; let player, camera, message, particles, gameOver, started, paused,
controlsOpen, pendingLevel, transitionTimer, last, elapsed, history, nullEnemy, mover, crystal, coins, keyTarget, door,
block, bridge, weakFloor, wind, airSwitch, checkpoint, checkpointPoint, objectives, nullField, energyWell, recharge,
nullPlate, crusher, guideBeacon, dialogue, questOffer, questReward, result, introTimer, restartHold, endingTimer, screenKick,
audio, muted=false; const soundFiles={ shift:'../Sounds/shift.wav', jump:'../Sounds/jump.wav', impact:'../Sounds/impact.wav', key:'../Sounds/key.wav',
gate:'../Sounds/gate.wav', null:'../Sounds/null.wav', hurt:'../Sounds/hurt.wav' }; const sounds=Object.fromEntries(Object.entries(soundFiles).map(([name,src])=>[name,new
Audio(src)])); const music=new Audio('../Sounds/shiftbreaker-theme.mp3'); music.loop=true; music.volume=.28; music.preload='auto';
const LEVEL_QUESTS=[
[{name:'WALLBREAKER',text:'Use Titan to break the cracked wall.',done:()=>world.broken},{name:'FIRST CRYSTAL',text:'Find the Overgrowth Shifter Crystal.',done:()=>crystal.collected},{name:'PERFECT START',text:'Perform one Perfect Shift.',done:()=>world.perfectCount>=1},{name:'KEY SEEKER',text:'Recover the Core Key.',done:()=>world.key},{name:'HEAVY HAND',text:'Activate the Titan pressure plate.',done:()=>world.plate},{name:'CLEAN ESCAPE',text:'Finish without taking damage.',done:()=>world.damage===0}],
[{name:'SOAR SPECIALIST',text:'Perform a Perfect Shift over the ravine.',done:()=>world.perfectCount>=1},{name:'RAVINE CRYSTAL',text:'Find the crystal beyond the Soar gap.',done:()=>crystal.collected},{name:'CLEAN CROSSING',text:'Finish without taking damage.',done:()=>world.damage===0},{name:'GROVE KEY',text:'Recover the Momentum Grove key.',done:()=>world.key},{name:'TITAN LANDING',text:'Activate the far Titan plate.',done:()=>world.plate},{name:'COIN TRAIL',text:'Collect all three Echo Coins.',done:()=>coins.every(coin=>coin.collected)}],
[{name:'CORE RESTORER',text:'Recover all three Energy Cores.',done:()=>world.objectiveCount===3},{name:'LIFT ENGINEER',text:'Restore the Ancient Lift.',done:()=>!!mover?.active},{name:'RUIN CRYSTAL',text:'Find the Ancient Lift crystal.',done:()=>crystal.collected},{name:'RUIN KEY',text:'Recover the ruins key.',done:()=>world.key},{name:'LIFT PLATE',text:'Power the lift exit plate.',done:()=>world.plate},{name:'RUIN COINS',text:'Collect all three Echo Coins.',done:()=>coins.every(coin=>coin.collected)}],
[{name:'PULSE RUNNER',text:'Use Sky Air Pulse to open the security route.',done:()=>world.doorOpen||world.laserOff},{name:'FORGE CRYSTAL',text:'Find the Shattered Machine crystal.',done:()=>crystal.collected},{name:'MOMENTUM RUN',text:'Perform two Perfect Shifts.',done:()=>world.perfectCount>=2},{name:'RECHARGE TECH',text:'Use the blue energy recharge node.',done:()=>!!recharge?.used},{name:'CRUSHER SURVIVOR',text:'Finish without taking damage.',done:()=>world.damage===0},{name:'FORGE COINS',text:'Collect all three Echo Coins.',done:()=>coins.every(coin=>coin.collected)}],
[{name:'MIRROR MIND',text:'Activate the mirror plate with Titan Null.',done:()=>world.nullPlate},{name:'NULL HUNTER',text:'Defeat the Null with Titan.',done:()=>nullEnemy.defeated},{name:'CHAMBER CRYSTAL',text:'Find the Mirror Chamber crystal.',done:()=>crystal.collected},{name:'CORE KEY',text:'Trigger the Mirror Chamber light flicker.',done:()=>world.key&&world.flickerDone},{name:'TITAN ANCHOR',text:'Activate your Titan pressure plate.',done:()=>world.plate},{name:'MIRROR COINS',text:'Collect all three Echo Coins.',done:()=>coins.every(coin=>coin.collected)}],
[{name:'STABILIZER BREAKER',text:'Activate all three Core stabilizers.',done:()=>world.objectiveCount===3},{name:'CORE CRYSTAL',text:'Find the Null Engine crystal.',done:()=>crystal.collected},{name:'UNTOUCHED CORE',text:'Finish without taking damage.',done:()=>world.damage===0},{name:'SWIFT STABILIZER',text:'Activate the Swift stabilizer.',done:()=>!!objectives.find(item=>item.method==='speed')?.got},{name:'SKY STABILIZER',text:'Activate the Sky stabilizer.',done:()=>!!objectives.find(item=>item.method==='pulse')?.got},{name:'TITAN STABILIZER',text:'Activate the Titan stabilizer.',done:()=>!!objectives.find(item=>item.method==='slam')?.got}]];
function levelQuests(){ return LEVEL_QUESTS[world.level]||LEVEL_QUESTS[0]; }
const world = { width: 2350, ground: 620, broken:false, key:false, plate:false, won:false, level:0, crystals:0,
coinTotal:0, coinLevels:[], completed:[], seals:0, questActive:false, questDone:false, questIndex:0, perfect:false,
perfectCount:0, damage:0, meteor:false, laserOff:false, laserTimer:0, doorOpen:false, doorTimer:0, blockMoved:false,
objectiveCount:0, flickerDone:true, flickerUntil:0 }; let solids = [ { x:-100, y:620, w:555, h:140, kind:'ground', art:'p4' }, { x:530, y:620, w:510,
h:140, kind:'ground', art:'p5' }, { x:1090, y:620, w:160, h:140, kind:'ground', art:'p4' }, { x:1550, y:620, w:800,
h:140, kind:'ground', art:'p6' }, { x:520, y:430, w:280, h:25, kind:'ceiling', art:'p1' }, { x:1195, y:390, w:170, h:25,
kind:'platform', art:'p3' }, { x:1390, y:290, w:220, h:25, kind:'platform', art:'p10' }, { x:1740, y:455, w:160, h:25,
kind:'platform', art:'p7' } ]; let wall = { x:430, y:390, w:54, h:230 }; let agilityGate = { x:790, y:493, w:37, h:127
}; let plate = { x:1775, y:591, w:94, h:29 }; let exit = { x:2175, y:450, w:125, h:170 }; let hazards = [{ x:1040, y:600,
w:50, h:20 }, { x:1250, y:600, w:300, h:20 }]; function reset() { world.crystals=0; world.crystalLevels=Array(6).fill(false);
world.coinTotal=0; world.coinLevels=Array.from({ length:6 },()=>Array(3).fill(false)); world.completed=Array(6).fill(false);
loadLevel(0,true); } function loadLevel(index, first=false) { world.level=index; world.broken=false; world.key=false;
world.plate=false; world.nullPlate=false; world.won=false; world.questActive=false; world.questDone=false; world.questIndex=0;
world.perfect=false; world.perfectCount=0; world.damage=0; world.meteor=false; world.laserOff=false; world.laserTimer=0; world.flickerDone=index!==4; world.flickerUntil=0;
world.doorOpen=false; world.doorTimer=0; world.blockMoved=false; world.objectiveCount=0; const offset=[0, 60, -35, 85,
15, 115][index]; wall={ x:430+offset, y:390, w:54, h:230 }; agilityGate={ x:790+offset, y:493, w:37, h:127 }; plate={
x:1775+offset, y:591, w:94, h:29 }; exit={ x:2175+offset, y:450, w:125, h:170 }; hazards=LEVELS[index].laser?[{ x:1040+offset,
y:600, w:50, h:20 }, { x:1250+offset, y:600, w:300, h:20 }, { x:1640+offset, y:600, w:80, h:20 }]:[{ x:1040+offset,
y:600, w:50, h:20 }, { x:1250+offset, y:600, w:300, h:20 }]; solids=[ { x:-100, y:620, w:555+offset, h:140, kind:'ground',
art:'p4' }, { x:530+offset, y:620, w:510, h:140, kind:'ground', art:'p5' }, { x:1090+offset, y:620, w:160, h:140, kind:'ground',
art:'p4' }, { x:1550+offset, y:620, w:800, h:140, kind:'ground', art:'p6' }, { x:520+offset, y:430, w:280, h:25, kind:'ceiling',
art:'p1' }, { x:1195+offset, y:390, w:170, h:25, kind:'platform', art:'p3' }, { x:1390+offset, y:290, w:220, h:25, kind:'platform',
art:'p10' }, { x:1740+offset, y:455, w:160, h:25, kind:'platform', art:'p7' } ]; // Each level has a different route, not a shifted copy of one room.
if(index===1){ world.broken=true; wall={ x:-500, y:0, w:1, h:1 }; agilityGate={ x:-500, y:0, w:1, h:1 }; solids=[{ x:-100,
y:620, w:700, h:140, kind:'ground', art:'p4' }, { x:1650, y:620, w:700, h:140, kind:'ground', art:'p6' }, { x:220, y:420,
w:220, h:25, kind:'platform', art:'p1' }, { x:1780, y:440, w:210, h:25, kind:'platform', art:'p7' }]; hazards=[{ x:600,
y:600, w:1050, h:20 }]; keyTarget={ x:1790, y:330, w:68, h:82 }; plate={ x:1990, y:591, w:94, h:29 }; exit={ x:2200,
y:450, w:125, h:170 }; } if(index===2){ solids=[{ x:-100, y:620, w:460, h:140, kind:'ground', art:'p4' }, { x:760, y:620,
w:260, h:140, kind:'ground', art:'p5' }, { x:1510, y:620, w:840, h:140, kind:'ground', art:'p6' }, { x:470, y:490, w:160,
h:25, kind:'platform', art:'p2' }, { x:1040, y:400, w:190, h:25, kind:'platform', art:'p3' }, { x:1320, y:300, w:170,
h:25, kind:'platform', art:'p10' }]; world.broken=true; wall={ x:-500, y:0, w:1, h:1 }; agilityGate={ x:-500, y:0, w:1,
h:1 }; keyTarget={ x:1365, y:195, w:68, h:82 }; plate={ x:1750, y:591, w:94, h:29 }; exit={ x:2165, y:450, w:125, h:170
}; hazards=[{ x:1020, y:600, w:460, h:20 }]; } if(index===3){ solids=[{ x:-100, y:620, w:600, h:140, kind:'ground',
art:'p5' }, { x:720, y:620, w:340, h:140, kind:'ground', art:'p6' }, { x:1320, y:620, w:1030, h:140, kind:'ground',
art:'p6' }, { x:540, y:470, w:150, h:25, kind:'platform', art:'p2' }, { x:1050, y:420, w:150, h:25, kind:'platform',
art:'p7' }, { x:1480, y:350, w:200, h:25, kind:'platform', art:'p3' }]; world.broken=true; wall={ x:-500, y:0, w:1,
h:1 }; agilityGate={ x:-500, y:0, w:1, h:1 }; keyTarget={ x:1515, y:245, w:68, h:82 }; plate={ x:2010, y:591, w:94,
h:29 }; exit={ x:2200, y:450, w:125, h:170 }; hazards=[{ x:1060, y:600, w:260, h:20 }, { x:1720, y:600, w:80, h:20 }];
} if(index===4){ solids=[{ x:-100, y:620, w:510, h:140, kind:'ground', art:'p4' }, { x:600, y:620, w:320, h:140, kind:'ground',
art:'p5' }, { x:1160, y:620, w:1190, h:140, kind:'ground', art:'p6' }, { x:440, y:450, w:130, h:25, kind:'platform',
art:'p1' }, { x:930, y:410, w:180, h:25, kind:'platform', art:'p3' }, { x:1400, y:355, w:170, h:25, kind:'platform',
art:'p10' }]; wall={ x:390, y:410, w:50, h:210 }; agilityGate={ x:915, y:500, w:35, h:120 }; keyTarget={ x:260, y:500,
w:68, h:82 }; plate={ x:1860, y:591, w:94, h:29 }; exit={ x:2180, y:450, w:125, h:170 }; hazards=[{ x:920, y:600, w:240,
h:20 }]; } if(index===5){ solids=[{ x:-100, y:620, w:480, h:140, kind:'ground', art:'p5' }, { x:610, y:620, w:260, h:140,
kind:'ground', art:'p4' }, { x:1120, y:620, w:1230, h:140, kind:'ground', art:'p6' }, { x:400, y:500, w:140, h:25, kind:'platform',
art:'p2' }, { x:880, y:425, w:170, h:25, kind:'platform', art:'p7' }, { x:1320, y:340, w:190, h:25, kind:'platform',
art:'p10' }, { x:1690, y:260, w:180, h:25, kind:'platform', art:'p3' }]; world.broken=false; wall={ x:1260, y:400, w:54,
h:220 }; agilityGate={ x:-500, y:0, w:1, h:1 }; keyTarget={ x:1735, y:155, w:68, h:82 }; plate={ x:1960, y:591, w:94,
h:29 }; exit={ x:2220, y:450, w:125, h:170 }; hazards=[{ x:870, y:600, w:250, h:20 }, { x:1510, y:600, w:170, h:20 }];
} mover=null; if(LEVELS[index].moving){ mover=index===2?{ x:475, y:525, w:170, h:25, kind:'platform', art:'p2', base:475,
range:520, phase:index, active:false }:{ x:1090+offset, y:505, w:180, h:25, kind:'platform', art:'p2', base:1090+offset,
range:250, phase:index }; solids.push(mover); } // Level-specific environmental reactions from the game design.
bridge=door=block=weakFloor=wind=airSwitch=recharge=null; nullField=energyWell=null; nullPlate=crusher=null; guideBeacon={
x:235, y:555, w:48, h:60, step:0 }; dialogue=null; objectives=[]; if(index===1){ bridge={ x:1035+offset, y:515, w:220,
h:25, kind:'platform', art:'p7', active:true, timer:-1, temporary:true }; solids.push(bridge); } if(index===1){ const
collapse={ x:850+offset, y:535, w:140, h:25, kind:'platform', art:'p3', active:true, timer:-1, collapse:true }; solids.push(collapse);
} if(index===3||index===5){ door={ x:(index===3?1900:2050)+offset, y:455, w:60, h:165 }; airSwitch={ x:(index===3?1685:1660)+offset,
y:330, w:60, h:60 }; } if(index===4){ block={ x:1045+offset, y:555, w:105, h:65, target:1260+offset }; } if(index===5){
weakFloor={ x:1710+offset, y:535, w:155, h:25, kind:'platform', art:'p3', active:true, weak:true }; solids.push(weakFloor);
wind={ x:1250+offset, y:250, w:280, h:340, push:250 }; } if(index===2){ objectives=[{ x:510, y:440, form:'swift', got:false
}, { x:925, y:510, form:'titan', got:false }, { x:1365, y:190, form:'sky', got:false }]; } if(index===3){ energyWell={
x:1070, y:470, w:180, h:150 }; recharge={ x:1500, y:545, w:55, h:75, used:false }; crusher={ x:1195, y:380, w:75, h:180,
base:380 }; } if(index===4){ nullField={ x:1110, y:420, w:220, h:200 }; nullPlate={ x:1710, y:591, w:94, h:29 }; } if(index===5){
objectives=[{ x:750, y:525, form:'swift', got:false, method:'speed' }, { x:1420, y:250, form:'sky', got:false, method:'pulse'
}, { x:1800, y:500, form:'titan', got:false, method:'slam' }]; } crystal={ x:1198+offset, y:320, w:28, h:42, collected:!!world.crystalLevels?.[index]
}; const coinMap=[[300, 470, 570], [420, 920, 1810], [250, 845, 1370], [390, 1125, 1660], [300, 960, 1770], [310, 1030,
1740]][index]; coins=coinMap.map((x,i)=>({ x,y:i===1?410:545,w:28,h:34,collected:!!world.coinLevels?.[index]?.[i] }));
if(index===0)keyTarget={ x:1460+offset, y:205, w:68, h:82 }; player = { x:120, y:520, vx:0, vy:0, form:'swift', facing:1,
onGround:false, platform:null, jumps:0, jumpBuffer:0, energy:100, health:100, hurtTimer:0, invulnerable:0, dashCooldown:0,
coyote:0, shiftTime:0, lastShift:0, momentum:0, impactReady:false, soarReady:0, meteorReady:false, regenLock:0, slam:false,
slamImpact:0 }; checkpointPoint={ x:[1120, 400, 820, 820, 700, 700][index], y:555, w:70, h:65, used:false }; checkpoint={
x:120, y:520, health:100, energy:100, form:'swift', puzzle:null }; camera = 0; particles=[]; elapsed=0; history=[];
gameOver=false; paused=false; controlsOpen=false; pendingLevel=-1; transitionTimer=0; questOffer=questReward=result=null;
introTimer=1.25; restartHold=0; endingTimer=0; screenKick=0; nullEnemy = { x:1430+offset, y:545, vx:0, vy:0, form:'swift',
active:!!LEVELS[index].nullStarts, hitCooldown:0, health:8, defeated:false }; message = { title:`LEVEL ${index+1}: ${LEVELS[index].name}`,
text:LEVELS[index].goal, timer:first?8:5 }; } function rect(a,b) { return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h
&& a.y+a.h > b.y; } function puff(x,y,color,count=10) { for(let i=0;i<count;i++) particles.push({ x,y,vx:(Math.random()-.5)*280,vy:(Math.random()-.8)*250,life:.65,color,size:2+Math.random()*5
}); } function announce(title,text,time=3) { message={ title, text, timer:time }; }
function judgePerformance(found){ const par=[70,80,95,105,115,130][world.level], timeScore=Math.max(0,Math.round(25*(1-Math.max(0,elapsed-par)/(par*1.5))));
const collectionScore=found*5, techniqueScore=Math.min(3,world.perfectCount)*5, survivalScore=Math.max(0,Math.round(20*(1-world.damage/100))), questScore=world.questDone?5:0;
const score=20+timeScore+collectionScore+techniqueScore+survivalScore+questScore, rank=score>=90?'S':score>=75?'A':score>=60?'B':score>=40?'C':'D';
return { score,rank,timeScore,collectionScore,techniqueScore,survivalScore,questScore }; }
function finishLevel(){ const found=coins.filter(c=>c.collected).length;
if(world.questActive&&!world.questDone&&levelQuests()[world.questIndex].done()){ world.questDone=true; world.seals++; player.health=Math.min(100,player.health+35);
player.energy=100; questReward={ name:levelQuests()[world.questIndex].name, seal:world.seals }; announce('ECHO QUEST COMPLETE',`Reward: Echo Seal ${world.seals} · health and energy restored.`,3);
} const performance=judgePerformance(found); world.completed[world.level]=true; result={ time:elapsed, coins:found, perfect:world.perfectCount, damage:world.damage,
next:world.level+1, ...performance }; sfx('gate'); } function speak(){ if(!guideBeacon||Math.abs(player.x-guideBeacon.x)>150)return;
if(!world.questActive){ questOffer={ index:world.questIndex }; dialogue={ name:'ECHO', text:'I have a mission for you. Choose accept or deny.',
start:elapsed, until:elapsed+7 }; sfx('key'); return; } const lines=LEVELS[world.level].talk, line=lines[guideBeacon.step++%lines.length];
dialogue={ name:'ECHO', text:line, start:elapsed, until:elapsed+6 }; sfx('key'); } function chooseQuest(accept){ if(!questOffer)return;
if(accept){ world.questIndex=questOffer.index; world.questActive=true; questOffer.closing=elapsed+.28; dialogue={ name:'ECHO',
text:`Quest accepted: ${levelQuests()[world.questIndex].text}`, start:elapsed, until:elapsed+7 }; announce('QUEST ACCEPTED','Finish it for an Echo Seal, health and energy refill.',2.5);
} else { world.questIndex=(questOffer.index+1)%levelQuests().length; questOffer={ index:world.questIndex }; dialogue={ name:'ECHO',
text:`Another mission: ${levelQuests()[world.questIndex].text}`, start:elapsed, until:elapsed+7 }; } sfx('key'); }
function pauseOptions(){ return ['RESUME','RESTART CHECKPOINT','RESTART LEVEL','CONTROLS',muted?'UNMUTE AUDIO':'MUTE AUDIO','MAIN MENU']; }
function toggleAudio(){ muted=!muted; music.muted=muted; if(!muted&&started)music.play().catch(()=>{ }); announce(muted?'AUDIO MUTED':'AUDIO ENABLED',muted?'Press M or choose Unmute Audio to restore sound.':'Music and sound effects are back on.',2); }
function tone(freq,duration=.08){ if(muted)return; try{ audio??=new (window.AudioContext||window.webkitAudioContext)(); const o=audio.createOscillator(),
g=audio.createGain(); o.frequency.value=freq; g.gain.setValueAtTime(.055,audio.currentTime); g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime+duration); }catch{ } } function sfx(name){
if(muted)return; const source=sounds[name]; if(!source)return; const clip=source.cloneNode(); clip.volume=.3; clip.play().catch(()=>{
}); } function startMusic(){ music.muted=muted; if(!muted)music.play().catch(()=>{ }); } function stopMusic(){ music.pause(); music.currentTime=0;
} function saveCheckpoint(x,y){ checkpoint={ x, y, health:Math.max(50,player.health), energy:Math.max(40,player.energy),
form:player.form, puzzle:{ broken:world.broken, key:world.key, plate:world.plate, flickerDone:world.flickerDone, laserOff:world.laserOff, doorOpen:world.doorOpen,
blockMoved:world.blockMoved, crystal:crystal.collected, solids:solids.map(s=>({ active:s.active,timer:s.timer,x:s.x
})) } }; checkpointPoint.used=true; announce('CHECKPOINT REACHED','Your progress in this level is safe.',2); sfx('gate');
} function restartCurrentLevel(){ // Capture the number first: R must never fall through to Level 1 while playing Level 5 or 6.
const currentLevel=Math.max(0,Math.min(LEVELS.length-1,Number(world.level)||0)); const savedQuest={ active:world.questActive,
index:world.questIndex, done:world.questDone, perfect:world.perfectCount }; loadLevel(currentLevel); Object.assign(world,{
questActive:savedQuest.active,questIndex:savedQuest.index,questDone:savedQuest.done,perfectCount:savedQuest.perfect
}); announce(`LEVEL ${currentLevel+1} RESTARTED`,'Quest progress remains active.',1.8); } function restartCheckpoint(){
if(!checkpoint?.puzzle){ restartCurrentLevel(); return; } const p=checkpoint.puzzle; Object.assign(world,{ broken:p.broken,key:p.key,plate:p.plate,laserOff:p.laserOff,doorOpen:p.doorOpen,blockMoved:p.blockMoved,
flickerDone:p.flickerDone??world.flickerDone }); crystal.collected=p.crystal; solids.forEach((s,i)=>Object.assign(s,p.solids[i]||{ })); player.x=checkpoint.x; player.y=checkpoint.y;
player.vx=player.vy=0; player.form=checkpoint.form; player.health=checkpoint.health; player.energy=checkpoint.energy;
player.slam=false; announce('CHECKPOINT RESTORED','Back in the action.',1.5); } function canFit(form,ignoreImpactWall=false){
const old=forms[player.form], f=forms[form], test={ x:player.x+(old.w-f.w)/2, y:player.y+old.h-f.h, w:f.w, h:f.h };
const blocks=[...solids.filter(s=>s.active!==false)]; if(!world.broken&&!ignoreImpactWall)blocks.push(wall); if(form!=='swift')blocks.push(agilityGate);
if(door&&!world.doorOpen)blocks.push({x:door.x,y:-2000,w:door.w,h:4000}); if(block&&!world.blockMoved)blocks.push(block); return !blocks.some(s=>rect(test,s));
} function shift(form) { if (gameOver || world.won || form===player.form) return; if(player.shiftLocked){ announce('SHIFTING DISABLED','Leave the Null Field before changing form.',2);
return; } const f=forms[form]; if(player.energy<f.energy){ announce('ENERGY LOW','Wait a moment for Shifter Energy to regenerate.',2);
return; } const old=forms[player.form]; const wasFalling=player.vy>300; const speed=Math.abs(player.vx); const impactAttempt=old.name==='SWIFT'&&form==='titan'&&speed>400;
const soarAttempt=old.name==='SWIFT'&&form==='sky'&&speed>400; const meteorAttempt=old.name==='SKY'&&form==='titan'&&player.soarReady>0;
if(!canFit(form,impactAttempt)){ announce('NOT ENOUGH SPACE','This form will not fit here.',2); tone(90,.08); return;
} const nearWall=Math.abs((player.x+forms[player.form].w)-wall.x)<95, perfect=speed>390 || (wasFalling && form==='titan')
|| nearWall; if(perfect){ world.perfect=true; world.perfectCount++; } player.energy -= perfect ? f.energy*.5 : f.energy;
player.lastShift=elapsed; player.shiftTime=.32; player.regenLock=.8; player.form=form; player.x += (old.w-f.w)/2; player.y
+= old.h-f.h; player.momentum=(impactAttempt||soarAttempt)?1:.45; player.impactReady=impactAttempt; player.soarReady=soarAttempt?5:Math.max(0,player.soarReady-.1);
player.meteorReady=meteorAttempt; if(nullEnemy&&nullEnemy.active)nullEnemy.warning={ form, until:elapsed+1.05 }; puff(player.x+f.w/2,player.y+f.h/2,f.color,perfect?34:20);
tone(form==='swift'?680:form==='titan'?130:410,.09); sfx('shift'); let combo=''; if(old.name==='SWIFT'&&form==='sky'&&speed>380)combo='SOAR SHIFT!';
else if(old.name==='SWIFT'&&form==='titan'&&speed>370)combo='IMPACT SHIFT!'; else if(old.name==='SKY'&&form==='titan'&&wasFalling)combo='METEOR SHIFT!';
else if(old.name==='TITAN'&&form==='swift')combo='BURST SHIFT!'; const duration=combo?.37:perfect?.35:.32; player.shiftTime=duration;
player.transform={ old:old.name.toLowerCase(), new:form, age:0, duration, perfect, combo }; if(perfect||combo)screenKick=combo?7:4;
if(combo) announce((perfect?'PERFECT ':'')+combo,'Momentum was preserved through the transformation.',2.2); else if(perfect)
announce('PERFECT SHIFT!', 'Perfect timing used half the normal energy.',2); else announce(form.toUpperCase()+' SHIFT',
f.label,1.5); } function input() { window.addEventListener('keydown', e => { if(['Space','KeyW','ArrowUp','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
keys[e.code]=true;if(questReward&&(e.code==='Enter'||e.code==='Space')){ questReward=null;return; }if(questOffer){ if(!questOffer.closing&&
(e.code==='KeyY'||e.code==='Enter'))chooseQuest(true);if(!questOffer.closing&&e.code==='KeyN')chooseQuest(false);return;
}if(!e.repeat&&e.code==='KeyM'){ toggleAudio(); return; }if(world.won&&e.code.startsWith('Digit')){ const n=Number(e.code.at(-1))-1;if(world.completed[n])loadLevel(n);return;
}if(!e.repeat&&e.code==='Escape'){ paused=!paused;announce(paused?'PAUSED':'RESUMED',paused?'Press ESC to continue.':'',paused?999:1.2);return;
} if(!e.repeat && (e.code==='Space'||e.code==='KeyW'||e.code==='ArrowUp'))tryJump(); if(!e.repeat&&e.code==='ShiftLeft')tryDash();
if(!e.repeat && e.code==='KeyE')special();if(!e.repeat&&e.code==='KeyF')speak(); if(e.code==='Digit1')shift('swift');
if(e.code==='Digit2')shift('titan'); if(e.code==='Digit3')shift('sky'); if(!e.repeat&&e.code==='KeyR'){ restartCheckpoint();restartHold=.01;
} }); window.addEventListener('keyup', e => { keys[e.code]=false;if(e.code==='KeyR')restartHold=0;if(['Space','KeyW','ArrowUp'].includes(e.code)&&player.vy<-180)player.vy*=.48;
}); canvas.addEventListener('pointerdown', e => { const box=canvas.getBoundingClientRect(), x=(e.clientX-box.left)*W/box.width,
y=(e.clientY-box.top)*H/box.height; if(questReward){ questReward=null;return; } if(questOffer){ if(!questOffer.closing&&y>=452&&y<=510)chooseQuest(x>W/2);return;
} if(paused){ const option=Math.floor((y-245)/52); if(y>=245&&y<245+pauseOptions().length*52){ if(option===0){ paused=false;announce('RESUMED','',1) }
else if(option===1){ paused=false;restartCheckpoint() }else if(option===2){ loadLevel(world.level) }else if(option===3){ controlsOpen=!controlsOpen }
else if(option===4){ toggleAudio() }else if(option===5){ started=false;paused=false;stopMusic();document.querySelector('#start').style.display='grid'; } }return; } if(y>=6&&y<=88){
if(x>=720&&x<793)shift('swift');else if(x>=806&&x<879)shift('titan');else if(x>=892&&x<965)shift('sky'); } }); } function
tryDash(){ if(player.form!=='swift'||player.dashCooldown>0||player.energy<6||Math.abs(player.vx)<80)return; player.vx=player.facing*780;
player.dashCooldown=.42; player.energy-=6; player.regenLock=.45; puff(player.x,player.y,'#39baff',16); tone(760,.07);
announce('SWIFT DASH','A burst of speed can set up a Soar or Impact Shift.',1.2); } function special(){ if(player.form==='sky'){
const nearSwitch=airSwitch&&Math.abs(player.x-airSwitch.x)<280&&Math.abs(player.y-airSwitch.y)<220; if(nearSwitch){
world.doorOpen=true; world.doorTimer=elapsed+7; if(LEVELS[world.level].laser){ world.laserOff=true; world.laserTimer=elapsed+5;
} } puff(player.x,player.y,'#aafaff',20); tone(830,.15); const skyLock=objectives.find(o=>o.method==='pulse'&&!o.got&&Math.abs(player.x-o.x)<190&&Math.abs(player.y-o.y)<190);
if(skyLock){ skyLock.got=true; world.objectiveCount++; announce('SKY STABILIZER ACTIVE','Air Pulse destabilized the cyan Core lock.',2.4);
} else announce(nearSwitch?'AIR PULSE!':'NO TARGET',nearSwitch?'The aerial switch opened the timed door and disabled the laser.':'Fly close to a visible aerial switch first.',2);
} if(player.form==='titan'&&!player.onGround){ player.vy=1250; player.slam=true; player.regenLock=.5; puff(player.x,player.y,'#65f6a0',20);
tone(90,.16); announce('GROUND SLAM!','Titan crashes down with Meteor force.',2); } } function tryJump(){ player.jumpBuffer=.13;
} function jumpNow(){ const f=forms[player.form]; if(player.onGround || player.coyote>0){ player.vy=-f.jump; player.onGround=false;
player.coyote=0; player.jumps=1; puff(player.x+f.w/2,player.y+f.h,'#dfffff',7); sfx('jump'); } else if(player.form==='swift'
&& player.jumps<2){ player.vy=-f.jump*.92; player.jumps=2; puff(player.x+f.w/2,player.y+f.h,'#3dbaff',12); announce('DOUBLE JUMP','Swift can reach places the other forms cannot.',1.5);
} } function respawn(reason) { if(player.invulnerable>0)return; const remaining=Math.max(0,player.health-25); world.damage=Math.min(100,world.damage+25); puff(player.x,player.y,'#ff5470',24);
sfx('hurt'); if(remaining<=0){ const current=world.level, savedQuest={ active:world.questActive, index:world.questIndex,
done:world.questDone, perfect:world.perfectCount, damage:world.damage }; loadLevel(current); Object.assign(world,{ questActive:savedQuest.active,questIndex:savedQuest.index,questDone:savedQuest.done,perfectCount:savedQuest.perfect,damage:savedQuest.damage
}); player.invulnerable=1.5; player.hurtTimer=1.5; announce('SHIFTER LOST','Health reached zero. Quest kept; you restarted at this level’s beginning.',2.8);
return; } restartCheckpoint(); player.health=remaining; player.hurtTimer=1.3; player.invulnerable=1.3; announce('CHECKPOINT RESTORED',`${reason} Health: ${player.health}%. A short safety shield is active.`,2.4);
} function collideX(f) { const body={ x:player.x, y:player.y, w:f.w, h:f.h }; const blocks=[...solids.filter(s=>s.active!==false)];
if(!world.broken)blocks.push(wall); if(player.form!=='swift')blocks.push(agilityGate); if(door&&!world.doorOpen)blocks.push({x:door.x,y:-2000,w:door.w,h:4000});
if(block&&!world.blockMoved)blocks.push(block); if(!world.key||!world.plate||!world.flickerDone)blocks.push(exit); for(const s of blocks)
if(rect(body,s)) { if(s===wall && player.form==='titan' && player.impactReady && Math.abs(player.vx)>400) { world.broken=true;
player.impactReady=false; puff(wall.x+25,wall.y+100,'#61f5ab',45); sfx('impact'); announce('IMPACT SHIFT!','Swift momentum shattered the cracked wall.',2.3);
continue; } if(s===block&&player.form==='titan'){ block.x=Math.min(block.target,block.x+7); if(block.x>=block.target){
world.blockMoved=true; announce('TITAN PUSH!','The giant block opened the route.',2); }continue; } if(player.vx>0) player.x=s.x-f.w;
else if(player.vx<0)player.x=s.x+s.w; player.vx=0; } } function collideY(f) { player.onGround=false; player.platform=null;
const body={ x:player.x, y:player.y, w:f.w, h:f.h }; for(const s of solids) if(s.active!==false&&rect(body,s)) { if(player.vy>0)
{ const slamHit=player.slam; player.y=s.y-f.h; player.vy=0; player.onGround=true; player.platform=s; player.jumps=0;
player.slam=false; if(slamHit){ player.slamImpact=.14; puff(player.x+f.w/2,player.y+f.h,'#69f7a1',25); if(s.weak){ s.active=false;
announce('METEOR SHIFT!','Titan smashed through the weak floor.',2.4); } }if(s.collapse&&s.timer<0){ s.timer=.8; announce('COLLAPSING FLOOR!','Swift dash to safety!',2);
}if(s.temporary&&s.timer<0){ s.timer=1.5; announce('ENERGY BRIDGE','It will fade soon—keep moving!',2); } } else if(player.vy<0)
{ player.y=s.y+s.h; player.vy=0; } } } function update(dt) { if(!started || gameOver || world.won || paused) return;
const realDt=dt; if(player.transform){ player.transform.age+=realDt; if(player.transform.age<.08)dt*=.34; else if(player.transform.age>=player.transform.duration)player.transform=null;
} screenKick=Math.max(0,screenKick-realDt*30); if(questOffer&&questOffer.closing&&elapsed>=questOffer.closing)questOffer=null;
if(questReward)return; if(result){ transitionTimer-=dt; if(transitionTimer<=0){ if(result.next<6){ pendingLevel=result.next;
transitionTimer=.7; result=null; }else{ world.won=true; result=null; } }return; } if(endingTimer>0){ endingTimer-=dt;
puff(1900+Math.random()*170,350+Math.random()*190,'#ff795a',2); if(endingTimer<=0){ finishLevel(); transitionTimer=4.8;
announce('THE NULL ENGINE HAS FALLEN','Your final report is ready.',3); }return; } if(pendingLevel>=0){ transitionTimer-=dt;
if(transitionTimer<=0)loadLevel(pendingLevel); return; } elapsed+=dt; if(world.flickerUntil&&elapsed>=world.flickerUntil){ world.flickerUntil=0; world.flickerDone=true;
announce('MIRROR LIGHTS STABILISED','The gate can now read both Titan plates.',2.5); sfx('gate'); } if(message.timer>0)message.timer-=dt; introTimer=Math.max(0,introTimer-dt);
if(restartHold){ restartHold+=dt; if(restartHold>.75){ restartCurrentLevel(); return; } } if(mover&&mover.active){ const
previous=mover.x; mover.x=mover.base+(Math.sin(elapsed*1.25+mover.phase)+1)*mover.range*.5; if(player.onGround&&player.platform===mover)player.x+=mover.x-previous;
} if(crusher){ crusher.y=crusher.base+Math.max(0,Math.sin(elapsed*2.1))*145; } for(const s of solids) if(s.timer>=0){
s.timer-=dt; if(s.timer<=0){ s.active=false; puff(s.x+s.w/2,s.y,'#64eaff',20); } } if(world.doorOpen&&elapsed>world.doorTimer){
world.doorOpen=false; announce('DOOR CLOSED','Use Sky Air Pulse again to reopen it.',2); } if(world.laserOff&&world.laserTimer&&elapsed>world.laserTimer){
world.laserOff=false; world.laserTimer=0; announce('SECURITY GRID RESTORED','The laser pattern is active again.',2);
} const f=forms[player.form], dir=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0); if(dir){ const turning=player.vx&&Math.sign(player.vx)!==dir;
player.vx+=dir*f.speed*(turning?12:7)*dt; player.facing=dir; }else player.vx*=Math.pow(player.onGround?.00018:.012,dt);
const speedLimit=player.momentum>0?700:f.speed; player.vx=Math.max(-speedLimit,Math.min(speedLimit,player.vx)); player.shiftLocked=!!(nullField&&rect({
x:player.x,y:player.y,w:f.w,h:f.h },nullField)); const drain=!!(energyWell&&rect({ x:player.x,y:player.y,w:f.w,h:f.h
},energyWell)); const flying=player.form==='sky'&&(keys.Space||keys.KeyW)&&player.energy>0; player.regenLock=Math.max(0,player.regenLock-dt);
player.slamImpact=Math.max(0,player.slamImpact-dt); player.soarReady=Math.max(0,player.soarReady-dt); player.hurtTimer=Math.max(0,player.hurtTimer-dt);
player.invulnerable=Math.max(0,player.invulnerable-dt); player.jumpBuffer=Math.max(0,player.jumpBuffer-dt); if(player.regenLock<=0&&!drain&&!flying)player.energy=Math.min(100,player.energy+7*dt);
player.coyote=player.onGround?.11:Math.max(0,player.coyote-dt); if(player.jumpBuffer>0&&(player.onGround||player.coyote>0||(player.form==='swift'&&player.jumps<2))){
player.jumpBuffer=0; jumpNow(); } player.shiftTime-=dt; player.momentum-=dt; if(player.momentum<=0)player.impactReady=false;
player.dashCooldown=Math.max(0,player.dashCooldown-dt); if(flying) { player.vy-=1060*dt; player.energy=Math.max(0,player.energy-30*dt);
player.regenLock=.7; puff(player.x+f.w/2,player.y+f.h,'#a5faff',1); } player.vy+= (player.form==='sky' && player.vy>0
? 520 : 1850)*dt; player.vy=Math.min(player.vy, player.form==='sky'?360:1050); if(wind&&rect({ x:player.x,y:player.y,w:f.w,h:f.h
},wind)){ if(player.form==='titan')player.vx*=.97; else player.vx+=wind.push*dt; } const steps=Math.max(1,Math.ceil(Math.max(Math.abs(player.vx),Math.abs(player.vy))*dt/10));
for(let step=0;step<steps;step++){ player.x+=player.vx*dt/steps; collideX(f); player.y+=player.vy*dt/steps; collideY(f);
} if(player.y>760)respawn('The Core consumes those who fall.'); const pb={ x:player.x, y:player.y, w:f.w, h:f.h }; for(const
item of objectives)if(!item.got&&player.form===item.form&&rect(pb,{ x:item.x,y:item.y,w:40,h:55 })&&(!item.method||(item.method==='speed'&&Math.abs(player.vx)>400)||(item.method==='slam'&&player.slamImpact>0))){
item.got=true; world.objectiveCount++; puff(item.x,item.y,'#a6f9ff',22); sfx('key'); announce(item.method?'STABILIZER ACTIVE':'ENERGY CORE RESTORED',`${world.objectiveCount}/${objectives.length} devices active.`,2);
if(world.level===2&&world.objectiveCount===3&&mover){ mover.active=true; announce('ANCIENT LIFT RESTORED','The moving platform has started.',3);
} } if(!checkpointPoint.used&&rect(pb,checkpointPoint))saveCheckpoint(checkpointPoint.x-30,520); if(weakFloor&&weakFloor.active&&player.form==='titan'&&player.slamImpact>0&&rect(pb,weakFloor)){
weakFloor.active=false; puff(weakFloor.x+70,weakFloor.y,'#65f5a0',35); announce('METEOR SHIFT!','Titan smashed through the weak floor.',2.4);
} if(recharge&&rect(pb,recharge)){ player.energy=100; player.regenLock=0; if(!recharge.used){ recharge.used=true; announce('ENERGY RESTORED','The blue recharge node refilled Shifter Energy.',1.5);
} } if(player.invulnerable<=0&&crusher&&player.form!=='titan'&&rect(pb,crusher))respawn('The crusher demands Titan form.');
if(player.invulnerable<=0)for(const h of hazards)if(rect(pb,h))respawn('The energy spikes hurt you.'); const laserLive=LEVELS[world.level].laser&&!world.laserOff&&(world.level!==3||Math.floor(elapsed*1.4)%2===0);
if(player.invulnerable<=0&&laserLive&&rect(pb,{ x:1570,y:330,w:300,h:13 }))respawn('The red laser caught you. Use Sky Air Pulse with E.');
if(!crystal.collected&&rect(pb,crystal)){ crystal.collected=true; world.crystalLevels[world.level]=true; world.crystals++;
puff(crystal.x,crystal.y,'#65f5ff',25); announce('SHIFTER CRYSTAL!',`Optional crystal ${world.crystals}/6 collected.`,2);
tone(980,.16); } for(const [i,coin] of coins.entries())if(!coin.collected&&rect(pb,coin)){ coin.collected=true; world.coinLevels[world.level][i]=true;
world.coinTotal++; puff(coin.x,coin.y,'#ffe65c',16); sfx('key'); announce('ECHO COIN FOUND',`Exploration reward ${world.coinTotal}/18 collected.`,1.7);
} if(!world.key && rect(pb,keyTarget)){ world.key=true; const wakesNull=world.level===4; if(wakesNull){ nullEnemy.active=true;
world.flickerDone=false; world.flickerUntil=elapsed+1.35; screenKick=8; } puff(keyTarget.x+30,keyTarget.y+40,'#ffe56b',30); sfx('key'); announce(wakesNull?'LIGHTS FLICKER — THE NULL HAS AWAKENED':'CORE KEY ACQUIRED',wakesNull?'Wait for the Mirror Chamber lights to stabilise; only then can the gate unlock.':'The gate mechanism can now be powered.',3);
} const plateJustActivated=!world.plate && player.form==='titan' && rect(pb,plate); world.plate=world.plate || plateJustActivated;
if(plateJustActivated){ saveCheckpoint(plate.x-100,520); sfx('gate'); announce('CHECKPOINT ACTIVE','Heavy plate active; the exit gate is unlocked.',2.2);
} if(world.key && world.plate && rect(pb,exit)){ if(!world.flickerDone)announce('GATE POWER UNSTABLE','The Mirror Chamber lights must stabilise first.',2.2);
else if(world.level===4&&!world.nullPlate) announce('SECOND PLATE NEEDED','Lure a Titan Null onto the mirror plate.',3);
else if(LEVELS[world.level].final&&world.objectiveCount<3) announce('CORE LOCKED','Activate the Swift, Sky and Titan stabilizers first.',3);
else if(LEVELS[world.level].final&&(!player.meteorReady||player.slamImpact<=0)) announce('CORE EXPOSED','Swift → Sky Soar Shift, then Titan + E for the final Meteor Shift!',3);
else if(LEVELS[world.level].final){ world.completed[world.level]=true; endingTimer=3; announce('CORE COLLAPSE','Run! The Null Engine is breaking apart.',3);
tone(110,.8); } else { finishLevel(); transitionTimer=4.8; announce('LEVEL COMPLETE!',`Performance score ${result.score}/100 — calculating your rank…`,3);
} } history.push({ t:elapsed,x:player.x,y:player.y,form:player.form,vx:player.vx,vy:player.vy }); while(history.length&&history[0].t<elapsed-2.2)history.shift();
if(nullEnemy.active) updateNull(dt); camera += (Math.max(0,Math.min(world.width-W,player.x-W*.42))-camera)*Math.min(1,dt*4);
for(const p of particles){ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=500*dt; p.life-=dt; }particles=particles.filter(p=>p.life>0);
} function updateNull(dt){ const target=history.find(h=>h.t>=elapsed-1.2)||history[0]||player; const oldForm=nullEnemy.form;
nullEnemy.form=target.form; if(oldForm!==nullEnemy.form){ puff(nullEnemy.x+32,nullEnemy.y+35,forms[nullEnemy.form].color,14);
sfx('null'); announce('NULL COPIED '+forms[nullEnemy.form].name,'It copies your form after a 1.2 second delay.',1.4);
} const dx=target.x-nullEnemy.x, dy=target.y-nullEnemy.y; let speed=0; if(nullEnemy.form==='swift'){ speed=440; nullEnemy.x+=Math.sign(dx)*Math.min(Math.abs(dx),speed*dt);
nullEnemy.y=545; } else if(nullEnemy.form==='titan'){ speed=155; nullEnemy.x+=Math.sign(dx)*Math.min(Math.abs(dx),speed*dt);
nullEnemy.y=538; } else { speed=300; nullEnemy.x+=Math.sign(dx)*Math.min(Math.abs(dx),speed*dt); nullEnemy.y+=Math.sign(dy)*Math.min(Math.abs(dy),speed*dt);
} nullEnemy.vx=Math.sign(dx)*speed; nullEnemy.hitCooldown-=dt; const nf=forms[nullEnemy.form], nb={ x:nullEnemy.x, y:nullEnemy.y,
w:nf.w, h:nf.h }, pb={ x:player.x, y:player.y, w:forms[player.form].w, h:forms[player.form].h }; if(rect(nb,pb)){ // Each form can damage the Null, but Titan remains the strongest attacker.
const nullDamage={swift:.5,sky:.7,titan:1.5}[player.form], movingFast=Math.abs(player.vx)>(player.form==='titan'?110:85), nullAttack=movingFast||player.impactReady||player.slamImpact>0||((keys.Space||keys.KeyW)&&player.form==='sky'); if(nullAttack&&nullEnemy.hitCooldown<=0){
nullEnemy.health=Math.max(0,nullEnemy.health-nullDamage); nullEnemy.hitCooldown=1; player.impactReady=false; player.slamImpact=0; puff(nullEnemy.x+35,nullEnemy.y+35,'#67f6a0',34);
sfx('impact'); if(nullEnemy.health<=0){ nullEnemy.active=false; nullEnemy.defeated=true; announce('NULL DESTROYED','Its copied forms have finally broken apart!',3);
}else announce('NULL DAMAGED',`${nullEnemy.health.toFixed(1)}/8 stability remaining.`,1.8); } else if(player.hurtTimer<=0){ const
damage=10+Math.floor(Math.random()*16); world.damage=Math.min(100,world.damage+damage); player.hurtTimer=1.05; player.health=Math.max(0,player.health-damage); screenKick=7;
player.vx=Math.sign(player.x-nullEnemy.x)*520; player.vy=-360; puff(player.x,player.y,'#ff5c75',32); sfx('hurt'); if(player.health<=0){
const current=world.level, savedQuest={ active:world.questActive, index:world.questIndex, done:world.questDone, perfect:world.perfectCount, damage:world.damage
}; loadLevel(current); Object.assign(world,{ questActive:savedQuest.active,questIndex:savedQuest.index,questDone:savedQuest.done,perfectCount:savedQuest.perfect,damage:savedQuest.damage
}); player.invulnerable=1.4; player.hurtTimer=1.4; announce('NULL DEFEATED YOU','Quest kept. You restarted at this level’s beginning.',2.5);
}else announce('NULL STRIKE!',`${damage} damage. ${player.health}% health remaining.`,1.5); } } if(world.level===4&&nullEnemy.form==='titan'&&!world.broken&&rect(nb,wall)){
world.broken=true; puff(wall.x+25,wall.y+100,'#e8718d',45); sfx('impact'); announce('NULL SMASH!','The copied Titan shattered the wall for you.',3);
} if(nullPlate&&nullEnemy.form==='titan'&&rect(nb,nullPlate)&&!world.nullPlate){ world.nullPlate=true; sfx('gate');
announce('MIRROR PLATE ACTIVE','Both Titan plates are held. The gate is open!',3); } } // Fixed artwork bounds prevent both lag and transparent-canvas placement errors.
function trim(image){ if(trimCache.has(image)) return trimCache.get(image); if(!image.complete || !image.naturalWidth)
return null; const crop=ART_CROP[image.assetKey]||{ x:0, y:0, w:image.naturalWidth, h:image.naturalHeight }; trimCache.set(image,crop);
return crop; } function drawImage(image,x,y,w,h,alpha=1,flip=false){ ctx.save(); ctx.globalAlpha=alpha; if(flip){ ctx.translate(x+w,y);
ctx.scale(-1,1); ctx.drawImage(image,0,0,w,h); }else ctx.drawImage(image,x,y,w,h); ctx.restore(); } function drawArt(image,x,y,w,h,alpha=1,flip=false){
const c=trim(image); if(!c){ drawImage(image,x,y,w,h,alpha,flip); return; } ctx.save(); ctx.globalAlpha=alpha; if(flip){
ctx.translate(x+w,y); ctx.scale(-1,1); ctx.drawImage(image,c.x,c.y,c.w,c.h,0,0,w,h); }else ctx.drawImage(image,c.x,c.y,c.w,c.h,x,y,w,h);
ctx.restore(); } function drawWorld(){ const bg=img.background, viewOffset=[0, 110, 285, 430, 560, 710][world.level];
if(bg.complete)drawImage(bg,-camera*.018-viewOffset,0,W,H,.98); const grade=['#073e3a0e', '#0b6d501c', '#22556f24',
 '#77101f32', '#33052c40', '#9a122c42'][world.level]; ctx.fillStyle=grade; ctx.fillRect(0,0,W,H); if(world.flickerUntil>elapsed){ const flicker=.12+Math.random()*.32;
ctx.fillStyle=`rgba(255,242,196,${flicker})`; ctx.fillRect(0,0,W,H); } if(world.level===1||world.level===2){
const fog=ctx.createLinearGradient(0,H*.35,0,H); fog.addColorStop(0,'#a5fff000'); fog.addColorStop(1,world.level===1?'#58ffe02c':'#a8eaff32');
ctx.fillStyle=fog; ctx.fillRect(0,0,W,H); } if(world.level===3||world.level===5){ ctx.save(); ctx.globalAlpha=.32; ctx.fillStyle='#260510';
for(let x=70;x<W;x+=125){ ctx.fillRect(x,110+(x%3)*45,62,H); ctx.fillStyle='#e84156'; ctx.fillRect(x+27,135+(x%3)*45,7,110);
ctx.fillStyle='#260510'; }ctx.restore(); } // Supplied platforms become distant ruins: they add scale without becoming collision objects.
ctx.save(); ctx.globalAlpha=.09; ctx.filter='saturate(.8) contrast(1.08)'; for(let i=0;i<5;i++){ const rx=i*420-camera*.22-90,
ry=235+(i%3)*68; drawArt(img.p10,rx,ry,150,300,.55); drawArt(img.p1,rx-55,ry+155,260,70,.5); }ctx.restore(); // Three atmospheric depth layers make the supplied background feel like a living world.
for(let i=0;i<18;i++){ const x=((i*173-camera*.11+elapsed*(i%2?9:-6))%(W+160)+W+160)%(W+160)-80, y=125+(i*67)%510, r=2+(i%4);
ctx.save(); ctx.globalAlpha=.14+(i%3)*.05; ctx.shadowBlur=13; ctx.shadowColor=i%3?'#4bdbd5':'#ff6070'; ctx.fillStyle=i%3?'#75f5e4':'#e44962';
ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); ctx.restore(); } const shade=ctx.createLinearGradient(0,0,W,0);
shade.addColorStop(0,'#031b1c18'); shade.addColorStop(.52,'#08152222'); shade.addColorStop(1,'#30030b45'); ctx.fillStyle=shade;
ctx.fillRect(0,0,W,H); ctx.save(); ctx.translate(-camera,0); // Every visible level object below is supplied project art.
drawArt(img.magma,1960,80,300,390,LEVELS[world.level].final?.95:.48); for(let x=50;x<2240;x+=430) drawArt(img.vines,x,170,58,250,.54);
for(let x=300;x<2300;x+=620){ ctx.save(); ctx.globalAlpha=.2; ctx.filter='brightness(.55)'; drawArt(img.chain,x,0,24,270,.75);
ctx.restore(); } // Compact original platform treatment, matching the preferred in-game composition.
for(const s of solids)if(s.active!==false){ const h=s.kind==='ground'?138:54; ctx.save(); ctx.globalAlpha=.34; ctx.fillStyle='#02080cc0';
ctx.filter='blur(5px)'; ctx.fillRect(s.x+10,s.y+9,Math.max(10,s.w-16),13); ctx.restore(); drawArt(img[s.art],s.x,s.y-18,s.w,h,1);
} if(!world.broken){ ctx.save(); ctx.strokeStyle='#87f4aa'; ctx.shadowBlur=16; ctx.shadowColor='#6effa1'; ctx.lineWidth=2;
ctx.setLineDash([5,7]); ctx.strokeRect(wall.x+9,wall.y+23,wall.w-18,wall.h-40); ctx.restore(); drawArt(img.p10,wall.x-18,wall.y,93,235,1);
drawArt(img.vines,wall.x+4,wall.y+12,40,190,.75); } if(!world.broken) text(world.level===5?'CORE BARRIER':'CRACKED',wall.x-16,365,12,world.level===5?'#ff9ba8':'#c5f38b');
if(world.level===0||world.level===4){ drawArt(img.p8,agilityGate.x-13,agilityGate.y-16,63,151,.95); drawArt(img.p9,agilityGate.x+4,agilityGate.y+20,24,94,.85);
} if(world.level===0)text('SWIFT GAP',755,475,12,'#76dbff'); if(world.level===1){ ctx.save(); ctx.globalAlpha=.55; ctx.strokeStyle='#8ffcff';
ctx.setLineDash([7,9]); ctx.lineWidth=2; for(let y=470;y<570;y+=25){ ctx.beginPath(); ctx.moveTo(630,y); ctx.lineTo(1570,y-18);
ctx.stroke(); }ctx.restore(); text('SOAR RAVINE',1050,425,17,'#b0fbff','center'); } for(const h of hazards){ ctx.save();
ctx.shadowBlur=15; ctx.shadowColor='#ff3048'; drawArt(img.spikes,h.x,h.y-6,h.w,35,1); ctx.restore(); } // exit / key / plate
drawArt(img.gate,exit.x,exit.y,exit.w,exit.h,world.plate&&world.flickerDone?1:.42); if(world.level===4&&!world.flickerDone)text('LIGHTS FLICKERING',exit.x-38,430,10,'#ffd18a'); if(!world.key){ drawArt(img.chain,keyTarget.x+13,105,18,120,.9);
drawArt(img.key,keyTarget.x+4,keyTarget.y,26,90,1); text('CORE KEY',keyTarget.x-27,165,12,'#ffed91'); } if(!crystal.collected){
ctx.save(); ctx.shadowBlur=18; ctx.shadowColor='#52f9ff'; drawArt(img.key,crystal.x,crystal.y,25,42,.78); ctx.restore();
text('CRYSTAL',crystal.x-15,crystal.y-8,9,'#83fcff'); } for(const coin of coins)if(!coin.collected){ ctx.save(); ctx.shadowBlur=16;
ctx.shadowColor='#ffe661'; drawArt(img.pad,coin.x,coin.y,28,28,.92); ctx.restore(); text('COIN',coin.x-4,coin.y-6,8,'#ffe990');
} drawArt(img.pad,checkpointPoint.x,checkpointPoint.y,checkpointPoint.w,28,checkpointPoint.used?1:.55); text(checkpointPoint.used?'CHECKPOINT ACTIVE':'CHECKPOINT',checkpointPoint.x-18,checkpointPoint.y-8,10,checkpointPoint.used?'#7affce':'#a3d3d9');
drawArt(img.pad,plate.x,plate.y-14,plate.w,48,world.plate?1:.6); text('TITAN PLATE',plate.x-35,575,12,world.plate?'#69ff9e':'#87b9b3');
if(door){ drawArt(img.gate,door.x,door.y,door.w,door.h,world.doorOpen?.24:1); text(world.doorOpen?'TIMED DOOR OPEN':'TIMED DOOR',door.x-20,445,10,world.doorOpen?'#80ffdc':'#ff8b9b');
} if(airSwitch){ drawArt(img.pad,airSwitch.x,airSwitch.y,60,32,.95); text('AIR SWITCH',airSwitch.x-18,airSwitch.y-8,10,'#9cfcff');
} if(block&&!world.blockMoved){ drawArt(img.p10,block.x,block.y-25,105,90,1); text('PUSH — TITAN',block.x-5,block.y-30,10,'#7effa8');
} if(wind){ ctx.save(); ctx.globalAlpha=.42; for(let y=wind.y;y<wind.y+wind.h;y+=38){ ctx.strokeStyle='#9efaff'; ctx.lineWidth=2;
ctx.beginPath(); ctx.moveTo(wind.x,y); ctx.lineTo(wind.x+wind.w,y-12); ctx.stroke(); }ctx.restore(); text('WIND TUNNEL',wind.x+80,wind.y-10,11,'#b1fbff');
} if(nullField){ ctx.save(); ctx.globalAlpha=.25; ctx.fillStyle='#ef2942'; ctx.fillRect(nullField.x,nullField.y,nullField.w,nullField.h);
ctx.restore(); text('NULL FIELD',nullField.x+65,nullField.y-10,11,'#ff98a4'); } if(energyWell){ ctx.save(); ctx.globalAlpha=.22;
ctx.fillStyle='#e52d4c'; ctx.fillRect(energyWell.x,energyWell.y,energyWell.w,energyWell.h); ctx.restore(); text('ENERGY REGEN BLOCKED',energyWell.x+20,energyWell.y-9,10,'#ff9ca8');
} if(recharge){ ctx.save(); ctx.shadowBlur=18; ctx.shadowColor='#49eaff'; drawArt(img.pad,recharge.x,recharge.y,recharge.w,recharge.h,1);
ctx.restore(); text('ENERGY RECHARGE',recharge.x-18,recharge.y-9,10,'#8ffcff'); } if(crusher){ drawArt(img.p10,crusher.x,crusher.y,crusher.w,180,1);
text('TITAN CRUSHER',crusher.x-15,crusher.y-9,10,'#8effb0'); } if(nullPlate){ drawArt(img.pad,nullPlate.x,nullPlate.y-14,nullPlate.w,48,world.nullPlate?1:.6);
text('NULL TITAN PLATE',nullPlate.x-35,575,11,world.nullPlate?'#ff8caf':'#ffc0cb'); } for(const item of objectives){
const c=forms[item.form].color; ctx.save(); ctx.shadowBlur=item.got?0:16; ctx.shadowColor=c; drawArt(item.got?img.pad:img.key,item.x,item.y,34,45,item.got?.65:1);
ctx.restore(); text(item.form.toUpperCase(),item.x-7,item.y-8,9,c); } const laserLive=LEVELS[world.level].laser&&!world.laserOff&&(world.level!==3||Math.floor(elapsed*1.4)%2===0);
if(laserLive){ ctx.save(); ctx.shadowBlur=18; ctx.shadowColor='#ff2a40'; ctx.fillStyle='#ff4056'; ctx.fillRect(1570,330,300,5);
ctx.restore(); text('LASER — SKY: E',1650,320,11,'#ff8e9d','center'); } if(nullEnemy.active){ const ni=img.null; drawArt(ni,nullEnemy.x,nullEnemy.y,76,70,.92,nullEnemy.vx<0);
text('THE NULL',nullEnemy.x-7,nullEnemy.y-10,11,'#ff7198'); ctx.fillStyle='#241019'; ctx.fillRect(nullEnemy.x-4,nullEnemy.y-4,68,5);
const nullSegments=8, nullSegmentWidth=7, nullSegmentGap=1; for(let segment=0;segment<nullSegments;segment++){ const segmentX=nullEnemy.x-2+segment*(nullSegmentWidth+nullSegmentGap); ctx.fillStyle='#4b2631'; ctx.fillRect(segmentX,nullEnemy.y-3,nullSegmentWidth,3); const remaining=Math.max(0,Math.min(1,nullEnemy.health-segment)); if(remaining>0){ ctx.fillStyle='#f24c6c'; ctx.fillRect(segmentX,nullEnemy.y-3,nullSegmentWidth*remaining,3); } } } if(nullEnemy.active&&nullEnemy.warning&&elapsed<nullEnemy.warning.until){
const wf=forms[nullEnemy.warning.form]; ctx.save(); ctx.globalAlpha=.55; ctx.strokeStyle=wf.color; ctx.shadowBlur=24;
ctx.shadowColor=wf.color; ctx.lineWidth=3; ctx.strokeRect(nullEnemy.x-6,nullEnemy.y-6,82,76); ctx.restore(); text('NULL SHIFTING…',nullEnemy.x-15,nullEnemy.y-20,10,wf.color);
} if(guideBeacon){ ctx.save(); ctx.shadowBlur=18; ctx.shadowColor='#8ffcff'; drawArt(img.pad,guideBeacon.x,guideBeacon.y,guideBeacon.w,26,.9);
ctx.restore(); text('ECHO  [F]',guideBeacon.x-14,guideBeacon.y-8,10,'#a9fbff'); } drawPlayer(); for(const p of particles){
ctx.globalAlpha=Math.max(0,p.life*1.5); ctx.fillStyle=p.color; ctx.fillRect(p.x,p.y,p.size,p.size); }ctx.globalAlpha=1;
ctx.restore(); // Near vines frame the action and create a strong 2D foreground layer.
ctx.save(); ctx.globalAlpha=.24; drawArt(img.vines,-18-camera*.04,0,96,470,.8); drawArt(img.vines,W-78-camera*.04,0,104,520,.78);
ctx.restore(); const vignette=ctx.createRadialGradient(W*.5,H*.45,180,W*.5,H*.45,760); vignette.addColorStop(.5,'#00101800');
vignette.addColorStop(1,'#00060b3d'); ctx.fillStyle=vignette; ctx.fillRect(0,0,W,H); }

function animationFrame(formName) {
const step=Math.floor(elapsed*12), moving=Math.abs(player.vx)>90, rising=player.vy<-70, falling=player.vy>95;
if(formName==='swift') {
if(player.dashCooldown>.22)return `swift-dash-${step%4+1}`;
if(!player.onGround)return rising?'swift-jump':'swift-fall';
return moving?`swift-run-${step%4+1}`:`swift-idle-${step%2+1}`;
}
if(formName==='titan') {
if(player.slam||player.slamImpact>0)return `titan-ground-slam-${step%4+1}`;
if(!player.onGround)return rising?'titan-jump':'titan-fall';
return moving?`titan-walk-${step%4+1}`:`titan-idle-${step%2+1}`;
}
if((keys.Space||keys.KeyW)&&player.energy>0)return `sky-fly-${step%3+1}`;
if(rising)return 'sky-ascend';
if(falling)return 'sky-rise';
return `sky-float-${step%4+1}`;
}

function animationBox(form) {
return { w:form.renderW,h:form.renderH };
}

function drawAnimation(formName,form,position,box,alpha=1) {
const sprite=img[animationFrame(formName)];
if(!sprite?.complete){ drawArt(img[form.image],position.x,position.y,box.w,box.h,alpha,player.facing<0); return; }
const height=box.h, naturalWidth=height*sprite.naturalWidth/sprite.naturalHeight;
const width=Math.max(box.w*.78,Math.min(box.w*1.65,naturalWidth));
const x=position.x+(box.w-width)/2, y=position.y+box.h-height;
ctx.save(); ctx.globalAlpha=alpha;
if(player.facing<0){ ctx.translate(x+width,y); ctx.scale(-1,1); ctx.drawImage(sprite,0,0,width,height); }
else ctx.drawImage(sprite,x,y,width,height);
ctx.restore();
}

function drawPlayer(){ const f=forms[player.form], speed=Math.min(1,Math.abs(player.vx)/700), tr=player.transform;
const spritePosition=(form,w=form.renderW,h=form.renderH)=>({ x:player.x+(f.w-w)/2+(form.offsetX||0),y:player.y+f.h-h+(form.offsetY||0) });
const box=animationBox(f);
if(speed>.2){ ctx.save(); ctx.shadowBlur=18; ctx.shadowColor=f.color; for(let i=0;i<5;i++){ ctx.globalAlpha=(.23-i*.034)*speed; ctx.strokeStyle=f.color;
ctx.lineWidth=2+i*1.3; ctx.beginPath(); ctx.moveTo(player.x+f.w/2-player.facing*(14+i*8),player.y+f.h*(.42+i*.08));
ctx.lineTo(player.x+f.w/2-player.facing*(46+speed*(88+i*15)),player.y+f.h*(.48+i*.055)); ctx.stroke(); }ctx.restore(); }
ctx.save(); ctx.globalAlpha=.27; ctx.fillStyle='#02080dcc'; ctx.beginPath(); ctx.ellipse(player.x+f.w/2,player.y+f.h+4,f.w*.48,7,0,0,Math.PI*2); ctx.fill(); ctx.restore();
if(tr){ const p=Math.min(1,tr.age/tr.duration), old=forms[tr.old], pulse=Math.sin(Math.min(1,tr.age/.16)*Math.PI), oldPos=spritePosition(old), newPos=spritePosition(f,box.w,box.h);
ctx.save(); ctx.globalAlpha=.22*pulse; ctx.strokeStyle=f.color; ctx.shadowBlur=30; ctx.shadowColor=f.color; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(player.x+f.w/2,player.y+f.h*.55,22+p*34,0,Math.PI*2); ctx.stroke(); ctx.restore();
ctx.save(); ctx.globalAlpha=(1-p)*.88; ctx.shadowBlur=32; ctx.shadowColor=old.color; drawArt(img[old.image],oldPos.x,oldPos.y,old.renderW,old.renderH,1,player.facing<0); ctx.restore();
drawAnimation(player.form,f,newPos,box,Math.min(1,p*2));
} else { const pos=spritePosition(f,box.w,box.h); drawAnimation(player.form,f,pos,box,player.hurtTimer>0&&Math.floor(player.hurtTimer*16)%2?.42:1); }
} function text(t,x,y,size,color,align='left'){ ctx.font=`${size}px "Trebuchet MS",sans-serif`; ctx.fillStyle=color;
ctx.textAlign=align; ctx.fillText(t,x,y); } function hud(){ drawArt(img.health,16,14,300,55,1); drawArt(img.energy,314,5,280,98,1);
// Keep the supplied textured bars visible; only the lost segments are masked.
const blendSegments=(x,y,w,h,gap,value,edge,count,roundUp=true)=>{ const amount=value/100*count, filled=Math.max(0,Math.min(count,roundUp?Math.ceil(amount):Math.floor(amount)));
for(let i=0;i<count;i++){ if(i<filled)continue; const px=x+i*(w+gap); ctx.save(); ctx.beginPath(); ctx.moveTo(px+1,y-1);
ctx.lineTo(px+w+1,y-1); ctx.lineTo(px+w-1,y+h+2); ctx.lineTo(px-1,y+h+2); ctx.closePath(); ctx.fillStyle='#05070fff';
ctx.fill(); ctx.lineWidth=1; ctx.strokeStyle=edge; ctx.stroke(); ctx.restore(); } }; // Exact cell locations measured from the supplied HUD art: seven health crystals and ten energy cells.
blendSegments(122,34,21,17,1,player.health,'#4a151e',7,false); blendSegments(375,43,14.5,19,1.5,player.energy,'#183d50',10);
// The source energy art ships at 80%, so copy one of its cyan crystal cells into slots 9–10 when energy rises above 80%.
const energyCells=Math.ceil(player.energy/10); if(energyCells>8)for(let i=8;i<energyCells;i++){ const px=375+i*16; ctx.drawImage(img.energy,384,420,84,116,px,43,14.5,19);
} // Hide the percentage printed into the supplied texture. The text below is the only live value.
ctx.fillStyle='#07171de8'; ctx.fillRect(520,47,57,24); ctx.strokeStyle='#1f5870'; ctx.strokeRect(520,47,57,24); // The supplied form-button art is the HUD; a glow identifies the player's one current form.
const buttons=[['swift', 'swiftButton'], ['titan', 'titanButton'], ['sky', 'skyButton']]; for(const [i,[name,art]] of
buttons.entries()){ const x=720+i*86, selected=player.form===name, ready=player.energy>=forms[name].energy, size=selected?80:73;
ctx.save(); ctx.shadowBlur=selected?22:0; ctx.shadowColor=forms[name].color; drawArt(img[art],x-(size-73)/2,5-(size-73)/2,size,size,ready?(selected?1:.58):.25);
ctx.restore(); } text(`${Math.ceil(player.energy)}%`,548,65,13,'#dfffff','center'); text(`LEVEL ${world.level+1}/6 · ${LEVELS[world.level].zone} · COINS ${world.coinTotal}/18 · CRYSTALS ${world.crystals}/6 · SEALS ${world.seals}`,W-25,27,13,'#dfffff','right');
const levelObjective=[world.broken?'POWER THE EXIT GATE':'BREAK THE CRACKED WALL', 'BUILD MOMENTUM AND CROSS THE RAVINE',
`RESTORE THE LIFT — ${world.objectiveCount}/3 CORES`, world.doorOpen?'RACE THROUGH THE OPEN SECURITY DOOR':'DISABLE THE SECURITY GRID',
world.key?'TRICK THE NULL INTO OPENING THE PATH':'FIND THE CORE KEY', `DESTROY THE 3 CORE STABILIZERS — ${world.objectiveCount}/3`][world.level];
text(`OBJECTIVE  ${levelObjective}`,W-25,67,13,'#e3fbff','right'); if(objectives.length){ const tracker=world.level===2?`CORES  ${objectives.map((o,i)=>`${
i+1 }${ o.got?'✓':'✕' }`).join('  ')}`:`STABILIZERS  ${objectives.map(o=>`${ o.form.toUpperCase() } ${ o.got?'✓':'✕'
}`).join('  ')}`; text(tracker,W-25,105,12,'#b8f7ff','right'); } const questText=world.questActive?levelQuests()[world.questIndex].text:'Visit ECHO [F] to accept this level’s quest';
text(`QUEST  ${questText}`,W-25,48,13,world.questActive?'#dfffff':'#9ae6ec','right'); const found=coins.filter(c=>c.collected).length;
text(`CHALLENGE  ECHO COINS ${found}/3  ·  PERFECT SHIFT ${world.perfect?'✓':'✕'}`,W-25,objectives.length?124:87,12,'#ffeaa0','right');
if(message.timer>0){ ctx.fillStyle='#06131ae0'; ctx.fillRect(W/2-260,H-105,520,67); ctx.strokeStyle='#6cecf188'; ctx.strokeRect(W/2-260,H-105,520,67);
text(message.title,W/2,H-78,18,world.won?'#ffea8b':'#81f7ff','center'); text(message.text,W/2,H-55,13,'#e6fbff','center');
} if(dialogue&&elapsed<dialogue.until){ const shown=dialogue.text.slice(0,Math.max(1,Math.floor((elapsed-dialogue.start)*34))), x=22, y=H-158, w=560, h=80;
const panel=ctx.createLinearGradient(x,y,x,y+h); panel.addColorStop(0,'#102a36f4'); panel.addColorStop(.55,'#071721f3'); panel.addColorStop(1,'#040c13f3'); ctx.save(); ctx.shadowBlur=18; ctx.shadowColor='#55eff477'; ctx.fillStyle=panel; ctx.fillRect(x,y,w,h); ctx.restore();
ctx.lineWidth=2; ctx.strokeStyle='#76eff5'; ctx.strokeRect(x,y,w,h); ctx.fillStyle='#59eaf1'; ctx.fillRect(x+60,y+10,3,h-20); ctx.save(); ctx.shadowBlur=14; ctx.shadowColor='#67f6ff'; ctx.fillStyle='#123e50'; ctx.beginPath(); ctx.arc(x+33,y+31,20,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#9bfaff'; ctx.stroke(); ctx.restore();
text('E',x+33,y+38,20,'#e1ffff','center'); text(dialogue.name,x+75,y+22,13,'#91f9ff'); text('ECHO TRANSMISSION',x+w-16,y+22,9,'#78cbd0','right'); text(shown,x+75,y+45,13,'#f0ffff');
ctx.fillStyle='#16404b'; ctx.fillRect(x+75,y+56,w-92,1); text('F  ·  talk to Echo again for the next hint',x+75,y+72,10,'#9bdce2');
} if(questOffer){ const q=levelQuests()[questOffer.index], fade=questOffer.closing?Math.max(0,(questOffer.closing-elapsed)/.28):1, x=W/2-310, y=172, w=620, h=354;
ctx.save(); ctx.globalAlpha=fade; const panel=ctx.createLinearGradient(x,y,x,y+h); panel.addColorStop(0,'#142f3beF'); panel.addColorStop(.5,'#071923f6'); panel.addColorStop(1,'#08121bf8'); ctx.shadowBlur=30; ctx.shadowColor='#4feef277'; ctx.fillStyle=panel; ctx.fillRect(x,y,w,h); ctx.restore(); ctx.save(); ctx.globalAlpha=fade;
ctx.lineWidth=2; ctx.strokeStyle='#87f3f6'; ctx.strokeRect(x,y,w,h); ctx.fillStyle='#48e8f0'; ctx.fillRect(x+18,y+58,w-36,2); ctx.fillStyle='#0e4553'; ctx.fillRect(x+20,y+18,w-40,30); text('ECHO MISSION',W/2,y+40,18,'#e8ffff','center'); text('NEW TRANSMISSION',x+w-28,y+39,10,'#83dce2','right');
text(q.name,W/2,y+101,24,'#ffe49a','center'); text(q.text,W/2,y+137,16,'#dffbff','center'); ctx.fillStyle='#0a2933'; ctx.fillRect(x+50,y+161,w-100,48); ctx.strokeStyle='#2f8190'; ctx.strokeRect(x+50,y+161,w-100,48);
text('MISSION REWARD',W/2,y+180,11,'#88eaf0','center'); text('ECHO SEAL   ·   HEALTH +35   ·   ENERGY FULL',W/2,y+199,13,'#fff0b1','center');
for(const [buttonX,label,mark,accent,fill] of [[W/2-228,'DECLINE','×','#ffb093','#572f2b'],[W/2+18,'ACCEPT MISSION','✓','#a6ffe0','#1b5e50']]){ const buttonY=452, buttonW=210, buttonH=56, button=ctx.createLinearGradient(buttonX,buttonY,buttonX,buttonY+buttonH); button.addColorStop(0,fill); button.addColorStop(.55,'#102d37'); button.addColorStop(1,'#071720'); ctx.save(); ctx.shadowBlur=14; ctx.shadowColor=accent+'77'; ctx.fillStyle=button; ctx.fillRect(buttonX,buttonY,buttonW,buttonH); ctx.restore(); ctx.lineWidth=2; ctx.strokeStyle=accent; ctx.strokeRect(buttonX,buttonY,buttonW,buttonH); ctx.fillStyle=accent; ctx.fillRect(buttonX+6,buttonY+6,4,buttonH-12); text(mark,buttonX+31,buttonY+37,29,accent,'center'); text(label,buttonX+119,buttonY+34,13,'#ffffff','center'); }
text('N  decline  ·  ENTER  accept',W/2,y+h-15,11,'#91dce3','center'); ctx.restore(); } if(questReward){ ctx.fillStyle='#07131ceb'; ctx.fillRect(W/2-245,165,490,390);
ctx.strokeStyle='#d8a84e'; ctx.lineWidth=3; ctx.strokeRect(W/2-245,165,490,390); text('★   ★   ★',W/2,225,28,'#ffe36b','center');
text('MISSION COMPLETE',W/2,275,28,'#fff1bf','center'); text(questReward.name,W/2,309,17,'#9ff8ff','center'); text('REWARD',W/2,355,17,'#d9e2e4','center');
text(`+1 ECHO SEAL   ·   SEALS ${questReward.seal}`,W/2,395,20,'#ffe279','center'); text('HEALTH RESTORED   ·   ENERGY FULL',W/2,428,14,'#b8eff4','center');
ctx.fillStyle='#174b59'; ctx.fillRect(W/2-145,466,290,55); ctx.strokeStyle='#8ef7ff'; ctx.strokeRect(W/2-145,466,290,55);
text('ENTER  ·  CONTINUE',W/2,500,16,'#efffff','center'); } if(introTimer>0){ const a=Math.min(1,introTimer*2); ctx.save();
ctx.globalAlpha=a; ctx.fillStyle='#031017bc'; ctx.fillRect(0,0,W,H); text(`LEVEL ${world.level+1}`,W/2,H/2-24,17,'#8dfaff','center');
text(LEVELS[world.level].name,W/2,H/2+18,38,'#f3feff','center'); text(LEVELS[world.level].zone,W/2,H/2+46,13,'#83dfe8','center');
ctx.restore(); } if(result){ const m=Math.floor(result.time/60), s=String(Math.floor(result.time%60)).padStart(2,'0');
ctx.fillStyle='#020a0ae8'; ctx.fillRect(0,0,W,H); ctx.strokeStyle='#67eaf2'; ctx.strokeRect(W/2-230,118,460,454); text('LEVEL COMPLETE',W/2,160,30,'#e6ffff','center');
text(`PERFORMANCE SCORE  ${result.score}/100`,W/2,205,22,'#ffe89a','center'); text(`TIME  ${m}:${s}  ·  PACE ${result.timeScore}/25`,W/2-172,252,15,'#dffaff');
text(`EXPLORATION  ${result.coins}/3 COINS  ·  ${result.collectionScore}/15`,W/2-172,285,15,'#ffe89a'); text(`TECHNIQUE  ${result.perfect} PERFECT SHIFTS  ·  ${result.techniqueScore}/15`,W/2-172,318,15,'#a9efff');
text(`SURVIVAL  ${result.damage} DAMAGE  ·  ${result.survivalScore}/20`,W/2-172,351,15,'#ffb0ba'); text(`QUEST BONUS  ${result.questScore}/5`,W/2-172,384,15,'#a6f6cf');
text(`RANK  ${result.rank}`,W/2,461,47,result.rank==='S'?'#ffe56d':result.rank==='A'?'#9cf7ff':'#e9e2bf','center'); text('Your performance has been judged. Next level loading…',W/2,510,13,'#a3dce1','center');
} if(endingTimer>0){ ctx.fillStyle='#35111a55'; ctx.fillRect(0,0,W,H); text('THE CORE IS COLLAPSING',W/2,115,22,'#ffe099','center');
} if(world.won){ ctx.fillStyle='#020a0acc'; ctx.fillRect(0,0,W,H); text('SHIFTBREAKER',W/2,H/2-48,44,'#ffeb8b','center');
text('THE NULL ENGINE HAS FALLEN',W/2,H/2-12,20,'#dcfcff','center'); text(world.crystals===6?'SECRET UNLOCKED — THE SIX SHIFTER CRYSTALS ARE RESTORED.':'Recover all 6 Shifter Crystals to unlock the secret ending.',W/2,H/2+25,14,'#aaf6ff','center');
text('Press 1–6 to replay a completed level',W/2,H/2+62,14,'#87cdd1','center'); } if(pendingLevel>=0){ ctx.fillStyle='#020a0a99';
ctx.fillRect(0,0,W,H); text('LEVEL COMPLETE',W/2,H/2-12,34,'#e9fdff','center'); text(LEVELS[world.level].name,W/2,H/2+25,18,'#92e8ee','center');
} if(paused){ const panelX=W/2-225, panelY=82, panelW=450, panelH=510, options=pauseOptions(), icons=['▶','↻','↺','?','♫','⌂'];
ctx.fillStyle='#02080bd8'; ctx.fillRect(0,0,W,H); const panel=ctx.createLinearGradient(panelX,panelY,panelX,panelY+panelH);
panel.addColorStop(0,'#0d2930f5'); panel.addColorStop(.5,'#06151cf8'); panel.addColorStop(1,'#071f27f5'); ctx.save(); ctx.shadowBlur=30;
ctx.shadowColor='#4debf066'; ctx.fillStyle=panel; ctx.fillRect(panelX,panelY,panelW,panelH); ctx.restore(); ctx.lineWidth=2; ctx.strokeStyle='#73edf3'; ctx.strokeRect(panelX,panelY,panelW,panelH);
ctx.fillStyle='#64eff6'; ctx.fillRect(panelX+22,panelY+67,panelW-44,2); text('PAUSED',W/2,panelY+48,39,'#e9ffff','center'); text(muted?'AUDIO OFF':'AUDIO ON',W/2,panelY+89,11,muted?'#ffb5a1':'#a6f6cf','center');
for(const [i,label] of options.entries()){ const y=245+i*52, x=W/2-178, w=356, h=42, accent=i===4?(muted?'#8feeff':'#ffbc79'):'#7cedf3'; const button=ctx.createLinearGradient(x,y,x,y+h);
button.addColorStop(0,'#1a5561'); button.addColorStop(.45,'#0b3541'); button.addColorStop(1,'#061f2a'); ctx.save(); ctx.shadowBlur=12; ctx.shadowColor=accent+'66'; ctx.fillStyle=button; ctx.fillRect(x,y,w,h); ctx.restore();
ctx.lineWidth=2; ctx.strokeStyle=accent; ctx.strokeRect(x,y,w,h); ctx.fillStyle=accent; ctx.fillRect(x+5,y+5,4,h-10); ctx.globalAlpha=.18; ctx.fillStyle='#d7ffff'; ctx.fillRect(x+10,y+5,w-20,2); ctx.globalAlpha=1;
text(icons[i],x+25,y+28,20,accent,'center'); text(label,W/2+8,y+27,14,'#f1ffff','center'); }
if(controlsOpen){ ctx.fillStyle='#04131df5'; ctx.fillRect(W/2-270,104,540,102); ctx.lineWidth=2; ctx.strokeStyle='#8feef4'; ctx.strokeRect(W/2-270,104,540,102); text('CONTROLS',W/2,130,15,'#85f5fb','center');
text('A / D  MOVE   ·   SPACE  JUMP   ·   SHIFT  DASH   ·   1 / 2 / 3  SHIFT',W/2,158,12,'#efffff','center'); text('E  AIR PULSE / GROUND SLAM   ·   F  TALK   ·   R  CHECKPOINT',W/2,185,12,'#efffff','center'); }
text('Click an option  ·  ESC resumes  ·  M toggles audio',W/2,620,13,'#9bdce2','center');
} } function render(){ ctx.clearRect(0,0,W,H); ctx.save(); if(screenKick){ ctx.translate((Math.random()-.5)*screenKick,(Math.random()-.5)*screenKick);
}drawWorld(); if(player.transform&&player.transform.age<.12){ ctx.fillStyle=player.transform.perfect?'#eaffff24':'#bffaff15';
ctx.fillRect(-8,-8,W+16,H+16); }hud(); ctx.restore(); } function loop(now){ const dt=Math.min(.033,(now-last)/1000||0);
last=now; update(dt); render(); requestAnimationFrame(loop); } document.querySelector('#play').addEventListener('click',()=>{
if(!assetsReady)return;started=true;startMusic();document.querySelector('#start').style.display='none';canvas.focus();
}); input(); reset(); requestAnimationFrame(loop);
