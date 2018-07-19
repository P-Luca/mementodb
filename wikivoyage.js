function Wikivoyage (lang) {
    this.lang = lang;
}

Wikivoyage.prototype.search = function(query) {
  var result = http().get("https://"+this.lang+".wikivoyage.org/w/api.php?action=query&format=json&prop=coordinates%7Cdescription%7Cimageinfo&generator=search&gsrnamespace=0&gsrsort=relevance&gsrsearch=" + encodeURIComponent(query));
  var json = JSON.parse(result.body);
  var pages = json.query.pages;
  if(pages !== undefined) {
      var resultArray = [];
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