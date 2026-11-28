const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const mod=read('engine/guardian-art-v72.js');
const harness=`
let blank=false,edge=false;const URL_={};
function inkCanvas(w,h){return {width:w,height:h,getContext:()=>({drawImage(){},fillRect(){},getImageData(){const data=new Uint8ClampedArray(w*h*4);if(!blank)for(let y=10;y<h-10;y++)for(let x=edge?0:10;x<w-10;x++)data[(y*w+x)*4+3]=255;return {data};}})};}
const sheet={width:320,height:896};const res={};
res.missing=installGuardian73(null)===0;res.invalid=installGuardian73({width:1,height:1})===0;
blank=true;res.blank=installGuardian73(sheet)===0;blank=false;
edge=true;res.edge=installGuardian73(sheet)===0;edge=false;
res.before=guardian72Frames('dragon',{level:3})===null;
res.installed=installGuardian73(sheet)===14;
for(const name of GUARDIAN72_ART.names)for(const level of [2,3]){
 const base=guardian72Frames(name,{level}),white=guardian72Frames(name,{level,flash:true}),gray=guardian72Frames(name,{level,gray:true}),g=guardian72Geometry(name,level,60);
 res[name+level]=base.length===12&&white.length===12&&gray.length===12&&base[0].width===160&&base[0].height===128&&base[0]!==white[0]&&g.k>0&&g.foot>g.top;
}
res.tier1=guardian72Frames('dragon',{level:1})===null;
return res;`;
const result=new Function(mod+harness)();for(const [k,v] of Object.entries(result))assert.equal(v,true,k);
assert.ok(read('engine/assets.js').includes('installGuardian73(guardianEvolvedSheet)'));
assert.ok(read('index.html').includes('v22-alpha.7.73'));
console.log(result);
