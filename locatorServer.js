"use strict";
var restify = require("restify");
var server = restify.createServer({
  name: 'Locator',
  version: '1.0.0'
});

var https = require("https");
var DOMParser = require('xmldom').DOMParser;
var fs = require('fs');
var socketio  = require ("socket.io");
var geolib = require('geolib');

var locators = [];

server.use(restify.bodyParser());

// REMOVE THESE?? Needed for enabling CORS and needed for allowing cross-origin resource sharing 
server.use(restify.CORS());
server.use(restify.fullResponse());

// socket
var io = socketio.listen(server.server);


var sendRes = function(res,items){
    console.dir(items);
    res.send(items);
};

function pushCoordsData(data){
  io.emit('PushLocation', JSON.stringify(data));  // send data to browser
  console.log("Coordinates pushed");
}

function handleSenses(senses, time){ 
    var pushData = {};  // init
    //pushData["source"] = "thingsee";
    pushData["name"] = "thingsee";
    for (var i=0; i<senses.length; i++){ // go through all the senses data
      if (senses[i].sId == '0x00010100' ){ // Latitude
        console.log("The latitude is " + senses[i].val); // remove this
        pushData["lat"] = senses[i].val;  
      }
		if (senses[i].sId == '0x00010200' ){ // Longtitude
        console.log("The longitude is " + senses[i].val); // remove this
        pushData["lon"] = senses[i].val; 
        pushData["time"] = senses[i].ts; // store also timestamp 
      }      
      else{
        console.dir(senses[i]);
      }
    }
    handleCoordinates(pushData, "thingsee", "");
}

function addZero(i) { // adds leading zero to timestamp to get double digit figure
if (i < 10) {
      i = "0" + i;
    }
    return i;
}

function getDateTime() {
    var today = new Date();
    var dd = addZero(today.getDate());
    var mm = addZero(today.getMonth()+1); //January is 0!
    var yyyy = today.getFullYear();
    var h = addZero(today.getHours()); 
    var min = addZero(today.getMinutes());
    var sec = addZero(today.getSeconds());
    
    today = yyyy+"_"+mm+"_"+dd+"_"+h+"_"+min+"_"+sec;
    console.log(today);
    return today;
}

function round(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function locateObject(name){
  this.name = name;
  var gpxFileName = "";
  var xmlDoc = "";
  var lastLocation = {"lat": 0, "lon": 0, "time": 0};
  var routeDistance = 0;
  var startTime = 0;
  console.log("name is "+this.name);
  this.generateGPXFileName = function() {
    var time = getDateTime();
    gpxFileName =  "track"+"_"+this.name+"_"+time+".gpx";
    console.log("file name is " + gpxFileName); 
  };
  this.createGPXFile = function(){
    var text="<?xml version=\"1.0\"?>\n"+
    "<gpx version=\"1.0\" creator=\"Locator\" xmlns=\"http://www.topografix.com/GPX/1/0\">\n"+
    "  <trk>\n"+
    "    <trkseg>\n"+
    "    </trkseg>\n"+
    "  </trk>\n"+
    "</gpx>\n";
    
    var parser = new DOMParser();
    xmlDoc = parser.parseFromString(text,"text/xml");
    fs.writeFile(gpxFileName, xmlDoc, function (err) {
      if (err) return console.log(err);
      console.log("GPX File "+ gpxFileName + " created");
    });
    return gpxFileName;
  };
  this.updateGPXFile = function(lat,lon){
    // create first <trkpt></trkpt> tags with proper indent
    var trackSeg = xmlDoc.getElementsByTagName("trkseg")[0];
    var trackPointEle = xmlDoc.createElement("trkpt");
    var indent = xmlDoc.createTextNode("   ");
    trackSeg.appendChild(indent);
    trackSeg.appendChild(trackPointEle);
    indent = xmlDoc.createTextNode("\n       ");
    trackSeg.appendChild(indent)
    
    // create lat and lon attributes to the last <trkpt> and handle proper indent
    var length = xmlDoc.getElementsByTagName("trkpt").length;
    if (length>0){
      var trackPoint = xmlDoc.getElementsByTagName("trkpt")[length-1];
    }
    trackPoint.setAttribute("lat", lat);
    trackPoint.setAttribute("lon", lon);
    indent = xmlDoc.createTextNode("\n          ");
    trackPoint.appendChild(indent);
    
    // add <time>add_time_here</time> tag with proper indent
    var timeISO = new Date().toISOString();
    var timeEle = xmlDoc.createElement("time");
    var timeText = xmlDoc.createTextNode(timeISO);
    timeEle.appendChild(timeText);
    trackPoint.appendChild(timeEle);
    indent = xmlDoc.createTextNode("\n       ");
    trackPoint.appendChild(indent);
    
    fs.writeFile(gpxFileName, xmlDoc, function (err) {
      if (err) return console.log(err);
      console.log("GPX File "+ gpxFileName + " updated");
    });
  };
  this.sendCoordinates = function(coordData, source, res){
  	coordData["source"] = source;
    if (gpxFileName != ""){
      this.updateGPXFile(coordData.lat, coordData.lon);
    }
    // calculate distance between the points
    if (lastLocation.lat != 0 && lastLocation.lon != 0 ){
      var distance = geolib.getDistance(
          {latitude: coordData.lat, longitude: coordData.lon},
          {latitude: lastLocation.lat, longitude: lastLocation.lon}
      );
      routeDistance = routeDistance + distance/1000; // converted into kilometers
      coordData["distance"] = round(routeDistance,3); // rounding with three decimal
      console.log("distance between the points is " + distance/1000);
      //calculate current speed
      var speed = Math.abs(geolib.getSpeed(
          {latitude: coordData.lat, longitude: coordData.lon, time: coordData.time},
          {latitude: lastLocation.lat, longitude: lastLocation.lon, time: lastLocation.time}
      ));
      console.log("current speed is " + speed + "km/h");
      coordData["speed"] = round( speed,1); // rounding with one decimal
      // calculate the route time
      var routeTime = new Date(coordData.time-startTime);
      coordData["routetime"] = addZero(routeTime.getUTCHours())+":"+addZero(routeTime.getMinutes())+":"+addZero(routeTime.getSeconds());
      // calculate average speed
      var averageSpeed = round((routeDistance / ((coordData.time-startTime)/1000/60/60)),1); // km/h
      coordData["aveSpeed"] = averageSpeed;
    }
    else{ // first point. No distance, no speed
      coordData["distance"] = 0;
      coordData["speed"] = 0;
      startTime = coordData.time; // set the start time in ms
      coordData["routetime"] = 0;
      coordData["aveSpeed"] = 0;  
    }
    // store the last position
    lastLocation.lat = coordData.lat;
    lastLocation.lon = coordData.lon;
    lastLocation.time = coordData.time;
    // send coordinates
  	pushCoordsData(coordData);
  	console.dir(coordData);
    if(res != ""){
  	 sendRes(res, "");
    }
  };
}

function handleRouteStart(name, gpx, res){
  var nameFound = false;
    if (locators.length >0){
       for(var i=0;i<locators.length;i++){
        if (locators[i].name == name){
          console.log ("locator exists already");
          sendRes(res, "the locator has already started a track");
          nameFound = true;
          break;
        }
       }  
    }
    if (!nameFound){
      console.log("name not found");
      var locator = new locateObject(name);
      var gpxFileName = "";
      if (gpx){ // create GPX File
        locator.generateGPXFileName(name);
        gpxFileName = locator.createGPXFile();
      }
      locators.push({"name": name, "object": locator});
      console.dir(locators);
      sendRes(res, gpxFileName);  
    }
}

function handleRouteStop(name,res){
  var nameFound = false;
  if (locators.length >0){
     for(var i=0;i<locators.length;i++){
      if (locators[i].name == name){
        console.log ("locator found");
        locators.splice(i,1);
        console.log ("locator object has been deleted");
        nameFound = true;
        sendRes(res, "OK");  
        break;
      }
     }  
  }
  if (!nameFound){
    console.log("name not found");
    sendRes(res, "name not found");
  }
}

function handleCoordinates(coordData, source, res){
  var nameFound = false;
  if (locators.length >0){
     for(var i=0;i<locators.length;i++){
      if (locators[i].name == coordData.name){
        console.log ("locator exists");
        locators[i].object.sendCoordinates(coordData, source, res);
        nameFound = true;  
        break;
      }
     }  
  }
  if (!nameFound){
    console.log ("no locators or name not found");
  }
}

//REST API implementation sending the coordinates from the mobile phone
server.post('/sendCoords', function (req, res, next) {
    var coordData = req.params;
    console.log ("coordinates received from phone");
    console.dir(coordData);
    handleCoordinates(coordData, "phone", res);
    next();
});

//REST API implementation for starting the route
server.post('/startRoute', function (req, res, next) {
    console.log ("Start button clicked");
    var params = req.params;
    console.dir(params);
    handleRouteStart(params.name, params.gpx, res);
    next();
});

//REST API implementation for finishing the route
server.post('/stopRoute', function (req, res, next) {
    console.log ("stop button clicked");
    var params = req.params;
    console.log(params.name);
    handleRouteStop(req.params.name, res);
    next();
});

// REST API implementation for handling the push messages from the Thingsee IOT
server.post('/', function (req, res, next) {
    var time = new Date();
    var hh = addZero(time.getHours());
    var mm = addZero(time.getMinutes());
    var ss = addZero(time.getSeconds());
    var consoleTime = hh + ":" + mm + ":" + ss; 
    
    console.log('got IOT message from Lutikka. Timestamp ' + consoleTime); // remove this
    handleSenses(req.params[0].senses, time);

    res.send(Number(200)); // send reply, otherwise Thingsee does not send next measurement normally
    next();
});

// Socket handling
io.sockets.on('connection', function (socket) {
    //wait for client to make a socket connection
    console.log("socket connection has been made");
});                              

server.listen(8040, function () {
    console.log('Node.js Locator server is listening at %s', server.url);
});

