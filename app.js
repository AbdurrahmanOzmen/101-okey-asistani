const colors=[{id:'red',name:'Kırmızı',hex:'#e34f57'},{id:'blue',name:'Mavi',hex:'#4184e8'},{id:'black',name:'Siyah',hex:'#687386'},{id:'yellow',name:'Sarı',hex:'#c58a09'}];
let tiles=[];let nextId=1;
const $=id=>document.getElementById(id);
function renderPicker(){ $('tilePicker').innerHTML=colors.map(c=>`<div class="color-group"><div class="color-title"><i class="dot" style="background:${c.hex}"></i>${c.name}</div><div class="nums">${Array.from({length:13},(_,i)=>`<button class="tile-add ${c.id}" data-color="${c.id}" data-value="${i+1}">${i+1}</button>`).join('')}</div></div>`).join('')+`<div class="color-group"><div class="color-title">✦ Özel taş</div><div class="nums"><button class="tile-add" data-color="joker" data-value="0">Okey</button><button class="tile-add" data-color="fake" data-value="0">Sahte</button></div></div>`; }
function addTile(color,value){if(tiles.length>=22){alert('En fazla 22 taş ekleyebilirsin.');return}tiles.push({id:nextId++,color,value:Number(value)});renderTiles()}
function renderTiles(){ $('tileCount').textContent=`${tiles.length} taş`; $('selectedTiles').innerHTML=tiles.length?tiles.map(t=>`<button class="tile-chip ${t.color==='joker'||t.color==='fake'?'black':t.color}" data-remove="${t.id}" title="Taşı kaldır">${t.color==='joker'?'★':t.color==='fake'?'S':t.value}<small>${t.color==='joker'?'OKEY':t.color==='fake'?'SAHTE':colors.find(c=>c.id===t.color).name.toUpperCase()}</small></button>`).join(''):'<div class="empty">Henüz taş eklemedin. Yukarıdan taş seçerek başlayalım.</div>'; $('calculateBtn').disabled=tiles.length<1;}
$('tilePicker').addEventListener('click',e=>{let b=e.target.closest('[data-color]');if(b)addTile(b.dataset.color,b.dataset.value)});
$('selectedTiles').addEventListener('click',e=>{let b=e.target.closest('[data-remove]');if(b){tiles=tiles.filter(t=>t.id!==Number(b.dataset.remove));renderTiles()}});
$('clearTiles').onclick=()=>{tiles=[];renderTiles();showEmpty()};
$('photoInput').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;$('preview').src=URL.createObjectURL(f);$('fileName').textContent=f.name;$('previewWrap').classList.remove('hidden');$('dropzone').classList.add('hidden')});
$('removePhoto').onclick=()=>{$('photoInput').value='';$('preview').src='';$('previewWrap').classList.add('hidden');$('dropzone').classList.remove('hidden')};
$('themeBtn').onclick=()=>{document.body.classList.toggle('dark');$('themeBtn').textContent=document.body.classList.contains('dark')?'☾':'☼';localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light')};
if(localStorage.getItem('theme')==='dark')document.body.classList.add('dark');
function showEmpty(){$('result').className='result-empty';$('result').innerHTML='<div class="result-icon">✦</div><b>Hesaplamaya hazırız</b><p>Taşlarını eklediğinde geçerli perleri bulup açılış toplamını hesaplayacağız.</p>'}
function groupsFor(hand){
 const normal=hand.filter(t=>t.color!=='joker'&&t.color!=='fake');
 const groups=[];
 const addGroup=ids=>{const g=ids.map(i=>normal[i]);groups.push({ids,score:g.reduce((s,t)=>s+t.value,0),tiles:g,mask:ids.reduce((m,i)=>m|(1<<i),0)});};
 // Aynı sayı, farklı renk: üçlü/dörtlü kombinasyonları.
 const byValue={};normal.forEach((t,i)=>(byValue[t.value]??=[]).push(i));
 for(const ids of Object.values(byValue)){
  for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++)for(let c=b+1;c<ids.length;c++){
   const trio=[ids[a],ids[b],ids[c]];if(new Set(trio.map(i=>normal[i].color)).size===3)addGroup(trio);
   for(let d=c+1;d<ids.length;d++){const four=[...trio,ids[d]];if(new Set(four.map(i=>normal[i].color)).size===4)addGroup(four)}
  }
 }
 // Aynı renkte ardışık seriler.
 for(const color of colors.map(c=>c.id)){
  const byNum={};normal.forEach((t,i)=>{if(t.color===color)byNum[t.value]=i});
  for(let first=1;first<=13;first++)for(let last=first+2;last<=13;last++){
   const ids=[];let ok=true;for(let v=first;v<=last;v++){if(byNum[v]===undefined){ok=false;break}ids.push(byNum[v])}if(ok)addGroup(ids);
  }
 }
 // Bitmask dynamic programming: her taşı en fazla bir perde kullan, toplamı en yükseğe çıkar.
 const n=normal.length, full=(1<<n)-1, byTile=Array.from({length:n},()=>[]);
 groups.forEach(g=>g.ids.forEach(i=>byTile[i].push(g)));
 const memo=new Map();
 function solve(used){if(used===full)return {score:0,chosen:[]};if(memo.has(used))return memo.get(used);
  let i=0;while(i<n&&(used&(1<<i)))i++;
  let best=solve(used|(1<<i));
  for(const g of byTile[i]){if((g.mask&used)!==0)continue;const sub=solve(used|g.mask);if(g.score+sub.score>best.score)best={score:g.score+sub.score,chosen:[g,...sub.chosen]}}
  memo.set(used,best);return best;
 }
 return solve(0);
}
$('calculateBtn').onclick=()=>{
 const hand=tiles.filter(t=>t.color!=='fake');
 const result=groupsFor(hand);
 const all=hand.reduce((s,t)=>s+(t.color==='joker'?0:t.value),0);
 const open=result.score>=101;
 $('result').className='result-card';
 $('result').innerHTML=`<div class="result-status">${open?'AÇILIŞ EŞİĞİ GEÇİLDİ':'AÇILIŞ EŞİĞİNE ULAŞILMADI'}</div><div class="big-score">${result.score}<small> / 101</small></div><b>${open?'Bu perlerle 101 açabilirsin.':'Şu an geçerli per toplamın 101’in altında.'}</b><p>Bulunan geçerli perlerin toplamı. Elindeki taşların tamamı değil, kurala uygun perler hesaba katılır.</p><div class="meld-list">${result.chosen.map(g=>`<div class="meld">${g.tiles.map(t=>`${t.color==='joker'?'★':t.value}`).join(' · ')} <b>= ${g.score}</b></div>`).join('')||'<span class="muted">Geçerli per bulunamadı.</span>'}</div><div class="warning">Bu ilk sürümde jokerli perler otomatik tamamlanmaz; fotoğraf da yalnızca önizleme olarak kullanılır. Sonucu oyundaki okey/gösterge ve masa kurallarına göre kontrol et.</div>`;
};
$('themeBtn').textContent=document.body.classList.contains('dark')?'☾':'☼';
renderPicker();renderTiles();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));