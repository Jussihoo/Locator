var socket = io("http://localhost:8040"); 

socket.on('PushLocation', function (data) {
  console.log("got data from socket");

  var allData = JSON.parse(data);
  console.log("data: ", data);
  if (allData.source === "phone") {
    console.log("phone");
  } else if (allData.source === "thingsee") {
    console.log("Thingsee");
  }
  updateLocation(allData.lat, allData.lon);
});

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

// Map tile layer URLs
var mapMMLUrl =   'http://tiles.kartat.kapsi.fi/peruskartta/{z}/{x}/{y}.jpg';
var mapMMLOrtoUrl = 'http://tiles.kartat.kapsi.fi/ortokuva/{z}/{x}/{y}.jpg';
var mapOpenStreetUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var mapGoogleUrl = 'http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
var mapGoogleSatUrl = 'http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}';

// Map tile layers
var MML   = L.tileLayer(mapMMLUrl); // MML Terrain maps
var MMLOrto = L.tileLayer(mapMMLOrtoUrl); // MML orto maps
var OpenStreet = L.tileLayer(mapOpenStreetUrl); // Open Street maps
var Google = L.tileLayer(mapGoogleUrl, {id: 'mapbox.light', maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']}); // Google maps
var GoogleSat = L.tileLayer(mapGoogleSatUrl, {id: 'mapbox.light', maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']}); // Google satellite maps

// init
var startLat = 61.49505;
var startLon = 23.61751667;

// create map and set the view
var mymap = L.map('mapid').setView([startLat, startLon], 15);
//L.tileLayer('http://tiles.kartat.kapsi.fi/peruskartta/{z}/{x}/{y}.jpg').addTo(mymap);
L.tileLayer(mapGoogleUrl, {id: 'mapbox.light', maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']}).addTo(mymap);

// create marker 
var marker = new L.marker([startLat, startLon],{icon: myIcon});
//mymap.addLayer(marker);
// init routeline
var polyline = L.polyline([], {color: 'red'}).addTo(mymap);

// create map selector
var mapTileLayers = {
			"Google maps": Google,
      "Google Satellite maps": GoogleSat,
      "MML Orto maps": MMLOrto,
      "MML Terrain maps": MML,
      "Open Street maps": OpenStreet
		};
L.control.layers(mapTileLayers).addTo(mymap);
