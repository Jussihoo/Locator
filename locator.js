var socket = io("http://localhost:8060"); 
socket.on('PushLocation', function (data) {
  console.log("got data from socket");

  var allData = JSON.parse(data);
  console.log("data: ", data);

  var tempData = []; // init

  if (allData.source === "targetman") {
          tempData.name = allData.name;
          tempData.lat = allData.LAT;
          tempData.lon = allData.LON;
          console.log("TargetMan: ", tempData);
  } else if (allData.source === "dog") {
          tempData.lat = allData.LAT;
          tempData.lon = allData.LON;
          console.log("Dog: ", tempData);
  }
  updateLocation(tempData.lat, tempData.lon);
});

// init
var lat = 61.49505;
var lon = 23.61751667;


var myIcon = L.icon({
iconUrl: 'jussi_icon.png',
iconRetinaUrl: 'jussi_icon.png',
iconSize: [35, 35],
iconAnchor: [10, 35],
popupAnchor: [35, 35]});

function changeMap(mapType){
  if (mapType == "orto"){ 
    L.tileLayer('http://tiles.kartat.kapsi.fi/ortokuva/{z}/{x}/{y}.jpg').addTo(mymap);
  }
  else if (mapType == "terrain"){ 
    L.tileLayer('http://tiles.kartat.kapsi.fi/peruskartta/{z}/{x}/{y}.jpg').addTo(mymap);
  }
  else if (mapType == "google"){
    L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{ maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']}).addTo(mymap);
  }
  else if (mapType == "googleSatellite"){
    L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{ maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']}).addTo(mymap);
  }
  else if (mapType == "openstreet"){
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mymap);
  }
}

function updateLocation(lat, lon){
  var point = [lat,lon];
  mymap.removeLayer(marker);
  marker = L.marker([lat, lon],{icon: myIcon}).addTo(mymap) 
  polyline.addLatLng(point);
  
  mymap.setView([lat, lon]);
}


var mymap = L.map('mapid').setView([61.49305, 23.61711667], 16);
L.tileLayer('http://tiles.kartat.kapsi.fi/peruskartta/{z}/{x}/{y}.jpg').addTo(mymap);


var marker = new L.marker([61.49305, 23.61711667],{icon: myIcon});
mymap.addLayer(marker);
var polyline = L.polyline([], {color: 'red'}).addTo(mymap);
