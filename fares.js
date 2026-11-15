/* Fare formulas, discount state, citations. One source of truth for every number on the page. */
(function(){
var R=window.FARES.rates, C=R.cite;
function r(n){return Math.round(n)}
function rs(n){return 'Rs '+Math.round(n).toLocaleString('en-IN')}

/* ---------- discount (reported rule, never shown as the official fare) ---------- */
var Disc={pct:0,key:'adult'};
try{var s=localStorage.getItem('ss_disc');if(s==='student'){Disc.pct=45;Disc.key='student'}else if(s==='senior'){Disc.pct=50;Disc.key='senior'}}catch(e){}
function dApply(n){return Disc.pct?Math.round(n*(1-Disc.pct/100)):n}
function dLabel(){return Disc.key==='student'?'Student, reported 45% off':Disc.key==='senior'?'Senior citizen, reported 50% off':''}
function edgeText(e,prefix){
  if(!e)return '';
  if(e.soft)return 'Pokhara city bus fares rise Rs '+(window.FARES.rates.pkr.city_bus.perkm)+' for each extra km, so a small difference in measured distance can change the fare by up to Rs '+(e.hi-e.lo)+'.';
  return (prefix||'Close to a price step')+': Rs '+e.lo+' up to '+e.edge+' km, Rs '+e.hi+' beyond. The conductor may measure a little differently.';
}
function discNote(){
  return Disc.key==='student'?'Reported rule (45%). The notice states no rate. Show your original student ID.':Disc.key==='senior'?'Reported rule (50%). The Act ties it to the two reserved seats. Show your ID.':'';
}
function setDisc(k){
  Disc.key=k;Disc.pct=k==='student'?45:k==='senior'?50:0;
  try{localStorage.setItem('ss_disc',k)}catch(e){}
  document.dispatchEvent(new Event('discchange'));
}

/* ---------- Kathmandu Valley (Bagmati gazette) ---------- */
var KB=R.bus; // [[5,24],[10,33],[15,39],[20,44],[null,50]]
function ktmBus(km){for(var i=0;i<KB.length;i++){if(KB[i][0]===null||km<=KB[i][0])return KB[i][1]}}
function ktmBand(km){var prev=0;for(var i=0;i<KB.length;i++){if(KB[i][0]===null)return 'over '+prev+' km';if(km<=KB[i][0])return prev?('over '+prev+', up to '+KB[i][0]+' km'):('up to '+KB[i][0]+' km');prev=KB[i][0]}}
function ktmEdge(km){ // within 0.7 km of a band edge: the conductor's distance may differ
  for(var i=0;i<KB.length-1;i++){var e=KB[i][0];if(Math.abs(km-e)<=0.7){return {edge:e,lo:KB[i][1],hi:KB[i+1][1]}}}
  return null;
}
function ktmTaxi(km,night){var t=R.taxi;return r(t.flag+(night?t.night_per200m:t.per200m)*(km/0.2))}

/* ---------- Pokhara (Gandaki notice) ---------- */
function pkrBus(km){var c=R.pkr.city_bus;return r(km<=c.minkm?c.min:c.min+c.perkm*(km-c.minkm))}
function pkrTaxi(km,night){
  var t=R.pkr.taxi,first=Math.min(km,15),p=night?t.night_per200m:t.per200m,f=t.flag+p*(first/0.2);
  if(km>15)f+=t.beyond15km*(km-15);
  return r(f);
}

/* ---------- cities ---------- */
var CITY={
  ktm:{name:'Kathmandu Valley',cite:C.ktm,box:{s:27.57,n:27.80,w:85.20,e:85.50},
    bus:ktmBus,band:ktmBand,edge:ktmEdge,taxi:ktmTaxi,
    rule:'Up to 5 km Rs 24, up to 10 km Rs 33, up to 15 km Rs 39, up to 20 km Rs 44, over 20 km Rs 50.',
    taxiRule:'Taxi: Rs '+R.taxi.flag+' start plus Rs '+R.taxi.per200m+' per 200 m by day, Rs '+R.taxi.night_per200m+' per 200 m from 9 PM to 4 AM, plus waiting.'},
  pkr:{name:'Pokhara',cite:C.pkr,box:{s:28.12,n:28.34,w:83.86,e:84.10},
    bus:pkrBus,band:function(km){return km<=R.pkr.city_bus.minkm?'first '+R.pkr.city_bus.minkm+' km':'Rs '+R.pkr.city_bus.min+' plus Rs '+R.pkr.city_bus.perkm+' per km after '+R.pkr.city_bus.minkm+' km'},
    edge:function(km){var a=pkrBus(km),b=pkrBus(km+1);return b>a?{soft:true,lo:a,hi:b,edge:km}:null},taxi:pkrTaxi,
    rule:'City bus Rs '+R.pkr.city_bus.min+' for the first '+R.pkr.city_bus.minkm+' km, then Rs '+R.pkr.city_bus.perkm+' per km.',
    taxiRule:'Taxi: Rs '+R.pkr.taxi.flag+' start plus Rs '+R.pkr.taxi.per200m+' per 200 m by day, Rs '+R.pkr.taxi.night_per200m+' per 200 m from 9 PM to 4 AM, Rs '+R.pkr.taxi.beyond15km+' per km beyond 15 km, plus waiting. Airport taxis: Rs '+R.pkr.airport_taxi.per200m+' per 200 m.'}
};
function region(p){for(var k in CITY){var b=CITY[k].box;if(p.lat>=b.s&&p.lat<=b.n&&p.lon>=b.w&&p.lon<=b.e)return k}return null}
function local(city,km){
  var c=CITY[city];km=Math.round(km*10)/10;
  return {city:city,name:c.name,km:km,bus:c.bus(km),band:c.band(km),edge:c.edge(km),taxiDay:c.taxi(km,false),taxiNight:c.taxi(km,true),cite:c.cite,rule:c.rule,taxiRule:c.taxiRule};
}

window.FareCalc={edgeText:edgeText,discNote:discNote,Disc:Disc,setDisc:setDisc,apply:dApply,label:dLabel,rs:rs,CITY:CITY,region:region,local:local,
  ktmBus:ktmBus,pkrBus:pkrBus,cite:C};
})();
