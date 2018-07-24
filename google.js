var BASE_URL = "https://maps.googleapis.com/maps/api/place";

function Google(key) {
	this.key = key;
}

Google.prototype.getUrl = function(relativeUrl) {
  return BASE_URL + relativeUrl + "?key=" + this.key;
}

Google.prototype.search = function(query) {
	var result = http().get(this.getUrl("/findplacefromtext/json")+"&inputtype=textquery&fields=place_id,photos,icon,name,rating,geometry/location,formatted_address&language=it&input=" + encodeURIComponent(query));
	log(result.body);
	var json = JSON.parse(result.body);
	log(json);
    var resultArray = [];
	if(json !== undefined && json.candidates !== undefined) {
        var candidates = json.candidates;
        for (var id in candidates) {
			var candidate = {};
			candidate.placeid = candidates[id].place_id;
			candidate.title = candidates[id].name;
			candidate.description = candidates[id].formatted_address;
			candidate.location = candidates[id].geometry.location.lat+","+candidates[id].geometry.location.lon;
			if(candidates[id].photos !== undefined && candidates[id].photos.size() > 0) {
				candidate.photo = this.getUrl("/photo")+"&maxwidth=1280&photoreference=" + encodeURIComponent(candidates[id].photos[0].photo_reference);
			}
			resultArray.push(candidate);
        }
    }
    return resultArray;
}