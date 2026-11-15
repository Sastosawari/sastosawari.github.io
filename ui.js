/* Tabs (hash + keyboard), "who is riding" chips, sources sheet, service worker */
(function(){
var $=function(i){return document.getElementById(i)};
/* section navigation: tap a tab to jump, or just scroll; the active tab follows the page */
var tabs=[].slice.call(document.querySelectorAll('.tabs a'));
var secs=tabs.map(function(t){return document.getElementById(t.getAttribute('href').slice(1))});
var bar=document.querySelector('.bar');
function setHdr(){document.documentElement.style.setProperty('--hdr',(bar.offsetHeight+10)+'px')}
setHdr();window.addEventListener('resize',setHdr);
function paint(k){tabs.forEach(function(t){var on=t===k;if(on)t.setAttribute('aria-current','true');else t.removeAttribute('aria-current')})}
var ticking=false;
function spy(){
  ticking=false;
  var y=bar.offsetHeight+40,cur=0;
  secs.forEach(function(s,i){if(s.getBoundingClientRect().top<=y)cur=i});
  if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4)cur=secs.length-1;
  paint(tabs[cur]);
}
window.addEventListener('scroll',spy,{passive:true});
tabs.forEach(function(t,i){
  t.addEventListener('click',function(e){
    e.preventDefault();
    secs[i].scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    history.replaceState(null,'','#'+t.getAttribute('data-tab'));
    paint(t);
  });
});
(function(){var k=location.hash.slice(1),i=tabs.map(function(t){return t.getAttribute('data-tab')}).indexOf(k);
  if(i>0)setTimeout(function(){secs[i].scrollIntoView({block:'start'})},60);spy()})();

/* who is riding: one control, mounted above each action button */
var WHO='<div class="who" role="radiogroup" aria-label="Riding as"><span class="who-l">Riding as</span>'
 +'<button role="radio" aria-checked="true" data-who="adult">Adult</button>'
 +'<button role="radio" aria-checked="false" data-who="student">Student<small>45% off</small></button>'
 +'<button role="radio" aria-checked="false" data-who="senior">Senior<small>50% off</small></button></div>';
[].forEach.call(document.querySelectorAll('[data-who]'),function(m){m.innerHTML=WHO});
function paintWho(){var k=window.FareCalc.Disc.key;[].forEach.call(document.querySelectorAll('.who [role=radio]'),function(b){b.setAttribute('aria-checked',b.getAttribute('data-who')===k)})}
[].forEach.call(document.querySelectorAll('.who [role=radio]'),function(b){b.addEventListener('click',function(){window.FareCalc.setDisc(b.getAttribute('data-who'));paintWho()})});
paintWho();

/* segmented controls: arrow keys */
[].forEach.call(document.querySelectorAll('.seg,.who'),function(g){
  g.addEventListener('keydown',function(e){
    var items=[].slice.call(g.querySelectorAll('[role=radio]')),i=items.indexOf(document.activeElement);
    if(i<0)return;var j=null;
    if(e.key==='ArrowRight'||e.key==='ArrowDown')j=(i+1)%items.length;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')j=(i+items.length-1)%items.length;
    if(j!==null){e.preventDefault();items[j].focus();items[j].click()}
  });
});

Dropdown.enhanceAll(document);

/* sources sheet */
var sd=$('sources');
function openS(){if(sd.showModal)sd.showModal();else sd.setAttribute('open','');try{history.pushState({ssDialog:'sources'},'')}catch(e){}}
function closeS(){if(sd.open&&sd.close)sd.close();else sd.removeAttribute('open')}
sd.addEventListener('close',function(){if(history.state&&history.state.ssDialog==='sources'){try{history.back()}catch(e){}}});
window.addEventListener('popstate',function(){if(sd.open&&sd.close)sd.close()});
$('open-sources').addEventListener('click',openS);
$('srcx').addEventListener('click',closeS);$('srcx2').addEventListener('click',closeS);
sd.addEventListener('click',function(e){if(e.target===sd)closeS()});

/* offline shell */
if('serviceWorker' in navigator&&location.protocol!=='file:'){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}
})();
