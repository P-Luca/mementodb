function Osm(lang) {
	this.lang = lang;
	this.baseUrl = "https://nominatim.openstreetmap.org/";
}

Osm.prototype.getWikipediaUrl = function() {
    return "https://" + this.lang + ".wikipedia.org";
}

Osm.prototype.search = function(query) {
    var lang = this.lang !== "en" ? this.lang + "," : "";
    var url = this.baseUrl + "search/" + encodeURIComponent(query) + "?format=jsonv2&accept-language="+lang+"en&addressdetails=1&extratags=1&limit=100";
    log(url);
    var result = http().get(url);
    var json = JSON.parse(result.body);
    var resultArray = [];
    if(json !== undefined) {
        //var pages = json.query.pages;
        var ids = []
        var amenities = [];
        for (var id in json) {
            var item = json[id];
            if(item.extratags.wikidata !== undefined) {
                ids.push({
                    "type": "WP",
                    "id": item.extratags.wikidata,
                    "lat":item.lat,
                    "lon":item.lon
                });
            }
            else if(item.category === "amenity") {
                amenities.push(item);
            }
        }
        if(ids.length > 0) {
            resultArray = this._getWikipediaResults(ids);
        }
        else if(amenities.length > 0) {
            amenities.forEach(element => {
                var page = {};
                page.pageid = {
                    "type": "OSM",
                    "id": element.place_id,
                    "lat":element.lat,
                    "lon":element.lon
                };
                page.title = element.address[element.type] !== undefined ? element.address[element.type] : element.display_name;
                page.description = element.type;
                page.lat = element.lat;
                page.lon = element.lon;
                page.location = page.lat + "," + page.lon;
            });
        }
    }
    return resultArray;
}

Osm.prototype._getWikipediaResults = function(wikidataIDs) {
    var ids = [];
    wikidataIDs.forEach(e =>{
        ids.push(e.pageid.id);
    });
//    https://www.wikidata.org/wiki/Special:ApiSandbox#action=wbgetentities&format=json&ids=Q183536&props=info%7Cdescriptions%7Clabels%7Cdatatype&languages=it
    var lang = this.lang !== "en" ? this.lang + "%7C" : "";
    var url = "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&ids="+encodeURIComponent(wikidataIDs.join('|'))+"&props=labels&languages="+lang+"en";
    var result = http().get(url);
    var json = JSON.parse(result.body);
    var titles = [];
    for(var propertyName in json.entities) {
        var title = "";
        if(json.entities[propertyName].labels[this.lang] !== undefined)
            title = json.entities[propertyName].labels[this.lang].value;
        else
            title = json.entities[propertyName].labels["en"].value;
        titles.push(title);
    }
    return this._wikipediaSearch(titles.join('|'));
}

Osm.prototype._wikipediaSearch = function(query) {
    //https://it.wikipedia.org/wiki/Speciale:ApiSandbox#action=query&format=json&formatversion=2&prop=coordinates%7Cdescription%7Cpageimages&generator=search&piprop=thumbnail&pithumbsize=150&pilimit=50&pilicense=any&gsrnamespace=0&gsrsort=relevance&gsrsearch=Tokyo%20Tower
    var url = this.getWikipediaUrl() + "/w/api.php?action=query&format=json&prop=coordinates%7Cdescription%7Cpageimages&formatversion=2&piprop=thumbnail&pithumbsize=150&pilimit=50&pilicense=any&titles=" + encodeURIComponent(query);
    log(url);
    var result = http().get(url);
    var json = JSON.parse(result.body);
    var resultArray = [];
    if(json !== undefined && json.query !== undefined && json.query.pages !== undefined) {
        var pages = json.query.pages;
        for (var id in pages) {
            if(pages[id].coordinates !== undefined) {
                var page = {};
                page.pageid = "WP-"+pages[id].pageid;
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

Osm.prototype.details = function(pageId) {
    if(pageId.startsWith("WP-"))
        return this._wikipediaDetails(pageId.replace("WP-", ""));
    
}

Osm.prototype._wikipediaDetails = function(pageId) {
    // https://it.wikipedia.org/wiki/Speciale:ApiSandbox#action=query&format=json&formatversion=2&prop=coordinates%7Cdescription%7Cimages%7Cinfo%7Cextracts%7Cpageimages&pageids=1437252&utf8=1&inprop=url%7Cdisplaytitle&explaintext=1&exsectionformat=plain&coprop=type&piprop=original&pilimit=50&pilicense=any
    var url = this.getWikipediaUrl() + "/w/api.php?action=query&format=json&formatversion=2&prop=coordinates%7Cdescription%7Cimages%7Cinfo%7Cextracts%7Cpageimages&utf8=1&inprop=url%7Cdisplaytitle&exlimit=20&explaintext=1&exsectionformat=plain&coprop=type&piprop=original&pilimit=50&pilicense=any&pageids=" + pageId;
    log("details url: " + url.replace("/w/api.php?", "/wiki/Speciale:ApiSandbox#"));
    var result = http().get(url);
    var json = JSON.parse(result.body);
    if(json !== undefined && json.query !== undefined && json.query.pages !== undefined) {
      var page = json.query.pages[0];
      // log(page);
      var details = {};
      details['title'] = page.title
      details['lat'] = page.coordinates[0].lat;
      details['lon'] = page.coordinates[0].lon;
      details['locationType'] = page.coordinates[0].type;
      details['location'] = page.coordinates[0].lat + "," + page.coordinates[0].lon;
      details['extract'] = page.extract;
      details['url'] = page.fullurl;
      if(page.images !== undefined && page.images.length > 0) {
              var imcontinue = json.continue !== undefined ? json.continue.imcontinue : undefined;
              do {
                  var resultContinue = http().get(this.getWikipediaUrl() + "/w/api.php?action=query&format=json&formatversion=2&prop=coordinates%7Cdescription%7Cimages%7Cinfo%7Cextracts&utf8=1&inprop=url%7Cdisplaytitle&exlimit=20&explaintext=1&imlimit=50&exsectionformat=plain&pageids=" + pageId+"&imcontinue=" + encodeURIComponent(imcontinue));
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
    //   details['locationInfo'] = this.getLocationInformation(page.coordinates[0], page.title);
          return details;
    }
    return {};
}
  
Osm.prototype.getImages = function(titles) {
    var result = http().get(this.getWikipediaUrl() + "/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=url&iiurlwidth=1280&iiurlheight=1280&titles="+encodeURIComponent(titles));
    var json = JSON.parse(result.body);
    var images = [];
    if(json !== undefined && json.query !== undefined && json.query.pages !== undefined) {
      for(var index in json.query.pages) {
        var img = json.query.pages[index];
        if(img !== undefined && img.invalid === undefined) {
            images.push(img.imageinfo[0].thumburl);
        }
      }
    }
    return images;
}

Osm.prototype.getLocationInformation = function(wikipediaCoords, name) {
    var lat = wikipediaCoords.lat;
    var lon = wikipediaCoords.lon;
    var lang = this.lang !== "en" ? this.lang + "," : "";
    var url = "https://nominatim.openstreetmap.org/";
    name = encodeURIComponent(name);
    if(wikipediaCoords.type === "country") {
        url += "search/"+name+"?country="+name;
    }
    else if(wikipediaCoords.type === "adm2nd" || wikipediaCoords.type === "adm3rd") {
        url += "search/"+name+"?country="+name;
    }
    else {
        url += "search/"+name;
        // url += "reverse?lat="+lat+"&lon="+lon;
    }
    url += "&format=jsonv2&accept-language="+lang+"en&addressdetails=1&extratags=1"
    log("OSM url: " + url);
    var response = http().get(url);
    var result = JSON.parse(response.body);
    if(Array.isArray(result))
        return result[0];
    return result;
}



/*
https://nominatim.openstreetmap.org/search/Tokyo%20Tower?format=jsonv2&accept-language=it,en&addressdetails=1&extratags=1
Tokyo Tower -> WikiData ID = Q183536
    https://www.wikidata.org/wiki/Special:ApiSandbox#action=wbgetentities&format=json&ids=Q183536&props=info%7Cdescriptions%7Clabels%7Cdatatype&languages=it

*/