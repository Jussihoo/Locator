
// init
var locators = [];


var socket = io("http://localhost:8040"); 

socket.on('PushStop', function(name) {
  var parsedName = JSON.parse(name);
  // remove locator
  removeUser(parsedName);
  // Update the Target relector
  targetSelector.removeTarget();
});

socket.on('PushLocation', function (data) {

  var allData = JSON.parse(data);
  if (allData.source === "phone") {
  } else if (allData.source === "thingsee") {
  }
  updateLocation(allData.lat, allData.lon, allData.name, allData.speed, allData.distance,allData.routetime, allData.aveSpeed, allData.maxSpeed);
});

var jussiIcon = L.icon({
  iconUrl: 'jussi_icon.png',
  iconRetinaUrl: 'jussi_icon.png',
  iconSize: [35, 35],
  iconAnchor: [10, 35],
  popupAnchor: [0, -35]});

var maaritIcon = L.icon({
  iconUrl: 'maarit_icon.png',
  iconRetinaUrl: 'maarit_icon.png',
  iconSize: [35, 35],
  iconAnchor: [10, 35],
  popupAnchor: [0, -35]});

var thingseeIcon = L.icon({
  iconUrl: 'thingsee_icon.png',
  iconRetinaUrl: 'thingsee_icon.png',
  iconSize: [35, 35],
  iconAnchor: [10, 35],
  popupAnchor: [0, -35]});

var xIcon = L.icon({
  iconUrl: 'x_icon.png',
  iconRetinaUrl: 'x_icon.png',
  iconSize: [35, 35],
  iconAnchor: [10, 35],
  popupAnchor: [0, -35]});
  
function removeUser(name){
  if (locators.length >0){
     for (var i=0; i<locators.length; i++){
        if (locators[i].name == name){
          locators.splice(i,1);
          break;
        }
     }
  }
}

function updateLocation(lat, lon, name, speed, distance, time, aveSpeed, maxSpeed){
  var point = [lat,lon];
  
  var nameFound = false;
  if (locators.length >0){
     for (var i=0; i<locators.length; i++){
      if (locators[i].name == name){
        mymap.removeLayer(locators[i].object.marker);
        var icon = locators[i].object.icon;
        var popUpText = name+"<br>"+"speed " + speed + " km/h (max " + maxSpeed + " km/h)"+
                        "<br>"+"distance "+ distance + " km"+
                        "<br>"+"average speed " + aveSpeed + " km/h, time: "+time;
        locators[i].object.marker = L.marker([lat, lon],{icon: icon}).addTo(mymap).bindPopup(popUpText).openPopup();
        locators[i].object.polyline.addLatLng(point);
        nameFound = true;
        if (locators[i].bTarget) { // this user is on followed. Update the view
          // set the map view to the last location
          mymap.setView([lat, lon]);
        }
        break;
      }
     }  
    }
    if (!nameFound){ // Create new locator
      // set icon
      if (name != ""){
        if (name == "Jussi"){
          var icon = jussiIcon;
        }
        else if (name == "Maarit"){
          var icon = maaritIcon;
        }
        else if (name == "thingsee"){
          var icon = thingseeIcon;
        }
        else{
          var icon = xIcon;
        }
      }
      else{ // name is unknown
        var icon = xIcon;
      }
      // create a new marker
      var popUpText = name+"<br>"+"speed " + speed + " km/h (max " + maxSpeed + " km/h)"+
                        "<br>"+"distance " + distance + " km"+
                        "<br>"+"average speed " + aveSpeed + " km/h, time: "+time;
      var marker = new L.marker([lat, lon],{icon: icon}).addTo(mymap).bindPopup(popUpText).openPopup();
      // create a new polyline
      var polyline = L.polyline([], {color: 'blue'}).addTo(mymap);
      polyline.addLatLng(point);
      // create a new locator
      var bTarget = false;
      var locator = new locateObject(name, marker, icon, polyline, bTarget);
      locators.push({"name": name, "object": locator});
      // Add new locator to Control Targets
      targetSelector.addTarget(locators.length-1);
    }
}

function locateObject(name, marker, icon, polyline){
  this.name = name;
  this.marker = marker;
  this.icon = icon;
  this.polyline = polyline;
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

// create initial map and set the view
var mymap = L.map('mapid').setView([startLat, startLon], 15);
L.tileLayer(mapGoogleUrl, {id: 'mapbox.light', maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']}).addTo(mymap);

// create map selector
var mapTileLayers = {
			"Google maps": Google,
      "Google Satellite maps": GoogleSat,
      "MML Orto maps": MMLOrto,
      "MML Terrain maps": MML,
      "Open Street maps": OpenStreet
		};
L.control.layers(mapTileLayers).addTo(mymap);
// create the target selector
var targetSelector = L.control.targets().addTo(mymap);
