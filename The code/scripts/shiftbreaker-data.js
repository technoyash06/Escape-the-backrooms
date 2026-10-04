(() => {
  'use strict';

// Form settings and level descriptions are easy to edit without touching the game engine.
const forms = {
      // Collision boxes stay small and fair; the art gets its own size and visual offset.
      swift: { name:'SWIFT', color:'#32aaff', speed:510, jump:700, w:46, h:58, renderW:95,renderH:70,offsetX:0,offsetY:-12,energy:16, label:'Double jump · Dash', image:'swift' },
      titan: { name:'TITAN', color:'#39e980', speed:235, jump:510, w:74, h:82, renderW:104,renderH:82,offsetX:-1,offsetY:-8,energy:20, label:'Break walls · Heavy plate', image:'titan' },
      sky: { name:'SKY', color:'#b7f8ff', speed:330, jump:540, w:50, h:67, renderW:72,renderH:88,offsetX:0,offsetY:-12,energy:18, label:'Glide · Flight', image:'sky' }
    };

const LEVELS = [
      {name:'AWAKENING', zone:'THE OVERGROWTH', goal:'Learn every form: break, squeeze through, fly, then power the gate.',talk:['I am Echo. Sprint as Swift, then shift while you are moving.','A cracked wall needs Swift speed carried into Titan. Try D, then 2.']},
      {name:'THE OVERGROWTH', zone:'MOMENTUM GROVE', goal:'Build Swift speed, then use a Soar Shift over the ravine.',talk:['The ravine is too wide for ordinary flight.','Sprint, jump, then press 3 in the air. That is a Soar Shift.']},
      {name:'THE RUINS', zone:'THE ANCIENT LIFT', goal:'Ride the moving platform, recover the key, and unlock the ruins gate.', moving:true,talk:['The Ancient Lift needs three Energy Cores.','Each core is tuned to a different form. Follow the tracker at the top.']},
      {name:'SHATTERED MACHINE', zone:'REDLINE FOUNDRY', goal:'Time the laser, use Air Pulse, and escape the machine floor.', moving:true, laser:true,talk:['The machine follows a rhythm. Watch the laser blink on and off.','Sky Air Pulse opens the timed route. Then race as Swift and face the crusher as Titan.']},
      {name:'THE NULL', zone:'MIRROR CHAMBER', goal:'Find the Core Key. Its light will wake the Null—then use its copied Titan form.', nullStarts:false,talk:['The Null copies what you were a moment ago—not what you are now.','Let it become Titan, then lure it into the cracked wall and mirror plate.']},
      {name:'THE CORE', zone:'NULL ENGINE CORE', goal:'Use every form, then Meteor Shift into the exposed Core.', final:true, nullStarts:true, laser:true,talk:['Three stabilizers hold the Core shut: Swift speed, Sky Air Pulse, Titan Ground Slam.','When it opens: Swift, Sky, then Titan in the air. Make the final Meteor Shift count.']}
    ];

  window.ShiftbreakerData = Object.freeze({ forms, LEVELS });
})();
