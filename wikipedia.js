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
    var result = http().get(this.baseUrl + "/w/api.php?action=query&format=json&prop=coordinates%7Cdescription%7Cimageinfo&generator=search&gsrnamespace=0&gsrsort=relevance&gsrsearch=" + encodeURIComponent(query));
    var json = JSON.parse(result.body);
    var resultArray = [];
    if(json !== undefined && json.query !== undefined && json.query.pages !== undefined) {
        var pages = json.query.pages;
        for (var id in pages) {
            if(pages[id].coordinates !== undefined) {
                var page = {};
                page.pageid = pages[id].pageid;
                page.title = pages[id].title;
                page.description = pages[id].description;
                page.lat = pages[id].coordinates[0].lat;
                page.lon = pages[id].coordinates[0].lon;
                page.location = page.lat + "," + page.lon;
                resultArray.push(page);
            }
        }
    }
    return resultArray;
}

Wikipedia.prototype.details = function(pageId) {
    // https://it.wikipedia.org/wiki/Speciale:ApiSandbox#action=query&format=json&prop=coordinates%7Cdescription%7Cimages%7Cinfo%7Cextracts&pageids=1437252&utf8=1&inprop=url%7Cdisplaytitle&explaintext=1&exsectionformat=plain
    var result = http().get(this.baseUrl + "/w/api.php?action=query&format=json&prop=coordinates%7Cdescription%7Cimages%7Cinfo%7Cextracts&utf8=1&inprop=url%7Cdisplaytitle&exlimit=20&explaintext=1&exsectionformat=plain&pageids=" + pageId);
    var json = JSON.parse(result.body);
    if(json !== undefined && json.query !== undefined && json.query.pages !== undefined) {
        var page = json.query.pages[pageId];
        var details = {};
        details['title'] = page.title
        details['location'] = page.coordinates[0].lat + "," + page.coordinates[0].lon;
        details['extract'] = page.extract;
        details['url'] = page.fullurl;
        if(page.images !== undefined && page.images.length > 0) {
            //details.images = [];
            var imgTitles = [];
            var regex = new RegExp("\.[Jj][Pp][Ee]?[Gg]$");
            for(var index in page.images) {
                var title = page.images[index].title;
		if(regex.test(title))
			imgTitles.push(title);
            }
	    var images = this.getImages(imgTitles.join('|'));
            details['images'] = images.join();
        }
        log("Extra info");
    	log(details);
	return details;
    }
    return {};
}

Wikipedia.prototype.getImages = function(titles) {
    var result = http().get(this.baseUrl + "/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=1280&iiurlheight=1280&titles="+encodeURIComponent(titles));
    var json = JSON.parse(result.body);
    var images = [];
    if(json !== undefined && json.query !== undefined && json.query.pages !== undefined) {        
        for(var index in json.query.pages) {
            var img = json.query.pages[index];
            if(img !== undefined && img.invalid === undefined) {
                //images = images + img.imageinfo[0].thumburl + ",";
		images.push(img.imageinfo[0].thumburl);
            }
        }
        //images = images.replace(/,([^,]*)$/, '');
    }
    return images;
}
