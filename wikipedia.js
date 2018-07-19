function Wikipedia (lang) {
    this.lang = lang;
}

Wikipedia.prototype.search = function(query) {
  var result = http().get("https://"+this.lang+".wikipedia.org/w/api.php?action=query&format=json&prop=coordinates%7Cdescription%7Cimageinfo&generator=search&gsrnamespace=0&gsrsort=relevance&gsrsearch=" + encodeURIComponent(query));
  var json = JSON.parse(result.body);
  var resultArray = [];
  if(json !== undefined && json.query !== undefined && json.query.pages !== undefined)
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
