/* Ride apps tab: Yango / Uber readings, Rs per km, and a check against them */
(function(){
var D=window.FARES,$=function(i){return document.getElementById(i)};
var APPS={yango:'Yango',uber:'Uber'};
function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML}
function rup(n){return 'Rs '+n.toLocaleString('en-IN')}
var rs=$('route');
Object.keys(D.routes).forEach(function(id){var o=document.createElement('option');o.value=id;o.textContent=D.routes[id].from+' to '+D.routes[id].to;rs.appendChild(o)});
function pick(rid,v){return D.readings.filter(function(r){return r.route===rid&&r.vehicle===v})}
function perkm(lo,hi){var k=D.routes[rs.value].km;if(!k)return '–';var x=Math.round(lo/k),y=Math.round(hi/k);return x===y?x:x+'–'+y}
function render(){
  var rows=pick(rs.value,$('veh').value),out=$('cmp'),by={};
  rows.forEach(function(r){(by[r.app]=by[r.app]||[]).push(r)});
  if(!rows.length){out.innerHTML='<p class="msg">No reading for this vehicle on this route yet.</p>';return}
  var apps=Object.keys(APPS),best=null,bestP=Infinity,present=apps.filter(function(a){return by[a]});
  apps.forEach(function(a){if(by[a]){var m=Math.min.apply(null,by[a].map(function(r){return r.price}));if(m<bestP){bestP=m;best=a}}});
  var h='<table><thead><tr><th>App</th><th>Seen</th><th>Rs/km</th><th>Read at</th></tr></thead><tbody>';
  apps.forEach(function(a){
    var l=by[a];
    if(!l){h+='<tr><td>'+APPS[a]+'</td><td colspan="3">Not available here</td></tr>';return}
    var lo=Math.min.apply(null,l.map(function(r){return r.price})),hi=Math.max.apply(null,l.map(function(r){return r.price}));
    h+='<tr><td>'+APPS[a]+(a===best&&present.length>1&&by[a].length>=3?' <span class="win">cheaper</span>':'')+'</td><td class="n">'+(lo===hi?rup(lo):rup(lo)+'–'+rup(hi))+'</td><td class="n">'+perkm(lo,hi)+'</td><td>'+esc(l.map(function(r){return r.time.slice(5)}).join(', '))+'</td></tr>';
  });
  var R=D.routes[rs.value],L=window.FareCalc.CITY[R.region];
  var y=R.km&&L?window.FareCalc.local(R.region,R.km):null;
  h+='</tbody></table><p class="fine">'+rows.length+' reading'+(rows.length>1?'s':'')+'. Uber at its standard price, before personal promotions. Times are Nepal time (month-day hour:minute). Route length about '+R.km+' km by road between the two area centres.</p>';
  if(y)h+='<table><thead><tr><th>Official yardstick</th><th>About</th></tr></thead><tbody><tr><td>City bus ('+esc(y.name)+')</td><td class="n">'+rup(y.bus)+'</td></tr><tr><td>Metered taxi, day (estimate)</td><td class="n">'+rup(y.taxiDay)+'</td></tr></tbody></table><p class="fine">Source: <a href="'+y.cite.url+'">'+esc(y.cite.authority)+'</a>, '+esc(y.cite.dated)+'. Electric vehicles may charge less.</p>';
  out.innerHTML=h;
}
function check(){
  var v=parseFloat($('paid').value),o=$('verdict');
  if(!(v>0)){o.innerHTML='<p class="msg">Enter the fare in Rs first.</p>';return}
  var rows=pick(rs.value,$('veh').value);
  if(!rows.length){o.innerHTML='<p class="msg">We have no reading for this route and vehicle yet.</p>';return}
  var p=rows.map(function(r){return r.price}),lo0=Math.min.apply(null,p),hi0=Math.max.apply(null,p),lo=Math.round(lo0*0.85),hi=Math.round(hi0*1.15),s;
  if(v<lo)s='<div class="stamp ok"><b>LOW</b><span>Well below what we saw ('+rup(lo0)+' to '+rup(hi0)+'). Good price.</span></div>';
  else if(v>hi)s='<div class="stamp bad"><b>HIGH</b><span>'+rup(Math.round(v-hi))+' above what we saw ('+rup(lo0)+' to '+rup(hi0)+', plus a 15% margin). Compare another app before you ride.</span></div>';
  else s='<div class="stamp ok"><b>IN RANGE</b><span>Close to what we saw ('+rup(lo0)+' to '+rup(hi0)+', with a 15% margin).</span></div>';
  o.innerHTML=s+'<p class="fine">Based on '+rows.length+' reading'+(rows.length>1?'s':'')+'. App prices change by the minute with time, traffic and weather.</p>';
}
rs.addEventListener('change',function(){render();$('verdict').innerHTML=''});
$('veh').addEventListener('change',function(){render();$('verdict').innerHTML=''});
$('check').addEventListener('click',check);
$('paid').addEventListener('keydown',function(e){if(e.key==='Enter')check()});
render();
})();
