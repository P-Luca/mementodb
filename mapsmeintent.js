var AUTHORITY = "com.mapswithme.maps.api";
var ACTION_MWM_REQUEST = AUTHORITY + ".request";
var API_VERSION = 2;

/* Request extras */
var EXTRA_URL = AUTHORITY +  ".url";
var EXTRA_TITLE = AUTHORITY + ".title";
var EXTRA_API_VERSION = AUTHORITY + ".version";
var EXTRA_CALLER_APP_INFO = AUTHORITY + ".caller_app_info";
var EXTRA_HAS_PENDING_INTENT = AUTHORITY + ".has_pen_intent";
var EXTRA_CALLER_PENDING_INTENT = AUTHORITY + ".pending_intent";
var EXTRA_RETURN_ON_BALLOON_CLICK = AUTHORITY + ".return_on_balloon_click";
var EXTRA_PICK_POINT = AUTHORITY + ".pick_point";
var EXTRA_CUSTOM_BUTTON_NAME = AUTHORITY + ".custom_button_name";

// RESPONSE CONSTANTS
var EXTRA_MWM_RESPONSE_POINT_NAME = AUTHORITY + ".point_name";
var EXTRA_MWM_RESPONSE_POINT_LAT = AUTHORITY + ".point_lat";
var EXTRA_MWM_RESPONSE_POINT_LON = AUTHORITY + ".point_lon";
var EXTRA_MWM_RESPONSE_POINT_ID = AUTHORITY + ".point_id";
var EXTRA_MWM_RESPONSE_ZOOM = AUTHORITY + ".zoom_level";

// Placemark Styles
var PlacemarkRed = "placemark-red";
var PlacemarkBlue = "placemark-blue";
var PlacemarkPurple = "placemark-purple";
var PlacemarkYellow = "placemark-yellow";
var PlacemarkPink = "placemark-pink";
var PlacemarkBrown = "placemark-brown";
var PlacemarkGreen = "placemark-green";
var PlacemarkOrange = "placemark-orange";

function Point(coordinates, name, style) {
	this.coordinates = coordinates;
	this.name = name;
	this.style = (style === null || style === undefined) ?  PlacemarkRed : style;
}

function MapsMe() {
	
}

MapsMe.prototype.createUrl = function(points) {
	var url = "mapswithme://map?v="+API_VERSION;
	url += "&backurl=mapswithme.client.mementodb";
	url += "&appname=mementoDB";
	
	for(var i in points) {
		url += "&ll="+points[i].coordinates+"&";
		url += "&n="+points[i].name+"&";
		url += "&s="+points[i].style+"&";
	}
	return url;
}

MapsMe.prototype.showPoints = function(points) {
	var i = intent(ACTION_MWM_REQUEST);

	i.extra(EXTRA_URL , this.createUrl(points));
	i.extra(EXTRA_TITLE, "Test Title");
	i.extra(EXTRA_RETURN_ON_BALLOON_CLICK, false);
	i.extra(EXTRA_PICK_POINT, false);
	i.extra(EXTRA_CUSTOM_BUTTON_NAME, "CustomButton");
	i.extra(EXTRA_HAS_PENDING_INTENT, false);

	i.send();
}

function testPoints() {
	var mapsme = new MapsMe();
	var points = [];
	var point = new Point("35.0393744,135.7270544", "Kinkakuji");
	points.push(point);
	mapsme.showPoints(points);
}