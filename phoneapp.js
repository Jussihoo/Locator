"use strict";

// init
var timerId = 0;
var locatorName = "";

function startRoute(name, gpx) {
  console.log("start route");
  console.log(gpx);
  var url = "http://localhost:8040/startRoute";
  var status = communicateWithTheServer(url,JSON.stringify({"name":name, "gpx": gpx}));    
}

function stopRoute(name) {
  console.log("stop route");
  var url = "http://localhost:8040/stopRoute";
  var status = communicateWithTheServer(url,JSON.stringify({"name":name}));
}

function stopAutomaticPosition(){
  // stop the automatic position update;
  console.log("stop automatic position update");
  clearTimeout(timerId);
  timerId = 0;
}

function startAutomaticPosition(name){
  sendPosition(name); // send this once
  // start a 10 second interval to send coordinates
  console.log("start automatic position update for " + name);
  timerId = setInterval(function(){ sendPosition(name); }, 10*1000);
}

function sendPosition(name) {
	if (navigator.geolocation) {
    locatorName = name;
		navigator.geolocation.getCurrentPosition(positionSuccess, positionError, { enableHighAccuracy: true });
	} 
 }

function positionSuccess(position) {
		var lat = position.coords.latitude;
		var lon = position.coords.longitude;
		var acr = position.coords.accuracy;

		console.log("lat " + lat + "longitude " + lon + "accuracy " + acr + "name " + locatorName);
    var time = Date.now();
    var position = {"source":"phone", "name":locatorName, "lat":lat, "lon":lon, "accuracy":acr, "time":time};
    locatorName = "";
    console.dir(position);
    var url = "http://localhost:8040/sendCoords";
    var status = communicateWithTheServer(url,JSON.stringify(position));
}

function positionError(position){
  console.log("position error");
}

function communicateWithTheServer(url, data) {
    var client = new XMLHttpRequest(); //
    client.onreadystatechange = function() {
        if (client.readyState == 4 && client.status == 200) {
            console.log("Response ok");
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
    client.setRequestHeader('Content-Length', data.length);
    client.send(data);
}
