/* Pixel silhouettes authored as tiny indexed masks. Presentation only.
   No RNG, no mutation of actors, no extra animation loops or canvas allocations. */
const REGION_FX=Object.freeze({
 valley:{color:'#79d9ed',count:18,style:'soul',speed:7},
 forest:{color:'#b9cb82',count:20,style:'leaf',speed:12},
 frozen:{color:'#d5efff',count:28,style:'snow',speed:25},
 ashen:{color:'#ff9b54',count:24,style:'ember',speed:19},
 cathedral:{color:'#e2c4ff',count:18,style:'dust',speed:6}
});
const BOSS_PIXEL=Object.freeze({
 crusader:{mask:['....1......','...121.....','..12321....','.1233321...','123333321..','.1233321...','..12321....','...121.....','....1......'],palette:['#79542c','#e7b662','#fff3bc'],count:7,scale:2,pattern:'sweep'},
 huntsman:{mask:['....1......','...12......','..123......','.1233333331','12333333321','.1233333331','..123......','...12......','....1......'],palette:['#426749','#9cd47a','#f0ffbd'],count:8,scale:1.5,pattern:'volley'},
 inquisitor:{mask:['....1....','...121...','...232...','..12321..','.1233321.','123333321','.1233321.','..12321..','...232...','...121...','....1....'],palette:['#4b8fc1','#91dcf4','#efffff'],count:7,scale:2,pattern:'ice'},
 paladin:{mask:['....1....','...12....','...123...','..12321..','..12332..','.1233321.','123333321','123333321','.1233321.','..12221..','...111...'],palette:['#903521','#f88939','#fff2aa'],count:9,scale:2,pattern:'fire'},
 exorcist:{mask:['....1....','...121...','...232...','111232111','223333322','333333333','223333322','111232111','...232...','...121...','....1....'],palette:['#7950ae','#c8a0f1','#fff3fb'],count:6,scale:2,pattern:'holy'}
});
function regionalFxBudget(){
 return !feelEnabled()||feelReduced()?0:prefs.effects==='soft'?10:28;
}
function regionalFxPoint(i,t,W,H,profile){
 const mod=(a,b)=>((a%b)+b)%b;
 const rise=profile.style==='ember'||profile.style==='soul'||profile.style==='dust';
 const x=mod(i*97.31+t*(profile.style==='snow'?17:profile.style==='leaf'?11:3),W);
 const y=mod(i*53.71+(rise?-1:1)*t*profile.speed,H);
 return {x:Math.floor(x),y:Math.floor(y),bright:i%4===0};
}
function regionalAmbient(W){
 const p=REGION_FX[biomeId(S)],budget=regionalFxBudget();if(!p||!budget||!(W>0))return;
 const t=feelClock,amount=Math.min(p.count,budget);ctx.save();ctx.beginPath();ctx.rect(0,0,W,WORLD_H);ctx.clip();
 ctx.fillStyle=p.color;
 for(let i=0;i<amount;i++){
  const q=regionalFxPoint(i,t,W,WORLD_H,p);ctx.globalAlpha=(q.bright?.38:.19)*feelStrength();
  if(p.style==='snow'){ctx.fillRect(q.x,q.y,2,2);if(q.bright)ctx.fillRect(q.x-2,q.y,6,1);}
  else if(p.style==='leaf'){ctx.fillRect(q.x,q.y,3,2);ctx.fillRect(q.x+2,q.y+2,2,1);}
  else if(p.style==='ember'){ctx.fillRect(q.x,q.y,2,3);if(q.bright)ctx.fillRect(q.x-1,q.y+4,1,1);}
  else{ctx.fillRect(q.x,q.y,q.bright?2:1,q.bright?3:1);}
 }ctx.restore();
}
function bossPixelStamp(profile,x,y,scale,angle=0){
 const rows=profile.mask,w=rows[0].length,h=rows.length;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);
 for(let j=0;j<h;j++){
  const row=rows[j];for(let i=0;i<row.length;){
   const c=row[i];let end=i+1;while(end<row.length&&row[end]===c)end++;
   if(c!=='.'){ctx.fillStyle=profile.palette[Number(c)-1];ctx.fillRect(Math.floor((i-w/2)*scale),Math.floor((j-h/2)*scale),Math.ceil((end-i)*scale),Math.ceil(scale));}
   i=end;
  }
 }ctx.restore();
}
function bossPixelLayout(id,r,q,i,n){
 const angle=i*Math.PI*2/n,cos=Math.cos(angle),sin=Math.sin(angle);
 if(id==='crusader'){const a=-Math.PI*.85+i*Math.PI*1.7/Math.max(1,n-1);return {x:Math.cos(a)*r*(.25+.62*q),y:Math.sin(a)*r*(.25+.62*q),angle:a};}
 if(id==='huntsman'){return {x:cos*r*(.9-.62*q),y:sin*r*(.9-.62*q),angle:angle};}
 if(id==='inquisitor')return {x:cos*r*.67,y:sin*r*.67,angle:0};
 if(id==='paladin')return {x:cos*r*(.24+.62*q),y:sin*r*(.24+.62*q)-q*8,angle:0};
 return {x:cos*r*(.28+.55*q),y:sin*r*(.28+.55*q),angle:angle};
}
function bossPixelRelease(f,q,a){
 const p=BOSS_PIXEL[f.id],budget=regionalFxBudget();if(!p||!budget)return false;
 const r=Math.max(8,Math.min(90,f.r)),n=Math.min(p.count,prefs.effects==='soft'?4:9);
 ctx.save();ctx.globalAlpha=a*.86;
 for(let i=0;i<n;i++){
  const v=bossPixelLayout(f.id,r,q,i,n);bossPixelStamp(p,v.x,v.y,p.scale*(.75+.25*(1-q)),v.angle);
 }
 ctx.restore();return true;
}
function bossWindupAccents(W){
 const budget=regionalFxBudget();if(!budget||S.phase!=='fight')return;
 ctx.save();ctx.beginPath();ctx.rect(0,0,W,WORLD_H);ctx.clip();
 let count=0;
 for(const e of S.enemies){
  const d=bossDef(e),c=e.bossCast;if(!d||!c||e.hp<=0||!(d.windup>0)||!BOSS_PIXEL[d.id])continue;
  const p=BOSS_PIXEL[d.id],q=Math.max(0,Math.min(1,1-c.left/d.windup));
  // Keep the original exact danger circle and timer arc visible. Small inward accents only.
  ctx.globalAlpha=(.23+q*.22)*feelStrength();
  for(let i=0;i<4;i++){const ang=i*Math.PI/2;bossPixelStamp(p,c.x+Math.cos(ang)*d.radius*.68,c.y+Math.sin(ang)*d.radius*.68,1,ang);}
  if(++count>=(prefs.effects==='soft'?1:3))break;
 }ctx.restore();
}
