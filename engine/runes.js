/* Six single-stroke runes. Pure recognition, independent of combat. */
const RUNE_DEFS=[
{id:'fire',name:'Infernal Fire',color:'#ff9b56',closed:true,points:[[.18,.83],[.5,.17],[.82,.83],[.18,.83]],hint:'Draw a triangle, closing the three sides.'},
{id:'barrier',name:'Soul Barrier',color:'#57def5',closed:true,points:Array.from({length:65},(_,i)=>[.5+.34*Math.sin(i*Math.PI/32),.5-.34*Math.cos(i*Math.PI/32)]),hint:'Draw a circle. Join the ends.'},
{id:'lightning',name:'Chain Lightning',color:'#abdfff',closed:false,points:[[.66,.12],[.28,.46],[.68,.46],[.32,.87]],hint:'Draw a lightning bolt without lifting.'},
{id:'grasp',name:"Death's Grasp",color:'#b8a1ef',closed:false,points:[[.16,.18],[.5,.82],[.84,.18]],hint:'Draw a V in either direction.'},
{id:'frost',name:'Frost Nova',color:'#b7e9ff',closed:true,points:[[.18,.18],[.82,.18],[.82,.82],[.18,.82],[.18,.18]],hint:'Draw a square. Close the four sides.'},
{id:'harvest',name:'Soul Harvest',color:'#91dba5',closed:false,points:Array.from({length:65},(_,i)=>{const t=i/64,a=t*Math.PI*3.1,r=.035+.39*t;return [.5+Math.cos(a)*r,.5+Math.sin(a)*r];}),hint:'Draw a spiral of roughly one and a half turns.'}];
// Template distance is an internal tie-breaker, not a player-facing score.
const RUNE_N=48,runeDistance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function runeLength(p){return p.slice(1).reduce((s,q,i)=>s+runeDistance(q,p[i]),0)}
function runeBounds(p){const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]),x=Math.min(...xs),X=Math.max(...xs),y=Math.min(...ys),Y=Math.max(...ys);return {x,X,y,Y,w:X-x,h:Y-y,size:Math.max(X-x,Y-y)}}
function runeSample(p,n=RUNE_N,closed=false){const s=p.slice();if(closed&&runeDistance(s[0],s.at(-1))>1e-6)s.push(s[0]);const cum=[0];for(let i=1;i<s.length;i++)cum.push(cum[i-1]+runeDistance(s[i-1],s[i]));const len=cum.at(-1),out=[];if(!len)return null;let j=1;for(let k=0;k<n;k++){const t=len*k/(closed?n:n-1);while(j<cum.length-1&&cum[j]<t)j++;const a=s[j-1],b=s[j],f=(t-cum[j-1])/(cum[j]-cum[j-1]||1);out.push([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f])}return out}
function runeNorm(p){const b=runeBounds(p);return p.map(q=>[(q[0]-(b.x+b.X)/2)/b.size,(q[1]-(b.y+b.Y)/2)/b.size])}
function runeRot(p,a){const c=Math.cos(a),s=Math.sin(a);return p.map(q=>[q[0]*c-q[1]*s,q[0]*s+q[1]*c])}
function runeCircularity(p){const smooth=p.map((q,i)=>{const a=p[(i+p.length-1)%p.length],b=p[(i+1)%p.length];return [(a[0]+2*q[0]+b[0])/4,(a[1]+2*q[1]+b[1])/4]});let area=0,l=0;for(let i=0;i<smooth.length;i++){const a=smooth[i],b=smooth[(i+1)%smooth.length];area+=a[0]*b[1]-a[1]*b[0];l+=runeDistance(a,b)}return 2*Math.PI*Math.abs(area)/(l*l||1)}
const RUNE_TEMPLATES=RUNE_DEFS.map(d=>{const p=runeNorm(runeSample(d.points,RUNE_N,d.closed));return {d,p,c:runeCircularity(p)}});
function runeMatch(p,t,closed){let best=Infinity;for(const a of [-25,-15,-7.5,0,7.5,15,25]){const q=runeNorm(runeRot(p,a*Math.PI/180));for(const rev of [false,true])for(let shift=0;shift<(closed?RUNE_N:1);shift++){let sum=0;for(let i=0;i<RUNE_N;i++){const j=closed?(shift+(rev?-i:i)+RUNE_N)%RUNE_N:rev?RUNE_N-1-i:i;sum+=(q[i][0]-t[j][0])**2+(q[i][1]-t[j][1])**2}best=Math.min(best,Math.sqrt(sum/RUNE_N))}}return best}
/* Structural validators use scale-independent geometry after a physical-size check. */
const RUNE_RULES=Object.freeze({
 fire:{closed:true,gap:.25,corners:3,aspect:.48,fit:.20,epsilon:.075},
 barrier:{closed:true,gap:.24,aspect:.65,fit:.16},
 lightning:{closed:false,gap:.55,corners:4,aspect:.35,fit:.20,epsilon:.055},
 grasp:{closed:false,gap:.45,corners:3,aspect:.50,fit:.18,epsilon:.065},
 frost:{closed:true,gap:.24,corners:4,aspect:.66,fit:.18,epsilon:.065},
 harvest:{closed:false,gap:.24,aspect:.52,fit:.19}
});
function runeSmooth(p,closed){return p.map((q,i)=>{
 if(!closed&&(i===0||i===p.length-1))return q;
 const a=p[(i+p.length-1)%p.length],b=p[(i+1)%p.length];return [(a[0]+2*q[0]+b[0])/4,(a[1]+2*q[1]+b[1])/4];
});}
function runeLineDistance(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;if(!l)return runeDistance(p,a);const t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}
function runeRdpIndices(p,epsilon,start=0,end=p.length-1){
 let max=epsilon,k=-1;for(let i=start+1;i<end;i++){const d=runeLineDistance(p[i],p[start],p[end]);if(d>max){max=d;k=i;}}
 return k<0?[start,end]:runeRdpIndices(p,epsilon,start,k).slice(0,-1).concat(runeRdpIndices(p,epsilon,k,end));
}
function runePolygon(p,closed,epsilon){
 let q=p,ix;
 if(closed){let a=0,b=1,best=0;for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){const d=runeDistance(p[i],p[j]);if(d>best){best=d;a=i;b=j;}}q=p.slice(a).concat(p.slice(0,a));q.push(q[0]);const split=b-a;ix=runeRdpIndices(q,epsilon,0,split).slice(0,-1).concat(runeRdpIndices(q,epsilon,split,q.length-1));}
 else ix=runeRdpIndices(q,epsilon);
 let changed=true;while(changed){changed=false;for(let i=1;i<ix.length-1;i++){if(runeLineDistance(q[ix[i]],q[ix[i-1]],q[ix[i+1]])<epsilon*.65){ix.splice(i,1);changed=true;break;}}}
 if(closed&&ix.length>4&&runeLineDistance(q[0],q[ix[ix.length-2]],q[ix[1]])<epsilon*.65){q=q.slice(ix[1],-1).concat(q.slice(0,ix[1]+1));ix=runeRdpIndices(q,epsilon);}
 const vertices=ix.map(i=>q[i]);if(closed)vertices.pop();
 let worst=0,straight=1,lengths=[];
 for(let j=0;j<ix.length-1;j++){const a=ix[j],b=ix[j+1],chord=runeDistance(q[a],q[b]),arc=runeLength(q.slice(a,b+1));lengths.push(chord);straight=Math.min(straight,chord/(arc||1));let sum=0;for(let k=a;k<=b;k++)sum+=runeLineDistance(q[k],q[a],q[b])**2;worst=Math.max(worst,Math.sqrt(sum/(b-a+1))/(chord||1));}
 return {vertices,lengths,straight,worst};
}
function runeTurn(a,b,c){const x=b[0]-a[0],y=b[1]-a[1],u=c[0]-b[0],v=c[1]-b[1];return Math.atan2(x*v-y*u,x*u+y*v)*180/Math.PI;}
function runeTurns(v,closed){const out=[];for(let i=closed?0:1;i<(closed?v.length:v.length-1);i++)out.push(runeTurn(v[(i+v.length-1)%v.length],v[i],v[(i+1)%v.length]));return out;}
function runeCornerSharpness(q,v,closed){
 for(let j=closed?0:1;j<(closed?v.length:v.length-1);j++){
  let k=0;for(let i=1;i<q.length;i++)if(runeDistance(q[i],v[j])<runeDistance(q[k],v[j]))k=i;
  let peak=0;for(let off=-2;off<=2;off++){const i=k+off;if(!closed&&(i<3||i+3>=q.length))continue;const at=n=>q[(n+q.length)%q.length];peak=Math.max(peak,Math.abs(runeTurn(at(i-3),at(i),at(i+3))));}
  if(peak<38)return false;
 }return true;
}
function runeSpiral(q){
 for(const a of [q,q.slice().reverse()]){
  const center=a[0],radii=a.map(p=>runeDistance(p,center));let pos=0,neg=0;
  for(let i=6;i<a.length;i++){let x=Math.atan2(a[i][1]-center[1],a[i][0]-center[0])-Math.atan2(a[i-1][1]-center[1],a[i-1][0]-center[0]);while(x>Math.PI)x-=2*Math.PI;while(x< -Math.PI)x+=2*Math.PI;if(x>0)pos+=x;else neg-=x;}
  const winding=Math.abs(pos-neg),agreement=Math.max(pos,neg)/(pos+neg||1),first=radii.slice(5,19).reduce((s,x)=>s+x,0)/14,last=radii.slice(-15).reduce((s,x)=>s+x,0)/15;
  if(winding>=Math.PI*1.7&&winding<=Math.PI*3.8&&agreement>=.84&&last>first*1.32)return true;
 }return false;
}
function runeStructure(id,points,gap,aspect){
 const rule=RUNE_RULES[id];if(rule.closed?gap>rule.gap:gap<rule.gap)return rule.closed?'close':'open';
 if(aspect<rule.aspect)return 'proportions';
 const q=runeSmooth(runeNorm(runeSample(points,64,rule.closed)),rule.closed);
 if(id==='barrier'){
  const c=runeCircularity(q),cx=q.reduce((s,p)=>s+p[0],0)/q.length,cy=q.reduce((s,p)=>s+p[1],0)/q.length,rs=q.map(p=>Math.hypot(p[0]-cx,p[1]-cy)),mean=rs.reduce((s,x)=>s+x,0)/rs.length,cv=Math.sqrt(rs.reduce((s,x)=>s+(x-mean)**2,0)/rs.length)/mean;
  return c>=.86&&cv<=.19?'':'curve';
 }
 if(id==='harvest')return runeSpiral(q)?'':'spiral';
 const poly=runePolygon(q,rule.closed,rule.epsilon),v=poly.vertices;
 if(v.length!==rule.corners)return 'corners';
 const lengths=poly.lengths,ratio=Math.min(...lengths)/Math.max(...lengths),turns=runeTurns(v,rule.closed);
 if(poly.straight<.89||poly.worst>.10)return 'straight';
 if(!runeCornerSharpness(q,v,rule.closed))return 'corners';
 if(rule.closed){
  if(!turns.every(t=>Math.sign(t)===Math.sign(turns[0])))return 'corners';
  if(id==='fire'&&(ratio<.47||turns.some(t=>Math.abs(t)<75||Math.abs(t)>155)))return 'proportions';
  if(id==='frost'&&(ratio<.54||turns.some(t=>Math.abs(t)<58||Math.abs(t)>122)))return 'corners';
 }else{
  if(id==='grasp'){
   if(ratio<.56||Math.abs(turns[0])<65||Math.abs(turns[0])>145)return 'arms';
   const [a,b,c]=v;if(b[1]-Math.max(a[1],c[1])<.23||Math.abs(a[1]-c[1])>.35||(b[0]-a[0])*(c[0]-b[0])<=0)return 'arms';
  }else{
   if(ratio<.42||turns.some(t=>Math.abs(t)<90||Math.abs(t)>165)||turns[0]*turns[1]>=0)return 'zigzag';
   const vv=v[0][1]<v[3][1]?v:v.slice().reverse(),dx=vv.slice(1).map((p,i)=>p[0]-vv[i][0]),dy=vv.slice(1).map((p,i)=>p[1]-vv[i][1]);
   if(dx[0]*dx[1]>=0||dx[1]*dx[2]>=0||dy[0]<.12||dy[2]<.12||Math.abs(dy[1])>Math.abs(dx[1])*.65)return 'zigzag';
  }
 }return '';
}
function recognizeRune(raw,expectedId){
 if(!Array.isArray(raw)||raw.length<5||raw.length>4096)return {accepted:false,reason:'short'};
 const p=[];for(const q of raw){if(!Array.isArray(q)||!Number.isFinite(q[0])||!Number.isFinite(q[1]))return {accepted:false,reason:'invalid'};if(!p.length||runeDistance(q,p.at(-1))>.7)p.push(q);}
 if(p.length<5)return {accepted:false,reason:'short'};
 const b=runeBounds(p),len=runeLength(p),aspect=Math.min(b.w,b.h)/b.size;
 if(b.size<48||Math.min(b.w,b.h)<24||len<75)return {accepted:false,reason:'short'};
 if(aspect<.23||len/b.size>7.3)return {accepted:false,reason:'shape'};
 const gap=runeDistance(p[0],p.at(-1))/b.size,ranked=[];
 for(const {d,p:t,c} of RUNE_TEMPLATES){const rule=RUNE_RULES[d.id],failure=runeStructure(d.id,p,gap,aspect);const q=runeNorm(runeSample(p,RUNE_N,d.closed));let distance=runeMatch(q,t,d.closed);if(d.closed)distance+=.65*Math.abs(runeCircularity(q)-c);ranked.push({id:d.id,distance,failure:failure|| (distance>rule.fit?'shape':'')});}
 ranked.sort((a,b)=>a.distance-b.distance);
 const candidates=ranked.filter(x=>!x.failure),best=candidates[0],next=candidates[1];
 if(!best){const hint=ranked.find(x=>x.id===expectedId)||ranked[0];return {accepted:false,reason:hint.failure||'shape',hintId:hint.id};}
 if(next&&next.distance-best.distance<.018)return {accepted:false,reason:'ambiguous'};
 // Avoid reinterpreting an obviously closer malformed rune as an unrelated one.
 if(ranked[0].id!==best.id&&best.distance-ranked[0].distance>.035){const hint=ranked.find(x=>x.id===expectedId)||ranked[0];return {accepted:false,reason:hint.failure||'shape',hintId:hint.id};}
 return {accepted:true,id:best.id};
}
function runeFeedbackText(result){
 const id=result.hintId;
 if(result.reason==='short')return 'Draw a larger rune in one continuous stroke.';
 if(result.reason==='ambiguous')return 'Unclear incantation. Make its shape more distinct.';
 if(result.reason==='close')return id==='fire'?'Close the triangle.':id==='frost'?'Close the square.':'Join the ends of the circle.';
 if(result.reason==='open')return 'Keep the ends apart.';
 if(result.reason==='corners'||result.reason==='straight'||result.reason==='proportions'){
  if(id==='fire')return 'Draw three clear sides and corners.';
  if(id==='frost')return 'Draw four clear sides and corners.';
  if(id==='lightning')return 'Sharpen the two lightning angles.';
  if(id==='grasp')return 'Draw a V with two balanced arms.';
  if(id==='barrier')return 'Draw a rounded, closed circle.';
 }
 if(result.reason==='arms')return 'Draw a V with two balanced arms.';
 if(result.reason==='zigzag')return 'Sharpen the two lightning angles.';
 if(result.reason==='curve')return 'Draw a smooth circle without corners.';
 if(result.reason==='spiral')return 'Draw a spiral winding around its center.';
 return 'Unknown incantation. Draw a clear rune.';
}
