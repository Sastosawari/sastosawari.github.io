/* Overcharged? section: trip -> official fare -> verdict -> report */
(function(){
var $=function(i){return document.getElementById(i)},FC=window.FareCalc,G=window.Geo;
var HS='https://gunaso.opmcm.gov.np/admin/Complain-Files/119/Complaints%20asked%20for%20transportation/';
var st={token:0,busy:false,a:null,b:null,ca:[],cb:[],km:null,paid:null,routeText:''};
var last=null;
function esc(t){var d=document.createElement('div');d.textContent=t;return d.innerHTML}
function rup(n){return 'Rs '+Math.round(n).toLocaleString('en-IN')}
function stamp(kind,big,small){return '<div class="stamp '+kind+'" role="status"><b>'+big+'</b><span>'+small+'</span></div>'}
function setBusy(b){st.busy=b;var x=$('buscheck');x.disabled=b;x.textContent=b?'Measuring the route...':'Check my bus fare'}
function city(){return st.city||$('ocity').value}
function stops(){return G.STOPS[city()]||[]}

function run(){
  if(st.busy)return;
  var paid=parseFloat($('buspaid').value),o=$('busverdict'),f=$('ofrom').value.trim(),t=$('oto').value.trim(),kmIn=parseFloat($('buskm').value);
  if(!(paid>0)){o.innerHTML='<p class="msg">Enter what the conductor asked.</p>';return}
  st.paid=paid;st.city=$('ocity').value;
  if(f&&t){
    var my=++st.token;setBusy(true);o.innerHTML='<p class="msg">Finding the places...</p>';
    G.geocode(f,city()).then(function(ca){
      return G.delay(1100).then(function(){return G.geocode(t,city())}).then(function(cb){
        if(my!==st.token)return;
        st.ca=ca;st.cb=cb;st.a=ca[0];st.b=cb[0];
        return G.route(st.a,st.b).then(function(km){if(my!==st.token)return;st.km=km;verdict()});
      });
    }).catch(function(e){
      var m=String(e.message||e);
      if(kmIn>0){st.a=st.b=null;st.ca=st.cb=[];st.km=kmIn;verdict();return}
      o.innerHTML='<p class="msg">'+(m.indexOf('none:')===0?'We could not find "'+esc(m.slice(5))+'". Try a stop from the suggestions, or open "I already know the distance".':'The free map service did not answer. Try again in a minute, or open "I already know the distance".')+'</p>';
    }).then(function(){setBusy(false)});
    return;
  }
  if(kmIn>0){st.a=st.b=null;st.ca=st.cb=[];st.km=kmIn;verdict();return}
  o.innerHTML='<p class="msg">Type where you started and where you went, or open "I already know the distance".</p>';
}

function pickers(){
  if(!st.a||(st.ca.length<2&&st.cb.length<2))return st.a?'<div class="places"><p class="fine">Places found: <b>'+esc(st.a.name)+'</b> to <b>'+esc(st.b.name)+'</b></p></div>':'';
  function sel(id,label,list,cur){
    if(list.length<2)return '<div class="pp"><span>'+label+'</span><b>'+esc(list[0].name)+'</b></div>';
    var h='<label class="pp" for="'+id+'"><span>'+label+'</span><select id="'+id+'">';
    list.forEach(function(x,i){h+='<option value="'+i+'"'+(x===cur?' selected':'')+'>'+esc(x.name)+'</option>'});
    return h+'</select></label>';
  }
  return '<div class="places"><p class="fine">The places we found. Not right? Pick another.</p>'+sel('opa','From',st.ca,st.a)+sel('opb','To',st.cb,st.b)+'</div>';
}

function verdict(){
  var o=$('busverdict'),km=st.km,paid=st.paid;
  if(km>60){o.innerHTML='<p class="msg">That is over 60 km. City bus fares are for trips inside the city. For long distances use the Intercity section.</p>';last=null;return}
  var L=FC.local(city(),km),full=L.bus,disc=FC.Disc.pct?FC.apply(full):null,h;
  st.routeText=st.a?(st.a.name.split(',')[0]+' to '+st.b.name.split(',')[0]):'';
  last={km:L.km,paid:paid,L:L,route:st.routeText};
  var edge=L.edge?'<p class="fine">'+esc(FC.edgeText(L.edge))+'</p>':'';
  var ok=paid<=full;
  if(L.edge&&paid<=L.edge.hi&&paid>full)ok=null;
  var bad=false;
  if(ok===true){
    if(disc!==null&&paid>disc)h=stamp('ok','FINE','The full official fare is '+rup(full)+'. '+esc(FC.label())+' would be '+rup(disc)+', so you may ask for it.');
    else h=stamp('ok','FINE','The official fare for '+L.km+' km is '+rup(full)+'. You were asked '+rup(paid)+'.');
  }else if(ok===null){
    h=stamp('maybe','CHECK',L.edge.soft?'You are '+rup(Math.round(paid-full))+' over the measured fare, within what a small difference in distance can change. Ask how far they measured.':'The fare is '+rup(L.edge.lo)+' or '+rup(L.edge.hi)+' depending on how far the conductor measures.');
  }else{
    bad=true;
    h=stamp('bad','TOO HIGH',rup(Math.round(paid-full))+' over. The official fare for '+L.km+' km is '+rup(full)+'; you were asked '+rup(paid)+'.');
  }
  var complain=bad?'<a class="cta gold" href="'+HS+'" target="_blank" rel="noopener"><span>File an official complaint</span><small>Hello Sarkar, the government complaint portal</small></a>':'';
  o.innerHTML=h+complain+'<button class="cta show" id="proof2">Show this to the conductor</button>'+edge
   +'<p class="fine">Source: <a href="'+L.cite.url+'">'+esc(L.cite.authority)+'</a>, '+esc(L.cite.dated)+'. '+esc(L.rule)+' Electric buses may charge less.</p>'+pickers();
  $('proof2').addEventListener('click',function(){
    window.Proof.open({fare:rup(full),what:L.name+' · '+L.km+' km · '+L.band+' · petrol or diesel public bus',
      disc:FC.Disc.pct?FC.label()+': '+rup(disc):'',edge:FC.edgeText(L.edge),discNote:FC.discNote(),cite:L.cite,foot:'The rider was asked '+rup(paid)+'.'+(st.routeText?' Trip: '+st.routeText+'.':'')+(st.a?' Distance estimated from OpenStreetMap routing; the conductor\'s figure may differ.':' Distance entered by the rider.')});
  });
  var pa=$('opa'),pb=$('opb');
  if(pa){Dropdown.enhance(pa);pa.addEventListener('change',function(){st.a=st.ca[+pa.value];recompute()})}
  if(pb){Dropdown.enhance(pb);pb.addEventListener('change',function(){st.b=st.cb[+pb.value];recompute()})}
}
function recompute(){
  var my=++st.token;setBusy(true);
  G.route(st.a,st.b).then(function(km){if(my!==st.token)return;st.km=km;verdict()}).catch(function(){$('busverdict').innerHTML='<p class="msg">The free map service did not answer. Try again.</p>'}).then(function(){setBusy(false)});
}

/* ---------- complaint text ---------- */
function makeNote(){
  var t=$('cnote'),d=new Date(),when=d.toLocaleString('en-GB',{dateStyle:'short',timeStyle:'short'});
  if(!last){t.value='Overcharge report, public bus.\nDate and time: '+when+'\nRoute: ____________  Distance: ____ km\nFare asked: Rs ____  Official fare: Rs ____\nVehicle number plate: ____________\nPlease take action.';links();return}
  var L=last.L;
  t.value='Overcharge report, public bus, '+L.name+'.\n'
   +'Date and time: '+when+'\n'
   +'Route: '+(last.route||'____________')+'  Distance: '+last.km+' km\n'
   +'Fare asked: Rs '+last.paid+'  Official fare: Rs '+L.bus+' ('+L.cite.authority+', notice dated '+L.cite.dated+')\n'
   +(FC.Disc.pct?'Passenger category: '+FC.label()+'.\n':'')
   +'Vehicle number plate: ____________\nPlease take action.';
  links();
}
function links(){
  var t=$('cnote').value;if(!t.trim())t='Overcharge report: public transport fare above the official rate. Details to follow.';
  $('sendwa').href='https://wa.me/9779851145045?text='+encodeURIComponent(t);
  $('sendml').href='mailto:1111@nepal.gov.np?subject='+encodeURIComponent('Overcharge on public transport fare')+'&body='+encodeURIComponent(t);
}

Dropdown.suggest($('ofrom'),stops);Dropdown.suggest($('oto'),stops);
$('buscheck').addEventListener('click',run);
['ofrom','oto','buspaid','buskm'].forEach(function(i){$(i).addEventListener('keydown',function(e){if(e.key==='Enter')run()})});
$('ocity').addEventListener('change',function(){st.token++;setBusy(false);st.a=st.b=null;st.ca=st.cb=[];st.km=null;last=null;$('busverdict').innerHTML=''});
$('cmake').addEventListener('click',makeNote);
$('cnote').addEventListener('input',links);
$('ccopy').addEventListener('click',function(){
  var t=$('cnote'),b=$('ccopy');if(!t.value.trim())makeNote();
  function done(ok){b.textContent=ok?'Copied':'Select and copy';setTimeout(function(){b.textContent='Copy'},1800)}
  t.select();
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t.value).then(function(){done(true)},function(){done(false)})}
  else{var ok=false;try{ok=document.execCommand('copy')}catch(e){}done(ok)}
});
document.addEventListener('discchange',function(){if(last&&$('busverdict').innerHTML&&st.km!=null&&!st.busy)verdict()});
links();
})();
