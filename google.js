var BASE_URL = "https://maps.googleapis.com/maps/api/place";

function Google(key) {
	this.key = key;
}

Google.prototype.getUrl = function(relativeUrl) {
  return BASE_URL + relativeUrl + "?key=" + this.key;
}

Google.prototype.search = function(query) {
	var result = http().get(this.getUrl("/findplacefromtext/json")+"&inputtype=textquery&fields=place_id,photos,icon,name,formatted_address&language=it&input=" + encodeURIComponent(query));
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
			if(candidates[id].photos !== undefined) {
				candidate.photo = this.getUrl("/photo")+"&maxwidth=1280&photoreference=" + encodeURIComponent(candidates[id].photos[0].photo_reference);
			}
			resultArray.push(candidate);
        }
    }
    return resultArray;
}

Google.prototype.details = function(placeid) {
	var result = http().get(this.getUrl("/details/json")+"&fields=name,rating,formatted_address,geometry/location,url,photos&placeid=" + encodeURIComponent(placeid));
	log(result.body);
	var json = JSON.parse(result.body);
	log(json);
    var obj = {};
	if(json !== undefined && json.result !== undefined) {
		obj.title = json.result.name;
		obj.location = json.result.geometry.location.lat+","+json.result.geometry.location.lng;
		obj.rating = json.result.rating;
		obj.url = json.result.url;
		if(json.result.photos !== undefined) {
			var photos = [];
			for(var i in json.result.photos) {
				var photo = json.result.photos[i];
				photos.push(this.getUrl("/photo")+"&maxwidth=1280&photoreference=" + encodeURIComponent(photo.photo_reference));
			}
			obj.photos = photos.join();
		}
    }
    return obj;
}