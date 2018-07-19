function Wikipedia (lang) {
    this.lang = lang;
}

Wikipedia.prototype.search = function(query) {
  var result = http().get("https://"+this.lang+".wikipedia.org/w/api.php?action=query&format=json&prop=coordinates%7Cdescription%7Cimages%7Cimageinfo&callback=?&titles=" + encodeURIComponent(query));
  var json = JSON.parse(result.body);
  var pages = json.query.pages;
  var resultArray = [];
  for (var id in pages) {
    var page = pages[id];
    resultArray.push(page);
  }
  return resultArray;
}

/**
Issue a search query to Discogs database.
@param {string} code - Search barcodes.
*/
Wikipedia.prototype.barcode = function(code) {
  var result = http().get("https://api.discogs.com/database/search?barcode=" + encodeURIComponent(code) + "&key=" + this.apiKey + "&secret=" + this.apiSecret + "&type=" + this.type);
  var json = JSON.parse(result.body);
  return json.results;  
}

/**
@param {string} id - The resource identifier.
*/
Wikipedia.prototype.extra = function(id) {
    var resultJson = http().get("https://api.discogs.com/" + this.type + "s/" + id + "?key=" + this.apiKey + "&secret=" + this.apiSecret);
    var result = JSON.parse(resultJson.body); 
    if (result.images !== undefined) 
        result['images'] = result.images.map(function(e) { return e.uri; }).join(); 
    if (result.videos !== undefined) 
        result['videos'] = result.videos.map(function(e) { return e.uri; }).join();     
    if (result.artists !== undefined)
        result['artists'] = result.artists.map(function(e) { return e.name; }).join();   
    if (result.tracklist !== undefined)  
        result['tracklist'] = result.tracklist.map(function(e) { return e.position + ". " + e.title + " " + e.duration; }).join("\n");     
    if (result.styles !== undefined)  
        result['styles'] = result.styles.join();     
    if (result.genres !== undefined)
        result['genres'] = result.genres.join();        
    return result;
}
