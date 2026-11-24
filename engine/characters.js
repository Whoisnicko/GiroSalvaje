/* Original pixel-style character drawings, v19-alpha.2. No external atlas. */
const CHARACTER_ART = {
 zombi:{body:'#697d42',shade:'#38482e',light:'#a4bb69',skin:'#99b66b',face:'#d0d9a1',gear:'claw'},
 espectro:{body:'#456e9e',shade:'#243b66',light:'#9dd9f8',skin:'#9fdff2',face:'#e7ffff',gear:'ghost'},
 dragon:{body:'#bc5736',shade:'#672d37',light:'#f4a255',gear:'dragon'},
 nigromante:{body:'#68518e',shade:'#342947',light:'#b48ad4',skin:'#b8c49b',face:'#e3e8b7',gear:'staff'},
 banshee:{body:'#8466a3',shade:'#443356',light:'#d5adf1',skin:'#d5c9f0',face:'#f3eaff',gear:'ghost'},
 lobo:{body:'#9e7650',shade:'#574333',light:'#e1b780',gear:'wolf'},
 esqueleto:{body:'#c4b89d',shade:'#6c6258',light:'#f6e7bf',skin:'#d4c5a9',face:'#fff0d0',gear:'bone'},
 soldado:{body:'#657f99',shade:'#344356',light:'#c3d4df',skin:'#bf8e64',face:'#f4c897',gear:'sword'},
 ballestero:{body:'#68814e',shade:'#364d36',light:'#a9b77c',skin:'#c18c61',face:'#efbf8d',gear:'bow'},
 caballero:{body:'#8395ac',shade:'#414d62',light:'#d6e2ec',skin:'#b9c6d0',face:'#ecf4f7',gear:'shield'},
 jinete:{body:'#946b50',shade:'#4a3935',light:'#d7ab78',skin:'#bca58c',face:'#e0c8a4',gear:'rider'},
 clerigo:{body:'#a99a64',shade:'#5a513e',light:'#eee0a1',skin:'#c09574',face:'#f5c9a2',gear:'staff'},
 incendiario:{body:'#a64c35',shade:'#612d30',light:'#ef9760',skin:'#b77a52',face:'#f1b07b',gear:'fire'},
 comandante:{body:'#8b4c47',shade:'#492e35',light:'#e2a36c',skin:'#b99a81',face:'#ebc5a0',gear:'axe'},
 alma:{body:'#258cae',shade:'#14516f',light:'#a8ffff',gear:'gem'},
 comodin:{body:'#9272ba',shade:'#4b365f',light:'#e4bafa',gear:'rune'}
};
function originalCharacterFrame(name,state,f){
 const p=CHARACTER_ART[name];if(!p)throw Error('Unknown artwork: '+name);
 const c=inkCanvas(64,64),g=c.getContext('2d');g.scale(4/3,4/3);g.lineJoin='miter';g.lineCap='square';
 const ink='#171b25',steel='#b9cbd2',gold='#d4a46b',dark='#26303b',phase=[0,1,0,-1][f],attack=state==='attack'?[0,1,2,0][f]:0,walk=state==='walk'?phase:0;
 const P=(d,col,outline=true)=>{const q=new Path2D(d);g.fillStyle=col;g.fill(q);if(outline){g.strokeStyle=ink;g.lineWidth=1.3;g.stroke(q);}};
 const R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
 const L=(d,col,w=1)=>{g.strokeStyle=col;g.lineWidth=w;g.stroke(new Path2D(d));};
 const human=['soldado','ballestero','caballero','jinete','clerigo','incendiario','comandante'].includes(name);
 g.translate(human?48:0,0);if(human)g.scale(-1,1);
 g.translate(attack*1.4,state==='idle'&&f===2?-1:0);
 if(p.gear==='gem'||p.gear==='rune'){
  g.translate(0,phase);P('M24 5 L36 19 L31 35 L24 42 L17 35 L12 19 Z',p.body);
  P('M24 6 L24 29 L13 19 Z',p.light,false);P('M24 29 L35 19 L31 34 L24 41 Z',p.shade,false);
  L('M24 8 L24 38 M14 19 L24 29 L34 19','#d9ffff',1);
  if(p.gear==='rune'){L('M19 19 L27 14 L25 23 L30 26 L19 32', '#fff0b8',2);}
 }else if(p.gear==='ghost'){
  g.translate(0,phase);
  P('M16 14 L19 6 L25 4 L31 8 L34 16 L30 21 L35 29 L32 37 L38 43 L27 39 L21 45 L20 36 L12 40 L15 29 L11 21 Z',p.shade);
  P('M19 9 L25 6 L30 10 L31 16 L27 20 L19 17 Z',p.body,false);
  P('M19 12 L28 11 L30 16 L25 19 L20 17 Z',ink,false);R(23,13,2,2,p.light);R(28,13,2,2,p.light);
  P('M16 21 L21 20 L26 25 L32 21 L35 30 L28 34 L25 40 L22 33 L15 36 L18 29 Z',p.body,false);
  L('M18 23 L21 28 L17 34 M27 24 L29 30 L26 36',p.light,2);
  P('M30 22 L35 21 L39 18 L42 19 L41 24 L36 27 L31 28 Z',p.light);
  if(name==='banshee'){P('M16 10 L11 16 L13 28 L9 33 L18 28 L21 15 Z',p.light);L('M15 17 L13 24','#f2e3ff');}
 }else if(p.gear==='dragon'){
  P('M11 29 L3 26 L7 34 L15 38 L25 37 L27 31 Z',p.shade);
  P('M17 26 L9 11 L13 7 L23 18 L25 9 L31 14 L31 28 Z',p.shade);
  P('M13 12 L19 17 L23 24 L17 22 Z',p.light,false);
  P('M16 28 L22 22 L31 23 L36 28 L33 36 L24 40 L16 36 Z',p.body);
  P('M29 26 L30 17 L34 11 L37 14 L40 11 L41 19 L46 23 L45 28 L36 29 Z',p.body);
  P('M33 17 L37 15 L38 20 L34 22 Z',p.light,false);R(39,20,3,2,'#fff1a1');R(40,20,1,2,ink);
  P('M29 29 L35 31 L31 37 L23 38 Z',p.light,false);
  P('M19 35 L24 36 L23 42 L16 42 L16 39 Z',p.shade);
  P('M30 35 L34 35 L37 42 L30 42 L28 39 Z',p.body);
  R(19,41,3,1,'#f0ddbc');R(34,41,3,1,'#f0ddbc');L('M19 29 L23 27 L27 28',p.light,2);
 }else if(p.gear==='wolf'){
  P('M12 27 L4 19 L6 29 L12 34 L17 31 Z',p.shade);
  P('M10 26 L18 20 L30 20 L35 25 L32 35 L18 37 L10 32 Z',p.body);
  P('M28 22 L31 12 L36 17 L40 12 L41 20 L46 24 L44 29 L35 30 Z',p.body);
  P('M32 20 L36 17 L40 20 L39 26 L34 27 Z',p.light,false);R(39,22,2,2,'#ffda73');R(44,24,2,2,ink);
  P('M16 33 L20 33 L19 38 L22 42 L15 42 L14 38 Z',p.shade);
  P('M28 33 L33 33 L33 38 L37 42 L30 42 L27 38 Z',p.shade);
  L('M13 27 L19 24 L26 25 M20 28 L24 30',p.light,2);
 }else{
  const hood=['staff','bow','fire'].includes(p.gear),armored=['sword','shield','axe','rider'].includes(p.gear),bone=p.gear==='bone';
  if(p.gear==='rider'){P('M9 27 L16 23 L31 24 L37 19 L43 23 L41 31 L35 35 L35 43 L30 43 L29 35 L17 35 L15 43 L10 43 L12 34 Z','#73523d');L('M14 29 L24 27 L32 28','#bb9063',2);}
  g.save();g.translate(walk*2,0);P('M15 30 L23 30 L23 37 L20 41 L22 44 L13 44 L13 40 Z',p.shade);R(15,40,5,2,p.light);g.restore();
  g.save();g.translate(-walk*2,0);P('M24 30 L31 30 L32 37 L35 41 L35 44 L26 44 L25 40 Z',p.body);R(28,40,4,2,p.light);g.restore();
  if(hood||name==='comandante')P('M14 17 L10 28 L8 39 L19 36 L25 25 L25 17 Z',p.shade);
  P('M14 18 L22 15 L29 16 L35 22 L32 31 L29 35 L16 34 L12 27 Z',p.body);
  P('M16 21 L22 18 L28 19 L30 24 L24 29 L18 27 Z',p.light,false);
  if(armored){L('M18 20 L24 20 L29 23 L25 28 L19 27',steel,2);R(18,29,11,2,dark);}
  if(bone){R(19,20,11,2,ink);R(18,24,12,2,ink);R(20,28,8,2,ink);}
  P('M16 30 L30 30 L30 34 L16 34 Z',dark);R(22,30,4,4,gold);R(23,31,2,2,ink);
  P('M14 19 L10 20 L9 26 L13 30 L17 27 L18 23 Z',p.shade);R(12,21,4,2,p.light);
  if(hood){P('M15 15 L15 8 L20 3 L27 3 L33 8 L35 15 L30 20 L19 19 Z',p.shade);P('M19 7 L25 5 L30 8 L31 12 L27 10 L21 11 Z',p.light,false);}
  P('M19 9 L29 8 L33 12 L32 17 L28 20 L21 19 L18 15 Z',p.skin);
  P('M20 9 L27 9 L30 11 L29 14 L22 14 Z',p.face,false);R(27,13,2,2,ink);R(31,13,1,2,ink);R(28,17,3,1,p.shade);
  if(armored){P('M17 12 L17 7 L22 4 L29 5 L34 9 L34 13 L29 12 L26 10 L20 12 Z',steel);L('M19 8 L23 6 L29 7','#f2f8f7',1);R(21,13,2,5,p.shade);}
  if(bone){R(23,12,3,3,ink);R(29,12,3,3,ink);R(27,16,2,2,ink);L('M23 18 L30 18',p.shade);}
  g.save();g.translate(attack*2,attack?-1:0);P('M30 19 L35 20 L37 26 L34 30 L29 28 L28 23 Z',p.body);R(31,21,3,3,p.light);P('M35 25 L39 26 L39 30 L34 30 Z',p.skin);
  if(['sword','shield','rider'].includes(p.gear)){P('M37 27 L39 23 L42 10 L45 7 L45 12 L41 26 L42 28 L40 30 Z',steel);L('M42 23 L44 11','#f6ffff');R(35,26,7,2,gold);}
  if(p.gear==='shield'){P('M28 22 L38 20 L43 24 L41 34 L35 38 L29 34 Z','#806143');P('M31 24 L38 23 L40 26 L38 33 L35 35 L32 32 Z',steel);R(34,26,4,5,gold);}
  if(p.gear==='axe'){P('M36 31 L41 11 L43 11 L39 32 Z','#805c41');P('M40 10 L46 8 L47 16 L40 19 L37 15 Z',steel);}
  if(p.gear==='staff'){P('M38 35 L39 10 L42 10 L41 35 Z','#8b6648');P('M36 8 L40 3 L44 7 L43 13 L38 13 Z',name==='clerigo'?'#fce69d':'#a9e8f2');R(40,6,2,3,'#f9ffff');}
  if(p.gear==='bow'){L('M35 14 Q46 22 35 33','#e5b77b',3);L('M35 14 L35 33','#d8d1b7');L('M31 24 L46 24',steel,2);}
  if(p.gear==='fire'){P('M37 29 L36 19 L40 13 L43 17 L44 25 L41 30 Z','#e96b36');P('M39 26 L39 20 L41 17 L42 24 Z','#ffe5a1',false);}
  if(p.gear==='claw'||bone){L('M36 28 L43 26 M37 30 L44 29',p.face,1.5);}
  g.restore();
 }
 // Remove nearly transparent antialias fringe; the canvas is sampled with nearest-neighbour.
 g.resetTransform();const im=g.getImageData(0,0,64,64);for(let i=3;i<im.data.length;i+=4){im.data[i]=im.data[i]<110?0:255;}g.putImageData(im,0,0);return c;
}
