function Wikipedia(query) {
	var regex = new RegExp("^([w][vp]) (it|en) ");
	var match = regex.exec(query);
	this.lang = "it";
	this.baseUrl = "wikipedia.org";
	this.cleanQuery = query;
	if (match !== null) {
		this.lang = match[2];
		if(match[1] === "wv") {
			this.baseUrl = "wikivoyage.org";
		}
		this.cleanQuery = query.replace(match[0], "");
	}
}

Wikipedia.prototype.getUrl = function() {
  return "https://" + this.lang + "." + this.baseUrl;
}

Wikipedia.prototype.search = function(query) {
//https://it.wikipedia.org/wiki/Speciale:ApiSandbox#action=query&format=json&formatversion=2&prop=coordinates%7Cdescription%7Cpageimages&generator=search&piprop=thumbnail&pithumbsize=150&pilimit=50&pilicense=any&gsrnamespace=0&gsrsort=relevance&gsrsearch=Tokyo%20Tower
	var result = http().get(this.getUrl() + "/w/api.php?action=query&format=json&formatversion=2&prop=coordinates%7Cdescription%7Cpageimages&generator=search&piprop=thumbnail&pithumbsize=150&pilimit=50&pilicense=any&gsrnamespace=0&gsrsort=relevance&gsrsearch=" + encodeURIComponent(query));
  var json = JSON.parse(result.body);
  var resultArray = [];
  if(json !== undefined && json.query !== undefined && json.query.pages !== undefined) {
    var pages = json.query.pages;
    for (var id in pages) {
      if(pages[id].coordinates !== undefined) {
        var page = {};
        page.pageid = pages[id].pageid;
        page.title = pages[id].title;
        page.description = pages[id].description !== undefined ? pages[id].description : "";
        page.lat = pages[id].coordinates[0].lat;
        page.lon = pages[id].coordinates[0].lon;
        page.location = page.lat + "," + page.lon;
				if(pages[id].thumbnail !== undefined)
					page.thumb = pages[id].thumbnail.source;
        resultArray.push(page);
      }
    }
  }
  return resultArray;
}

Wikipedia.prototype.details = function(pageId) {
  // https://it.wikipedia.org/wiki/Speciale:ApiSandbox#action=query&format=json&formatversion=2&prop=coordinates%7Cdescription%7Cimages%7Cinfo%7Cextracts%7Cpageimages&pageids=1437252&utf8=1&inprop=url%7Cdisplaytitle&explaintext=1&exsectionformat=plain&piprop=original&pilimit=50&pilicense=any
  var result = http().get(this.getUrl() + "/w/api.php?action=query&format=json&formatversion=2&prop=coordinates%7Cdescription%7Cimages%7Cinfo%7Cextracts%7Cpageimages&utf8=1&inprop=url%7Cdisplaytitle&exlimit=20&explaintext=1&exsectionformat=plain&piprop=original&pilimit=50&pilicense=any&pageids=" + pageId);
  var json = JSON.parse(result.body);
  if(json !== undefined && json.query !== undefined && json.query.pages !== undefined) {
    var page = json.query.pages[0];
    var details = {};
    details['title'] = page.title
    details['location'] = page.coordinates[0].lat + "," + page.coordinates[0].lon;
    details['extract'] = page.extract;
    details['url'] = page.fullurl;
    if(page.images !== undefined && page.images.length > 0) {
			var imcontinue = json.continue !== undefined ? json.continue.imcontinue : undefined;
			do {
				var resultContinue = http().get(this.getUrl() + "/w/api.php?action=query&format=json&formatversion=2&prop=coordinates%7Cdescription%7Cimages%7Cinfo%7Cextracts&utf8=1&inprop=url%7Cdisplaytitle&exlimit=20&explaintext=1&imlimit=50&exsectionformat=plain&pageids=" + pageId+"&imcontinue=" + encodeURIComponent(imcontinue));
				var jsonContinue = JSON.parse(resultContinue.body);
				if(jsonContinue !== undefined && jsonContinue.query !== undefined && jsonContinue.query.pages !== undefined) {
					page.images = page.images.concat(jsonContinue.query.pages[0].images);
					imcontinue = jsonContinue.continue !== undefined ? jsonContinue.continue.imcontinue : undefined;
				}
				else
					imcontinue = undefined;
			}
			while (imcontinue != null || imcontinue != undefined);
			var imgTitles = [];
      var regex = new RegExp("\.[Jj][Pp][Ee]?[Gg]$");
      for(var index in page.images) {
          var title = page.images[index].title;
					if(regex.test(title))
						imgTitles.push(title);
      }
			var images = this.getImages(imgTitles.join('|'));
			images.unshift(page.original.source);
      details['images'] = images.join();
    }
    details['locationinfo'] = this.getLocationInformation(page.coordinates[0].lat, page.coordinates[0].lon);
		return details;
  }
  return {};
}

Wikipedia.prototype.getImages = function(titles) {
  var result = http().get(this.getUrl() + "/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=url&iiurlwidth=1280&iiurlheight=1280&titles="+encodeURIComponent(titles));
  var json = JSON.parse(result.body);
  var images = [];
  if(json !== undefined && json.query !== undefined && json.query.pages !== undefined) {
    for(var index in json.query.pages) {
      var img = json.query.pages[index];
			log(img);
      if(img !== undefined && img.invalid === undefined) {
          images.push(img.imageinfo[0].thumburl);
      }
    }
  }
  return images;
}

/*
{
  "place_id": 198726104,
  "licence": "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
  "osm_type": "relation",
  "osm_id": 4247312,
  "lat": "35.65858645",
  "lon": "139.745440057962",
  "place_rank": 30,
  "category": "tourism",
  "type": "attraction",
  "importance": "0.468912755639849",
  "addresstype": "tourism",
  "name": "Torre di Tokyo",
  "display_name": "Torre di Tokyo, Tokyo Tower Street, 6-chome, Minato, Tokyo, Kanto, 105-0011, Giappone",
  "address": {
    "attraction": "Torre di Tokyo",
    "road": "Tokyo Tower Street",
    "hamlet": "6-chome",
    "city": "Minato",
    "state": "Tokyo",
    "region": "Kanto",
    "postcode": "105-0011",
    "country": "Giappone",
    "country_code": "jp"
  },
  "boundingbox": [
    "35.6580427",
    "35.6591227",
    "139.744746",
    "139.7461594"
  ]
}
*/
Wikipedia.prototype.getLocationInformation = function(lat, lon) {
  var lang = this.lang !== "en" ? this.lang + "," : "";
  var url = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat="+lat+"&lon="+lon+"&accept-language="+lang+"en&addressdetails=1";
  var result = http().get(url);
  return JSON.parse(result.body);
}