/* "Show this to the conductor": a full-screen, high-contrast proof view. Gov.np links only. */
(function(){
var dlg=document.getElementById('proof');
function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML}
var last=null;
function open(p){
  last=p;
  render(p);
  if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');
  try{history.pushState({ssDialog:'proof'},'')}catch(e){}
}
function render(p){
  var c=p.cite,h='';
  h+='<div class="pf-top"><span class="pf-np" lang="ne">सरकारी भाडा</span><span class="pf-en">Official fare</span><button class="pf-x" id="pfx" aria-label="Close">Close</button></div>';
  h+='<p class="pf-fare">'+esc(p.fare)+'</p>';
  h+='<p class="pf-what">'+esc(p.what)+'</p>';
  if(p.disc)h+='<p class="pf-disc"><b>'+esc(p.disc)+'</b><br><small>'+esc(p.discNote||'Reported rule, the notice does not state the rate.')+' The official fare above is the full fare.</small></p>';
  if(p.edge)h+='<p class="pf-edge">'+esc(p.edge)+'</p>';
  h+='<p class="pf-np2" lang="ne">यो सरकारले तोकेको भाडा हो। कृपया यसभन्दा बढी नलिनुहोस्। तलको सूचना हेर्नुहोस्। बढी भाडा लिएमा हेलो सरकार ११११ वा ट्राफिक प्रहरी १०३ मा उजुरी गर्न सकिन्छ।</p>';
  h+='<div class="pf-src"><b>'+esc(c.authority)+'</b><br>'+esc(c.title)+'<br>Dated '+esc(c.dated)+', '+esc(c.effective)+'.</div>';
  h+='<a class="pf-link" href="'+c.url+'" target="_blank" rel="noopener">Open the official notice</a>';
  if(c.pdf)h+='<a class="pf-link alt" href="'+c.pdf+'" target="_blank" rel="noopener">Open the notice PDF</a>';
  h+='<div class="pf-calls"><a href="tel:103">Call 103<small>Traffic police</small></a><a href="tel:1111">Call 1111<small>Hello Sarkar</small></a></div>';
  h+='<p class="pf-foot">'+(p.foot?esc(p.foot)+' ':'')+'यो सार्वजनिक सूचना हो, कानूनी फैसला होइन। This page shows a public notice. It is not a legal ruling. Checked '+esc(window.FARES.meta_checked||'15 Nov 2026')+'. Electric buses and taxis may charge less.</p>';
  dlg.innerHTML=h;
  document.getElementById('pfx').addEventListener('click',function(){close()});
}
function close(){if(dlg.open&&dlg.close)dlg.close();else dlg.removeAttribute('open')}
dlg.addEventListener('close',function(){if(history.state&&history.state.ssDialog==='proof'){try{history.back()}catch(e){}}});
window.addEventListener('popstate',function(){if(dlg.open&&dlg.close)dlg.close()});
dlg.addEventListener('click',function(e){if(e.target===dlg)close()});
window.Proof={open:open,close:close,last:function(){return last}};
})();
