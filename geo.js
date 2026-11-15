/* Shared place search and road distance (free OpenStreetMap services) */
(function(){
var NOM='https://nominatim.openstreetmap.org/search?format=jsonv2&accept-language=en&limit=5&countrycodes=np&q=';
var OSRM='https://router.project-osrm.org/route/v1/driving/';
var STOPS={
  ktm:["Thamel", "Ratna Park", "Kalanki", "Koteshwor", "New Baneshwor", "Chabahil", "Tinkune", "Gongabu", "Naya Bus Park", "Old Bus Park", "Balkhu", "Kalimati", "Maharajgunj", "Boudha", "Jorpati", "Lagankhel", "Patan Dhoka", "Jawalakhel", "Pulchowk", "Satdobato", "Gwarko", "Imadol", "Balkumari", "Bhaktapur", "Suryabinayak", "Thimi", "Lokanthali", "Kaushaltar", "Gatthaghar", "Tribhuvan Airport", "Old Baneshwor", "Gaushala", "Sundhara", "New Road", "Putalisadak", "Kamalpokhari", "Kamaladi", "Lazimpat", "Chakrapath", "Basundhara", "Samakhusi", "Balaju", "Banasthali", "Swayambhu", "Sitapaila", "Kuleshwar", "Teku", "Tripureshwor", "Thapathali", "Maitighar", "Anamnagar", "Sinamangal", "Gokarneshwar", "Budhanilkantha", "Tokha", "Kapan", "Dhapasi", "Dillibazar", "Bagbazar", "Bhotahity", "Asan", "Indrachowk", "Naxal", "Baluwatar", "Bishalnagar", "Hattisar", "Lainchaur", "Battisputali", "Dallu", "Chhauni", "Kirtipur", "Naikap", "Thankot", "Satungal", "Machhegaun", "Dakshinkali", "Pharping", "Sankhu", "Gothatar", "Sukedhara", "Bansbari", "Ranibari", "Jamal", "Sorhakhutte", "Tinthana", "Sundarijal", "Mulpani", "Narayan Gopal Chowk", "Pashupati", "Gaurighat", "Chuchepati", "Jhamsikhel", "Dhumbarahi", "Mandikhatar", "Golfutar", "Nayabazar", "Bhimsengola", "Kalopul", "Sifal", "Bijulibazar", "Shantinagar", "Tahachal", "Hadigaun", "Pepsicola", "Bhaisepati", "Kupondole", "Ekantakuna", "Mangalbazar", "Patan Durbar Square", "Sanepa", "Harisiddhi", "Godawari", "Chapagaun", "Thecho", "Lubhu", "Khokana", "Bungamati", "Nakkhu", "Tikathali", "Dhapakhel", "Kusunti", "Nakhipot", "Tikabhairab", "Lalitpur", "Dhobighat", "Nagdhunga", "Hattiban", "Gundu", "Sunakothi", "Gabahal", "Dobhan", "Manbhawan", "Lamatar", "Bhaktapur Durbar Square", "Madhyapur Thimi", "Katunje", "Sallaghari", "Duwakot", "Sipadol", "Changunarayan", "Nagarkot", "Sudal", "Jagati", "Balkot", "Bode", "Dadhikot", "Sanga", "Kamalbinayak", "Chyamasingh", "Bhaktapur Bus Park", "Tathali", "Nagadesh", "Sirutar", "Bageshwori", "Liwali", "Mahadevsthan", "Arubari", "Bafal", "Bhadrakali", "Bhumisthali", "Chapali", "Chisapani", "Durbar Marg", "Gankhu", "Gokarna",  "Jadibuti", "Kharibot", "Khasi Bazar", "Kimdol", "Kurauni", "Lolang", "Mahalaxmisthan", "Maitidevi", "Muhan Pokhari", "Nagaon", "Padamsal", "Palase", "Pauwa", "Ramhiti", "Sundole", "Syuchatar", "Tilganga", "Tinchuli", "Tinpiple", "Thulo Bharyang", "Yerahiti", "Chardobato", "Hattigauda", "Tejbinayak", "Panga", "Machhapokhari", "Bhatbhateni", "Sano Bharyang", "Chandragiri", "Chobhar", "Taudaha"],
  pkr:['Lakeside','Damside','Chipledhunga','Prithvi Chowk','Mahendrapul','Bagar','Birauta','Srijana Chowk','Nadipur','Pokhara Airport','Bindyabasini','Zero Kilometre','Fulbari','Hemja','Lekhnath','Phewa','Batulechaur','Rastrabank Chowk','Nayabazar','Kahun','Simpani','Buspark']
};
var BOUND={ktm:[85.20,27.80,85.50,27.57],pkr:[83.86,28.34,84.10,28.12]};
function delay(ms){return new Promise(function(r){setTimeout(r,ms)})}

function geocode(q,city){
  var P=window.POINTS&&window.POINTS[Object.keys(window.POINTS).filter(function(k){return k.toLowerCase()===q.trim().toLowerCase()})[0]];
  if(P)return Promise.resolve([{lat:P[0],lon:P[1],name:q.trim()}]);
  var extra=BOUND[city]?'&viewbox='+BOUND[city].join(',')+'&bounded=1':'';
  var suffix=city==='ktm'?', Kathmandu':city==='pkr'?', Pokhara':', Nepal';
  return fetch(NOM+encodeURIComponent(q+suffix)+extra).then(function(r){if(!r.ok)throw new Error('geo');return r.json()}).then(function(l){
    if(!l.length&&BOUND[city]){ // retry without the city word
      return fetch(NOM+encodeURIComponent(q)+extra).then(function(r){return r.json()});
    }
    return l;
  }).then(function(l){
    if(!l.length)throw new Error('none:'+q);
    var seen={},out=[];
    l.forEach(function(x){var n=x.display_name.split(',').slice(0,3).join(',').trim();if(!seen[n]){seen[n]=1;out.push({lat:parseFloat(x.lat),lon:parseFloat(x.lon),name:n})}});
    return out;
  });
}
function route(a,b){
  return fetch(OSRM+a.lon+','+a.lat+';'+b.lon+','+b.lat+'?overview=false').then(function(r){if(!r.ok)throw new Error('route');return r.json()}).then(function(j){
    if(!j.routes||!j.routes.length)throw new Error('noroute');return j.routes[0].distance/1000;
  });
}

(function(){var P=window.POINTS||{};Object.keys(P).forEach(function(n){if(STOPS.ktm.indexOf(n)<0)STOPS.ktm.push(n)})})();
window.Geo={STOPS:STOPS,BOUND:BOUND,geocode:geocode,route:route,delay:delay};
})();
