
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
  updateLocation(allData.lat, allData.lon, allData.name, allData.speed, allData.distance,allData.routetime,
                 allData.aveSpeed, allData.maxSpeed, allData.interval, allData.filter, allData.battery, allData.time);
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

function addZero(i) { // adds leading zero to timestamp to get double digit figure
if (i < 10) {
      i = "0" + i;
    }
    return i;
}

function updateLocation(lat, lon, name, speed, distance, time, aveSpeed, maxSpeed, interval, filter, battery, lastTime){
  var point = [lat,lon];
  var intervalUnit = "";
  var filterUnit = "";
  var nameFound = false;
  // set the interval info
  if (interval != undefined ){
    if (interval < 60 ) {
      intervalUnit = "seconds";
    }
    else {
      interval = interval / 60; // convert to minutes
      intervalUnit = "minutes";
    }
  }
  else {
    interval = "N/A";
  }
  // set the filter info
  if (filter != undefined ){
    if (filter == 0) {
      filter = "OFF";
    }
    else {
      filterUnit = "meters";
    }
  }
  else {
    filter = "N/A";
  }
  // set the battery info
  if (battery == undefined ){
    battery = "N/A";
  }
  // set the time
  var date = new Date();
  date.setTime(lastTime);
  var hours = addZero(date.getHours());
  var minutes = addZero(date.getMinutes());
  var seconds = addZero(date.getSeconds());  
  
  // connect the received location info to locator or create a new one
  if (locators.length >0){
     for (var i=0; i<locators.length; i++){
      if (locators[i].name == name){
        var icon = locators[i].object.icon;
        var popUpText = name+"<br>"+"speed: " + speed + " km/h (max " + maxSpeed + " km/h)"+
                        "<br>"+"distance: "+ distance + " km"+
                        "<br>"+"average speed: " + aveSpeed + " km/h, time: "+time+
                        "<br>"+"last location received on: " + hours + ":" + minutes + ":" + seconds +
                        "<br>"+"location interval: " + interval + " " + intervalUnit+
                        "<br>"+"location filter: " + filter + " " + filterUnit+
                        "<br>"+"battery level: " + battery + " %";
        if (locators[i].object.marker.isPopupOpen()) { // popup is open, because the user has opened it. So let's keep it open
          mymap.removeLayer(locators[i].object.marker); 
          locators[i].object.marker = L.marker([lat, lon],{icon: icon}).addTo(mymap).bindPopup(popUpText,{autoPan:false}).openPopup();
        }
        else { // user has not opened this popup so let's not open it automatically either 
          mymap.removeLayer(locators[i].object.marker);
          locators[i].object.marker = L.marker([lat, lon],{icon: icon}).addTo(mymap).bindPopup(popUpText,{autoPan:false}); // Does not open popup automatically
        }                
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
                        "<br>"+"average speed " + aveSpeed + " km/h, time: "+time+
                        "<br>"+"last location received on: " + hours + ":" + minutes + ":" + seconds +
                        "<br>"+"location interval: " + interval + " " + intervalUnit+
                        "<br>"+"location filter: " + filter + " " + filterUnit+
                        "<br>"+"battery level: " + battery + " %";
      //var marker = new L.marker([lat, lon],{icon: icon}).addTo(mymap).bindPopup(popUpText, {autoPan:false}).openPopup();
      var marker = new L.marker([lat, lon],{icon: icon}).addTo(mymap).bindPopup(popUpText, {autoPan:false}); // does not open popup automatically
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

function showActiveLocators(client){
  var activeLocators = JSON.parse(client.responseText);
  var name = "";
  var maxSpeed = 0;
  var distance = 0;
  var lat = 0;
  var lon = 0;
  var time = 0;
  var aveSpeed = 0;
  var speed = 0;
  for (i=0;i<activeLocators.locators.length;i++){
    name = activeLocators['locators'][i].name;
    maxSpeed = activeLocators['locators'][i].maxSpeed;
    distance = activeLocators['locators'][i].routeDistance;
    lat = activeLocators['locators'][i].lastLocation.lat;
    lon = activeLocators['locators'][i].lastLocation.lon;
    lastTime = activeLocators['locators'][i].lastLocation.time;
    time = activeLocators['locators'][i].routeTime;
    interval = activeLocators['locators'][i].interval;
    filter = activeLocators['locators'][i].filter;
    battery = activeLocators['locators'][i].battery;
    // show locator on map
    updateLocation(lat, lon, name, speed, distance, time, aveSpeed, maxSpeed, interval, filter, battery, lastTime); 
  }
}

function communicateWithTheServer(url, data, callback) {
    var client = new XMLHttpRequest(); //
    client.onreadystatechange = function() {
        if (client.readyState == 4 && client.status == 200) {
            callback(client);
        }
        // If status code is not 200, do not handle
        if (client.status != 200) {
            console.log("status " + client.status + " State: " + client.readyState);
            return false;
        }
    };
    client.open("POST", url, true);
    client.withCredentials = false;
    client.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    client.send(data);
}

function getActiveLocators(){
  console.log("Get active locators");
  var url = "http://localhost:8040/getActiveLocators";
  var status = communicateWithTheServer(url,"", showActiveLocators);
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

// get Active Locators from servers and then show those on map
getActiveLocators();
