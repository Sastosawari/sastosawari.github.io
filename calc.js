/* City bus tab: two places -> road distance (free OpenStreetMap services) -> official fare */
(function(){
var $=function(i){return document.getElementById(i)};
var FC=window.FareCalc;
var G=window.Geo,STOPS=G.STOPS,geocode=G.geocode,route=G.route,delay=G.delay;
var st={token:0,city:'ktm',a:null,b:null,ca:[],cb:[],km:null,busy:false};
function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML}
function stopsNow(){return STOPS[$('citysel').value]||[]}
function setBusy(b){st.busy=b;var btn=$('calc');btn.disabled=b;btn.textContent=b?'Measuring the route...':'Show the official fare'}

function go(){
  if(st.busy)return;
  var f=$('from').value.trim(),t=$('to').value.trim(),o=$('calcout'),man=parseFloat($('cmanual').value);
  if((!f||!t)&&man>0){st.city=$('citysel').value;st.a={name:'your trip',lat:0,lon:0};st.b={name:'(distance typed by you)',lat:0,lon:0};st.ca=[st.a];st.cb=[st.b];st.km=man;show();return}
  if(!f||!t){o.innerHTML='<p class="msg">Enter a start and a destination, or open "The map is not working? I know the distance".</p>';return}
  var my=++st.token;st.city=$('citysel').value;setBusy(true);
  o.innerHTML='<p class="msg">Finding the places...</p>';
  geocode(f,st.city).then(function(ca){
    return delay(1100).then(function(){return geocode(t,st.city)}).then(function(cb){
      if(my!==st.token)return;
      st.ca=ca;st.cb=cb;st.a=ca[0];st.b=cb[0];
      return route(st.a,st.b).then(function(km){if(my!==st.token)return;st.km=km;show()});
    });
  }).catch(function(e){
    var m=String(e.message||e);
    o.innerHTML='<p class="msg">'+(m.indexOf('none:')===0?'We could not find "'+esc(m.slice(5))+'". Try a well-known stop or area name from the suggestions, or choose "Somewhere else in Nepal".':'The free map service did not answer. Please try again in a minute, or use the Overcharged? tab and type the distance yourself.')+'</p>';
  }).then(function(){setBusy(false)});
}

function placePick(){
  function sel(id,label,list,cur){
    if(list.length<2)return '<div class="pp"><span>'+label+'</span><b>'+esc(list[0].name)+'</b></div>';
    var h='<label class="pp" for="'+id+'"><span>'+label+'</span><select id="'+id+'">';
    list.forEach(function(x,i){h+='<option value="'+i+'"'+(x===cur?' selected':'')+'>'+esc(x.name)+'</option>'});
    return h+'</select></label>';
  }
  return '<div class="places"><p class="fine">The places we found. Not right? Pick another.</p>'+sel('pa','From',st.ca,st.a)+sel('pb','To',st.cb,st.b)+'</div>';
}
function recompute(){
  var my=++st.token;setBusy(true);
  route(st.a,st.b).then(function(km){if(my!==st.token)return;st.km=km;show()}).catch(function(){$('calcout').innerHTML='<p class="msg">The free map service did not answer. Try again.</p>'}).then(function(){setBusy(false)});
}

function show(){
  var o=$('calcout'),a=st.a,b=st.b,km=st.km;
  if(km<0.1){o.innerHTML='<p class="msg">These look like the same place. Choose two different places.</p>'+placePick();wire();return}
  var ra=st.city!=='any'?st.city:FC.region(a),rb=st.city!=='any'?st.city:FC.region(b);
  var k=Math.round(km*10)/10;
  var picker=placePick();
  if(!ra||ra!==rb){
    o.innerHTML='<div class="ticket"><p class="t-dist"><b>'+k+'</b> km by road</p></div><p class="msg">'+(ra&&rb?'These two places are in different cities, so a local fare does not apply. Use the Intercity tab for long-distance buses.':'We have official local bus and taxi rates for Kathmandu Valley and Pokhara only. Choose the city above, or use the Intercity tab for long-distance buses.')+'</p>'+picker;
    wire();return;
  }
  var L=FC.local(ra,k),d=FC.Disc;
  var edge=FC.edgeText(L.edge);
  var h='<div class="ticket" id="ticket">'
   +'<div class="t-row"><span class="t-lab">Official bus fare</span><span class="t-city">'+esc(L.name)+'</span></div>'
   +'<p class="t-fare"><small>Rs</small><span class="dg" data-ghost="'+'8'.repeat(Math.max(2,String(L.bus).length))+'">'+L.bus+'</span></p>'
   +'<p class="t-sub">'+k+' km by road · '+esc(L.band)+'</p>'
   +(edge?'<p class="t-edge">'+esc(edge)+'</p>':'')
   +(d.pct?'<p class="t-disc"><b>'+esc(FC.label())+': Rs '+FC.apply(L.bus)+'</b><span>'+esc(FC.discNote())+' Official full fare: Rs '+L.bus+'.</span></p>':'')
   +'<button class="cta show" id="showproof">Show this to the conductor</button>'
   +'<div class="t-tear" aria-hidden="true"></div>'
   +'<div class="t-taxi"><span>Taxi meter estimate</span><b>about Rs '+L.taxiDay+'</b><span>day</span><b>about Rs '+L.taxiNight+'</b><span>9 PM to 4 AM</span></div>'
   +'</div>'
   +'<p class="fine">'+esc(L.rule)+' '+esc(L.taxiRule)+' Electric buses and taxis keep older, often lower fares. Taxi figures are estimates; a real meter counts the route driven and waiting time. Source: <a href="'+L.cite.url+'">'+esc(L.cite.authority)+'</a>, '+esc(L.cite.dated)+'.</p>'
   +picker;
  o.innerHTML=h;
  $('showproof').addEventListener('click',function(){
    FC.local&&window.Proof.open({fare:'Rs '+L.bus,what:L.name+' · '+k+' km · '+L.band+' · petrol or diesel public bus',
      disc:d.pct?FC.label()+': Rs '+FC.apply(L.bus):'',discNote:FC.discNote(),edge:edge,cite:L.cite,foot:'Distance estimated from OpenStreetMap routing between "'+a.name+'" and "'+b.name+'"; the conductor\'s figure may differ.'});
  });
  wire();
}
function wire(){
  Dropdown.enhance($('pa'));Dropdown.enhance($('pb'));
  var pa=$('pa'),pb=$('pb');
  if(pa)pa.addEventListener('change',function(){st.a=st.ca[+pa.value];recompute()});
  if(pb)pb.addEventListener('change',function(){st.b=st.cb[+pb.value];recompute()});
}

Dropdown.suggest($('from'),stopsNow);Dropdown.suggest($('to'),stopsNow);
$('calc').addEventListener('click',go);
['from','to'].forEach(function(i){$(i).addEventListener('keydown',function(e){if(e.key==='Enter')go()})});
document.addEventListener('discchange',function(){if(st.km!=null&&!st.busy)show()});
})();
