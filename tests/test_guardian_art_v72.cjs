const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const mod=read('engine/guardian-art-v72.js'),assets=read('engine/assets.js'),render=read('engine/renderer.js'),html=read('index.html');
const harness=`
const URL_={},sheet={width:432,height:672};let blank=false,fail=false,draws=0;
function inkCanvas(w,h){return {width:w,height:h,toDataURL:()=> 'data:image/png;base64,test',getContext:()=>({drawImage(){draws++;if(fail)throw Error('bad')},getImageData(){return {data:[0,0,0,blank?0:255]}},fillRect(){}})};}
const res={};res.badDimensions=installGuardian72({width:1,height:1})===0;res.absent=installGuardian72(null)===0;blank=true;res.empty=installGuardian72(sheet)===0;blank=false;
res.installed=installGuardian72(sheet)===21;res.portraits=Object.keys(URL_).length===7;
for(const name of GUARDIAN72_ART.names)for(let level=1;level<=3;level++){
 const base=guardian72Frames(name,{level}),white=guardian72Frames(name,{level,flash:true}),gray=guardian72Frames(name,{level,gray:true});
 if(level>1){res[name+level]=base===null&&white===null&&gray===null;continue;}
 res[name+level]=base.length===12&&white.length===12&&gray.length===12&&base[0]!==white[0]&&base[0]!==gray[0]&&base[0].width===144&&base[0].height===96&&base[0]===base[1];
 // Ghost idle uses a distinct vertical offset.
 if(name==='espectro'||name==='banshee')res[name+level]=base.length===12&&white.length===12&&gray.length===12&&base[0]!==white[0]&&base[0]!==gray[0]&&base[0]!==base[1];
}
res.skeleton=guardian72Level({type:'K',lvl:1,nl:3,temp:true})===3;res.wolf=guardian72Level({type:'L',lvl:3,temp:true})===1;res.mergeable=guardian72Level({type:'A',lvl:3})===3;res.invalid=guardian72Level({type:'W',lvl:99})===1;res.fallback=guardian72Frames('soldado')===null&&guardian72Frames('zombi',{level:9})===null;
res.offsets=guardian72Offsets('zombi',10).join(',')==='3,-1'&&guardian72Offsets('espectro',2).join(',')==='0,-3';
const before=draws;for(let i=0;i<100;i++)guardian72Frames('dragon',{level:3});res.cached=draws===before;
return res;`;
const res=new Function(mod+harness)();for(const [k,v] of Object.entries(res))assert.equal(v,true,k);
assert.ok(assets.includes('installGuardian72(guardianSheet)')&&assets.includes('guardian72Enabled()?loadArtImage'),'optional load');
assert.ok(render.includes('guardian72Frames(name,o)||')&&render.includes('guardianLevel:guardian72Level(u)'),'render fallback');
assert.ok(html.indexOf('engine/guardian-art-v72.js')<html.indexOf('engine/assets.js'),'load order');
console.log(res);
