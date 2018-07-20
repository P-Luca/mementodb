function Wikipedia (lang) {
    this.lang = lang;
}

Wikipedia.prototype.search = function(query) {
    var result = http().get("https://"+this.lang+".wikipedia.org/w/api.php?action=query&format=json&prop=coordinates%7Cdescription%7Cimageinfo&generator=search&gsrnamespace=0&gsrsort=relevance&gsrsearch=" + encodeURIComponent(query));
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
    var result = http().get("https://"+this.lang+".wikipedia.org/w/api.php?action=query&format=json&prop=coordinates%7Cdescription%7Cimages%7Cinfo%7Cextracts&utf8=1&inprop=url%7Cdisplaytitle&exlimit=20&exintro=1&explaintext=1&exsectionformat=plain&pageids=" + pageId);
    var json = JSON.parse(result.body);
    var resultArray = [];
    if(json !== undefined && json.query !== undefined && json.query.pages !== undefined) {
        var page = response.query.pages[pageId];
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
        resultArray.push(details);
    }
    return resultArray;
}

Wikipedia.prototype.getImages = function(titles) {
    var result = http().get("https://"+this.lang+".wikipedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=1280&iiurlheight=1280&titles="+encodeURIComponent(imgTitles));
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
