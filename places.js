function printLog(text) {
    // log(text);
}

function Places(lang, googleApiKey) {
    this.lang = lang;
    this.googleApiKey = googleApiKey;
    this.lib = null;
}

Places.prototype.search = function (query) {
    if (query.endsWith(" g")) {
        this.lib = new Google(this.lang, this.googleApiKey);
        query = query.replace(" g", "");
    }
    else {
        this.lib = new Osm(this.lang);
    }

    return this.lib.search(query);
}

Places.prototype.details = function (id) {
    var details = this.lib.details(id);
    switch (details.type) {
        case "administrative":
            details.type = "Paese/Regione";
            break;
        case "city":
            details.type = "Città";
            break;
        case "attraction":
        case "point_of_interest":
        case "castle":
            details.type = "Attrazione";
            break;
        case "museum":
        case "art_gallery":
            details.type = "Museo";
            break;
        case "restaurant":
            details.type = "Ristorante";
            break;
        case "hamlet":
        case "peak":
        case "natural_feature":
            details.type = "Luogo";
            break;
        case "guest_house":
        case "hotel":
        case "lodging":
            details.type = "Albergo";
            break;
    }

    return details;
}

function Google(lang, key) {
    this.key = key;
    this.lang = lang;
    this.baseUrl = "https://maps.googleapis.com/maps/api/place";
}

Google.prototype.getUrl = function (relativeUrl) {
    return this.baseUrl + relativeUrl + "?key=" + this.key;
}

Google.prototype.search = function (query) {
    var result = http().get(this.getUrl("/findplacefromtext/json") + "&inputtype=textquery&fields=place_id,photos,icon,type,name,formatted_address,geometry/location&language=" + this.lang + "&input=" + encodeURIComponent(query));
    printLog(result.body);
    var json = JSON.parse(result.body);
    printLog(json);
    var resultArray = [];
    if (json !== undefined && json.candidates !== undefined) {
        var candidates = json.candidates;
        for (var id in candidates) {
            var candidate = {};
            candidate.pageid = {
                "idtype": "G",
                "id": candidates[id].place_id
            }
            candidate.title = candidates[id].name;
            candidate.description = candidates[id].formatted_address;
            candidate['lat'] = candidates[id].geometry.location.lat;
            candidate['lon'] = candidates[id].geometry.location.lng;
            candidate["location"] = candidates[id].geometry.location.lat + "," + candidates[id].geometry.location.lng;
            if (candidates[id].photos !== undefined) {
                candidate.thumb = this.getUrl("/photo") + "&maxwidth=256&photoreference=" + encodeURIComponent(candidates[id].photos[0].photo_reference);
                // var photoResult = http().get(candidate.photo);
                // printLog(photoResult);
            }
            resultArray.push(candidate);
        }
    }
    return resultArray;
}

Google.prototype.details = function (placeid) {
    var result = http().get(this.getUrl("/details/json") + "&fields=name,type,formatted_address,address_components,geometry/location,url,user_ratings_total,photos&language=" + this.lang + "&placeid=" + encodeURIComponent(placeid.id));
    printLog(result.body);
    var json = JSON.parse(result.body);
    printLog(json);
    var details = {};
    if (json !== undefined && json.result !== undefined) {
        var result = json.result;
        details["title"] = result.name;
        details['lat'] = result.geometry.location.lat;
        details['lon'] = result.geometry.location.lng;
        details["location"] = result.geometry.location.lat + "," + result.geometry.location.lng;
        details['extract'] = "";
        details["url"] = result.url;
        details["type"] = result.types !== undefined ? result.types[0] : "";
        if (result.photos !== undefined) {
            var photos = [];
            for (var i in result.photos) {
                var photo = result.photos[i];
                var photoUrl = this.getUrl("/photo") + "&maxwidth=1280&photoreference=" + encodeURIComponent(photo.photo_reference);
                printLog(photoUrl);
                photos.push(photoUrl);
            }
            details["images"] = photos.join();
        }
        var address = result.address_components;
        for (var x in address) {
            if(Array.isArray(address[x].types)) {
                if (address[x].types.includes("country")) {
                    details["country"] = address[x].long_name;
                }
                else if (address[x].types.includes("administrative_area_level_1")) {
                    details["state"] = address[x].long_name;
                }
            }
            else {
                if (address[x].types === "country") {
                    details["country"] = address[x].long_name;
                }
                else if (address[x].types === "administrative_area_level_1") {
                    details["state"] = address[x].long_name;
                }
            }
        }
    }
    return details;
}

function Osm(lang) {
    this.lang = lang;
    this.baseUrl = "https://nominatim.openstreetmap.org";
    this.wikidataUrl = "https://www.wikidata.org"
}

Osm.prototype.getWikipediaUrl = function () {
    return "https://" + this.lang + ".wikipedia.org";
}

Osm.prototype.search = function (query) {
    var lang = this.lang !== "en" ? this.lang + "," : "";
    var url = this.baseUrl + "/search/" + encodeURIComponent(query) + "?format=jsonv2&accept-language=" + lang + "en&addressdetails=1&extratags=1&limit=1000";
    printLog(url);
    var result = http().get(url);
    var json = JSON.parse(result.body);
    var resultArray = [];
    if (json !== undefined) {
        var ids = {};
        var amenities = [];
        for (var id in json) {
            var item = json[id];
            if (item.extratags.wikidata !== undefined) {
                ids[item.extratags.wikidata] = {
                    "idtype": "WP",
                    "id": item.extratags.wikidata,
                    "lat": item.lat,
                    "lon": item.lon,
                    "address": item.address,
                    "type": item.type,
                    "category": item.category
                };
            }
            else if (item.category === "amenity" || item.category === "tourism") {
                amenities.push(item);
            }
        }
        if (Object.keys(ids).length > 0) {
            resultArray = this._getWikipediaResults(ids);
        }
        if (amenities.length > 0) {
            amenities.forEach(element => {
                var page = {};
                page.title = element.address[element.type] !== undefined ? element.address[element.type] : element.display_name;
                page.pageid = {
                    "idtype": "OSM",
                    "id": element.place_id,
                    "lat": element.lat,
                    "lon": element.lon,
                    "extratags": element.extratags,
                    "address": element.address,
                    "name": page.title,
                    "type": element.type,
                    "category": element.category
                };
                page.description = element.type;
                page.lat = element.lat;
                page.lon = element.lon;
                page.location = page.lat + "," + page.lon;
                page.thumb = element.icon;
                resultArray.push(page);
            });
        }
    }
    return resultArray;
}

Osm.prototype._getWikipediaResults = function (wikidataIDs) {
    var ids = [];
    for (id in wikidataIDs) {
        ids.push(id);
    }

    var lang = this.lang !== "en" ? this.lang + "%7C" : "";
    var url = this.wikidataUrl + "/w/api.php?action=wbgetentities&format=json&ids=" + encodeURIComponent(ids.join('|')) + "&props=labels&languages=" + lang + "en";
    var result = http().get(url);
    var json = JSON.parse(result.body);
    var titles = [];
    for (var propertyName in json.entities) {
        if (json.entities[propertyName].labels[this.lang] !== undefined)
            wikidataIDs[propertyName]["title"] = json.entities[propertyName].labels[this.lang].value;
        else
            wikidataIDs[propertyName]["title"] = json.entities[propertyName].labels["en"].value;
    }
    return this._wikipediaSearch(wikidataIDs);
}

Osm.prototype._wikipediaSearch = function (wikidataIDs) {
    var titles = [];
    for (id in wikidataIDs) {
        titles.push(wikidataIDs[id].title);
    }
    var query = titles.join('|');
    //https://it.wikipedia.org/wiki/Speciale:ApiSandbox#action=query&format=json&formatversion=2&prop=coordinates%7Cdescription%7Cpageimages&generator=search&piprop=thumbnail&pithumbsize=150&pilimit=50&pilicense=any&gsrnamespace=0&gsrsort=relevance&gsrsearch=Tokyo%20Tower
    var url = this.getWikipediaUrl() + "/w/api.php?action=query&format=json&prop=coordinates%7Cdescription%7Cpageimages&formatversion=2&piprop=thumbnail&pithumbsize=150&pilimit=50&pilicense=any&titles=" + encodeURIComponent(query);
    printLog(url);
    var result = http().get(url);
    var json = JSON.parse(result.body);
    var resultArray = [];
    if (json !== undefined && json.query !== undefined && json.query.pages !== undefined) {
        var pages = json.query.pages;
        for (var id in pages) {
            var wikidataId = this._getWikidataIdFromTitle(wikidataIDs, pages[id].title);
            if (wikidataId != null && (pages[id].missing === undefined || !pages[id].missing)) {
                var page = {};
                wikidataId["wpPageId"] = pages[id].pageid;
                page.pageid = wikidataId;
                page.title = pages[id].title;
                page.description = pages[id].description !== undefined ? pages[id].description : "";
                page.lat = wikidataId.lat;
                page.lon = wikidataId.lon;
                page.location = page.lat + "," + page.lon;
                if (pages[id].thumbnail !== undefined)
                    page.thumb = pages[id].thumbnail.source;
                resultArray.push(page);
            }
        }
    }
    return resultArray;
}

Osm.prototype._getWikidataIdFromTitle = function (wikidataIDs, title) {
    for (id in wikidataIDs) {
        if (wikidataIDs[id].title.toLowerCase() === title.toLowerCase())
            return wikidataIDs[id];
    }
    return null;
}

Osm.prototype.details = function (pageId) {
    if (pageId.idtype === "WP")
        return this._wikipediaDetails(pageId);
    else if (pageId.idtype === "OSM") {
        var details = {};
        details['title'] = pageId.name
        details['lat'] = pageId.lat;
        details['lon'] = pageId.lon;
        details['location'] = pageId.lat + "," + pageId.lon;
        details['extract'] = "";
        details['url'] = pageId.extratags.website !== undefined ? pageId.extratags.website : null;
        details['country'] = pageId.address.country;
        details['state'] = pageId.address.state;
        details['type'] = pageId.type;
        details['category'] = pageId.category;
        return details;
    }
}

Osm.prototype._wikipediaDetails = function (pageId) {
    // https://it.wikipedia.org/wiki/Speciale:ApiSandbox#action=query&format=json&formatversion=2&prop=coordinates%7Cdescription%7Cimages%7Cinfo%7Cextracts%7Cpageimages&pageids=1437252&utf8=1&inprop=url%7Cdisplaytitle&explaintext=1&exsectionformat=plain&coprop=type&piprop=original&pilimit=50&pilicense=any
    var url = this.getWikipediaUrl() + "/w/api.php?action=query&format=json&formatversion=2&prop=coordinates%7Cdescription%7Cimages%7Cinfo%7Cextracts%7Cpageimages&utf8=1&inprop=url%7Cdisplaytitle&exlimit=20&explaintext=1&exsectionformat=plain&coprop=type&piprop=original&pilimit=50&pilicense=any&pageids=" + pageId.wpPageId;
    printLog("details url: " + url.replace("/w/api.php?", "/wiki/Speciale:ApiSandbox#"));
    var result = http().get(url);
    var json = JSON.parse(result.body);
    if (json !== undefined && json.query !== undefined && json.query.pages !== undefined) {
        var page = json.query.pages[0];
        // printLog(page);
        var details = {};
        details['title'] = page.title
        details['lat'] = pageId.lat;
        details['lon'] = pageId.lon;
        details['location'] = pageId.lat + "," + pageId.lon;
        details['extract'] = page.extract;
        details['url'] = page.fullurl;
        details['country'] = pageId.address.country;
        details['state'] = pageId.address.state;
        details['type'] = pageId.type;
        details['category'] = pageId.category;
        if (page.coordinates !== undefined && page.coordinates[0] !== undefined) {
            details['wpType'] = page.coordinates[0].type;
        }
        if (page.images !== undefined && page.images.length > 0) {
            var imcontinue = json.continue !== undefined ? json.continue.imcontinue : undefined;
            do {
                var resultContinue = http().get(this.getWikipediaUrl() + "/w/api.php?action=query&format=json&formatversion=2&prop=coordinates%7Cdescription%7Cimages%7Cinfo%7Cextracts&utf8=1&inprop=url%7Cdisplaytitle&exlimit=20&explaintext=1&imlimit=50&exsectionformat=plain&pageids=" + pageId.wpPageId + "&imcontinue=" + encodeURIComponent(imcontinue));
                var jsonContinue = JSON.parse(resultContinue.body);
                if (jsonContinue !== undefined && jsonContinue.query !== undefined && jsonContinue.query.pages !== undefined) {
                    page.images = page.images.concat(jsonContinue.query.pages[0].images);
                    imcontinue = jsonContinue.continue !== undefined ? jsonContinue.continue.imcontinue : undefined;
                }
                else
                    imcontinue = undefined;
            }
            while (imcontinue != null || imcontinue != undefined);
            var imgTitles = [];
            var regex = new RegExp("\.[Jj][Pp][Ee]?[Gg]$");
            for (var index in page.images) {
                if (page.images[index] !== undefined) {
                    var title = page.images[index].title;
                    if (regex.test(title))
                        imgTitles.push(title);
                }
            }
            var images = this.getImages(imgTitles.join('|'));
            if (page.original !== undefined)
                images.unshift(page.original.source);
            details['images'] = images.join();
        }
        return details;
    }
    return {};
}

Osm.prototype.getImages = function (titles) {
    var result = http().get(this.getWikipediaUrl() + "/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=url&iiurlwidth=1280&iiurlheight=1280&titles=" + encodeURIComponent(titles));
    var json = JSON.parse(result.body);
    var images = [];
    if (json !== undefined && json.query !== undefined && json.query.pages !== undefined) {
        for (var index in json.query.pages) {
            var img = json.query.pages[index];
            if (img !== undefined && img.invalid === undefined) {
                images.push(img.imageinfo[0].thumburl);
            }
        }
    }
    return images;
}

Osm.prototype.getCountryOrState = function (country, state) {
    var lang = this.lang !== "en" ? this.lang + "," : "";
    var url = this.baseUrl + "/search/?format=jsonv2&accept-language=" + lang + "en&addressdetails=1&extratags=1&limit=1&country=" + encodeURIComponent(country);
    if (state !== undefined && state != null)
        url += "&state=" + encodeURIComponent(state);
    var result = http().get(url);
    var json = JSON.parse(result.body);
    var ids = {};
    var item = json[0];
    if (item.extratags !== undefined && item.extratags.wikidata !== undefined) {
        ids[item.extratags.wikidata] = {
            "idtype": "WP",
            "id": item.extratags.wikidata,
            "lat": item.lat,
            "lon": item.lon,
            "address": item.address,
            "type": item.type,
            "category": item.category
        };
        var wpResults = this._getWikipediaResults(ids);
        return this.details(wpResults[0].pageid);
    }
    return null;
}

Osm.prototype.getImagesFromWebpage = function (url) {
    // var result = http().get("https://daily.sevenfifty.com/regions/tuscany/");
    var result = http().get(url);
    // var reg = /src="\b(https?:\/\/\S+(?:png|jpe?g|gif)\S*)\b/igm;
    var reg = /src="\b(https?:\/\/\S+(?:jpe?g)\S*)\b/igm;
    var images = [];
    do {
        m = reg.exec(result.body);
        if (m) {
            images.push(m[1]);
        }
    } while (m);
    return images;
}
