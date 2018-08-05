function KmlExporter() {

}

KmlExporter.prototype.export = function (trip, savePath) {
  var places = this._convertTrip(trip);
  var name = trip.field("Nome");
  var filename = savePath + name + ".kml";

  var xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
            " <kml xmlns=\"http://www.opengis.net/kml/2.2\">\n" +
            "   <Document>\n" +
            "     <name>"+name+"</name>\n";
  for(var i in places){
    var place = places[i];
    xml +=  "     <Placemark>\n" +
            "       <name>" + place.name + "</name>\n" +
            "       <description><![CDATA[" + place.description + "]]></description>\n" +
            "       <Point>\n" +
            "         <coordinates>" + place.coords + ",0</coordinates>\n" +
            "       </Point>\n" +
            "     </Placemark>\n";
  }
  xml +=    "   </Document>\n" +
            " </kml>";

  var f = file(filename);
  f.write(xml);
  f.close();
};

KmlExporter.prototype._convertTrip = function (trip) {
  var lib = libByName("Tappe");
  var tappe = lib.linksTo(trip);
  var items = [];
  for(var i in tappe) {
    items = items.concat(this._convertTappa(tappe[i]));
  }
  return items;
};

KmlExporter.prototype._convertTappa = function (tappa) {
  var places = tappa.field("Luoghi");
  var objects = [];
  for (var i in places){
    var place = places[i];
    var obj = {};
    obj.name = place.field("Tipo")=="Attrazione" ? place.field("Attrazione") : place.field("Ristorante/Hotel");
    obj.coords = place.field("Posizione").lng + "," + place.field("Posizione").lat;
    obj.description = place.field("Descrizione");
    objects.push(obj);
  }
  return objects;
};
