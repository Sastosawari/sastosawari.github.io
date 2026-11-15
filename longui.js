/* Intercity tab: 280 official long-distance routes, petrol/diesel or electric */
(function(){
var D=window.LONG,FC=window.FareCalc,$=function(i){return document.getElementById(i)};
if(!D)return;
var mode='ice',limit=8;
function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML}
function rup(n){return 'Rs '+n.toLocaleString('en-IN')}
function norm(s){return String(s).toLowerCase().replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim()}
var ALIAS={sarlahi:['malangwa','barhathawa'],lalbandi:['malangwa','barhathawa'],hariwan:['malangwa'],ishworpur:['malangwa'],
  rautahat:['gaur'],bara:['kalaiya'],parsa:['birgunj'],chitwan:['narayangadh'],bharatpur:['narayangadh'],lalitpur:['kathmandu'],kaski:['pokhara'],
  rupandehi:['butwal','bhairahawa'],banke:['nepalgunj'],kailali:['dhangadhi'],kanchanpur:['mahendranagar'],morang:['biratnagar'],sunsari:['itahari','dharan'],jhapa:['kakarbhitta','damak']};
var SPELL={birganj:'birgunj',nepalganj:'nepalgunj',kakarvitta:'kakarbhitta',kakarbitta:'kakarbhitta',kakadbhitta:'kakarbhitta',janakapur:'janakpur',bhairahwa:'bhairahawa',nepalgani:'nepalgunj',dharan:'dharan'};
function expand(q){if(SPELL[q])q=SPELL[q];return (ALIAS[q]&&!NAMESET[q])?ALIAS[q]:[q]}
var names={},NAMESET={};
D.routes.forEach(function(r){[r.from,r.to].forEach(function(n){var b=n.replace(/ \(.*\)$/,'').replace(/ via .*$/,'').trim();names[b]=1;NAMESET[b.toLowerCase()]=1})});
var nameList=Object.keys(names).sort();
Dropdown.suggest($('lfrom'),function(){return nameList});Dropdown.suggest($('lto'),function(){return nameList});
function fares(r){if(mode==='ev')return r.ev||null;return {normal:r.normal,deluxe:r.deluxe,super:r.super}}
function has(h,q){return expand(q).some(function(x){return h.indexOf(x)>-1})}

function search(){
  var f=norm($('lfrom').value),t=norm($('lto').value),o=$('lout');
  if(f.length<2&&t.length<2){o.innerHTML='<p class="fine">Start typing a place. Spellings follow the department list, for example Kakarbhitta, Birgunj, Nepalgunj.</p>';return}
  if(f.length<2)f='';if(t.length<2)t='';
  var res=D.routes.filter(function(r){
    var h=norm(r.from+' '+r.to+' '+r.via+' '+r.kw);
    if(f&&t)return has(h,f)&&has(h,t);
    return has(h,f||t);
  });
  function direct(r){
    var a=norm(r.from),b=norm(r.to);
    if(f&&t)return ((has(a,f)&&has(b,t))||(has(a,t)&&has(b,f)))?0:1;
    var q=f||t;return (has(a,q)||has(b,q))?0:1;
  }
  res.sort(function(x,y){return direct(x)-direct(y)||x.km-y.km});
  var hint='';
  [f,t].forEach(function(q){if(q&&ALIAS[q]&&!NAMESET[q])hint+='<p class="msg">"'+esc(q)+'" is not a stop in the department list. These routes go to the nearest listed town(s): '+ALIAS[q].map(function(x){return esc(x.charAt(0).toUpperCase()+x.slice(1))}).join(', ')+'. A bus to your exact town may be priced differently; ask the department if it matters.</p>'});
  if(!res.length){o.innerHTML=hint+'<p class="msg">No route found. Try a nearby bigger town, or a shorter spelling. The full list is on the <a href="'+D.meta.url+'">department page</a>.</p>';return}
  var shown=res.slice(0,limit),h=hint,d=FC.Disc;
  shown.forEach(function(r){
    var q=fares(r),isVia=direct(r)===1;
    h+='<article class="lr"><div class="lr-main"><div class="lr-t"><b>'+esc(r.from)+' to '+esc(r.to)+'</b><span>'+r.km+' km'+(r.via?' · via '+esc(r.via):'')+'</span></div>';
    if(!q){h+='<div class="lr-f"><span class="none">No electric fare listed</span></div></div></article>';return}
    h+='<div class="lr-f"><b>'+rup(q.normal)+'</b><span>normal</span></div></div>'
     +'<div class="lr-sub">Deluxe '+rup(q.deluxe)+' · Super deluxe '+rup(q.super)+(d.pct?' · '+esc(FC.label())+': normal '+rup(FC.apply(q.normal)):'')+'</div>'
     +(isVia?'<div class="lr-via">This stop is on the way. The fare shown is for the full route, not for your stop.</div>':'')
     +'<button class="mini" data-id="'+r.id+'">Show this to the conductor</button></article>';
  });
  if(res.length>shown.length)h+='<button class="cta ghost" id="more">Show more routes ('+(res.length-shown.length)+' left)</button>';
  h+='<p class="fine">Deluxe and super deluxe apply only to vehicles the department has certified for that class. Otherwise the normal fare is the limit.'+(mode==='ev'?' Electric fares are lower than the petrol and diesel list.':'')+'</p>';
  o.innerHTML=h;
  [].forEach.call(o.querySelectorAll('.mini'),function(b){b.addEventListener('click',function(){proof(+b.getAttribute('data-id'))})});
  var m=$('more');if(m)m.addEventListener('click',function(){limit+=12;search()});
}
function proof(id){
  var r=D.routes.filter(function(x){return x.id===id})[0],q=fares(r);if(!q)return;
  var cite=mode==='ev'?FC.cite.ev:FC.cite.long,d=FC.Disc;
  window.Proof.open({fare:rup(q.normal),what:r.from+' to '+r.to+' · '+r.km+' km · normal class, '+(mode==='ev'?'electric':'petrol or diesel')+' public vehicle. Deluxe '+rup(q.deluxe)+', super deluxe '+rup(q.super)+' only for certified vehicles.',
    disc:d.pct?FC.label()+': normal Rs '+FC.apply(q.normal):'',cite:cite,foot:'Route '+(r.via?'via '+r.via+'. ':'')+'The department lists this as route no. '+r.id+'.'});
}
function setMode(m){
  mode=m;limit=8;
  $('mode-ice').setAttribute('aria-checked',m==='ice');$('mode-ev').setAttribute('aria-checked',m==='ev');
  src();search();
}
function src(){
  var c=mode==='ev'?FC.cite.ev:FC.cite.long;
  $('lsrc').innerHTML='Source: <a href="'+c.url+'">'+esc(c.authority)+'</a>, '+esc(c.title)+', '+esc(c.dated)+'. '+(mode==='ev'?'The table is dated 2081-09-22 BS, so check the department for later changes. ':'Fares change when fuel prices change, so check the department page for the latest. ')+'Place names are spelled in English for search and may differ slightly from the department list.';
}
$('mode-ice').addEventListener('click',function(){setMode('ice')});
$('mode-ev').addEventListener('click',function(){setMode('ev')});
$('lfrom').addEventListener('input',function(){limit=8;search()});$('lto').addEventListener('input',function(){limit=8;search()});
function tip(){
  var t=$('booktip'),k=FC.Disc.key;
  if(k==='student'){t.hidden=false;t.innerHTML='<b>Ask when you book.</b> Tell the counter you are a student when you buy the ticket and show your original school or college ID. The department says the student concession (reported as 45%) cannot be limited to certain routes, quotas, days or times.'}
  else if(k==='senior'){t.hidden=false;t.innerHTML='<b>Ask when you book.</b> Say you are a senior citizen when you buy the ticket, show your ID, and ask for one of the two reserved seats, because the reported 50% is tied to those seats. If it is refused, see the Overcharged? tab.'}
  else{t.hidden=true;t.innerHTML=''}
}
document.addEventListener('discchange',function(){search();tip()});
tip();
src();search();
})();
