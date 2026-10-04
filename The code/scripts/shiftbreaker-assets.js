(() => {
  'use strict';

// Supplied images and their visible crop areas are kept outside gameplay code.
const ASSET = {
      background: '../Background/Background.png', swift: '../Character form/Player/Swift form.png',
      titan: '../Character form/Player/Titan form.png', sky: '../Character form/Player/Sky form.png',
      null: '../Character form/Enemy/Null-Enemy.png', health: '../Buttons and bars/Health bar.png', energy: '../Buttons and bars/Energy bar.png',
      swiftButton: '../Buttons and bars/Swift form button.png', titanButton: '../Buttons and bars/Titan form button.png', skyButton: '../Buttons and bars/Sky form button.png',
      p1: '../Platforms/Platform 1.png', p2: '../Platforms/Platform 2.png', p3: '../Platforms/Platform 3.png', p4: '../Platforms/Platform 4.png', p5: '../Platforms/Platform 5.png',
      p6: '../Platforms/Platform 6.png', p7: '../Platforms/Platform 7.png', p8: '../Platforms/Platform 8.png', p9: '../Platforms/Platform 9.png', p10: '../Platforms/Platform 10.png',
      key: '../Elements/Key.png', gate: '../Elements/Exit gate.png', pad: '../Elements/blue pressure pad  or activation switch.png',
      spikes: '../Elements/Spikes.png', vines: '../Elements/Vines for the design and climb up.png', chain: '../Elements/Chain to hold the key.png', magma: '../Elements/Design for magma.png'
    };

const ANIMATION_FRAMES = {
      swift:['idle-1','idle-2','run-1','run-2','run-3','run-4','jump','fall','dash-1','dash-2','dash-3','dash-4'],
      titan:['idle-1','idle-2','walk-1','walk-2','walk-3','walk-4','jump','fall','ground-slam-1','ground-slam-2','ground-slam-3','ground-slam-4'],
      sky:['float-1','float-2','float-3','float-4','fly-1','fly-2','fly-3','ascend','rise','hover-1','hover-2','hover-3','hover-4']
    };

for (const [form, names] of Object.entries(ANIMATION_FRAMES)) {
      const folder=form[0].toUpperCase()+form.slice(1);
      for (const name of names) ASSET[`${form}-${name}`]=`../Character form/Player/Animations/Frames/${folder}/${name}.png`;
    }

const ART_CROP = {
      health:{x:40,y:180,w:2101,h:341},energy:{x:20,y:200,w:1661,h:581},swiftButton:{x:40,y:60,w:1201,h:1161},titanButton:{x:60,y:60,w:1161,h:1141},skyButton:{x:20,y:60,w:1221,h:1161},
      p1:{x:180,y:360,w:801,h:261},p2:{x:920,y:720,w:321,h:161},p3:{x:60,y:440,w:581,h:281},p4:{x:0,y:580,w:861,h:341},p5:{x:920,y:600,w:761,h:201},p6:{x:0,y:680,w:321,h:201},p7:{x:980,y:460,w:701,h:121},p8:{x:640,y:340,w:221,h:61},p9:{x:640,y:340,w:221,h:61},p10:{x:0,y:0,w:361,h:401},
      key:{x:400,y:0,w:321,h:1301},gate:{x:60,y:200,w:1001,h:961},pad:{x:160,y:480,w:961,h:321},spikes:{x:80,y:100,w:2041,h:561},vines:{x:320,y:0,w:181,h:2161},chain:{x:320,y:20,w:101,h:2141},magma:{x:120,y:0,w:981,h:1441},
      swift:{x:80,y:140,w:1321,h:841},titan:{x:60,y:40,w:1341,h:1021},sky:{x:40,y:40,w:1021,h:1381},null:{x:40,y:140,w:1401,h:801}
    };

  window.ShiftbreakerAssets = Object.freeze({ ASSET, ART_CROP });
})();
