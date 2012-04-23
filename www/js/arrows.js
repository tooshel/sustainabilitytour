var setArrows;


function ArrowHandler() {
    this.setMap(cm_map);
    // Markers with 'head' arrows must be stored
    this.arrowheads = [];
}
// Extends OverlayView from the Maps API
ArrowHandler.prototype = new google.maps.OverlayView();

// Draw is inter alia called on zoom change events.
// So we can use the draw method as zoom change listener
ArrowHandler.prototype.draw = function() {
    
    if (this.arrowheads.length > 0) {
        for (var i = 0, m; m = this.arrowheads[i]; i++) {
            m.setOptions({ position: this.usePixelOffset(m.p1, m.p2) });
        }
    }
};


// Computes the length of a polyline in pixels
// to adjust the position of the 'head' arrow
ArrowHandler.prototype.usePixelOffset = function(p1, p2) {
    
    var proj = this.getProjection();
    var g = google.maps;
    var dist = 12; // Half size of triangle icon
    
    var pix1 = proj.fromLatLngToContainerPixel(p1);
    var pix2 = proj.fromLatLngToContainerPixel(p2);
    var vector = new g.Point(pix2.x - pix1.x, pix2.y - pix1.y);
    var length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    var normal = new g.Point(vector.x/length, vector.y/length);
    var offset = new g.Point(pix2.x - dist * normal.x, pix2.y - dist * normal.y);
    
    return proj.fromContainerPixelToLatLng(offset);
};


// Returns the triangle icon object
ArrowHandler.prototype.addIcon = function(file) {
    //console.log(file);
    var g = google.maps;
    var icon = new g.MarkerImage("http://www.google.com/mapfiles/" + file,
                                 new g.Size(24, 24), null, new g.Point(6, 6), new g.Size(12, 12));
    return icon;
};

// Creates markers with corresponding triangle icons
ArrowHandler.prototype.create = function(p1, p2, mode) {
    var markerpos;
    var g = google.maps;
    if (mode == "onset") markerpos = p1;
    else if (mode == "head") markerpos = this.usePixelOffset(p1, p2);
    else if (mode == "midline") markerpos = g.geometry.spherical.interpolate(p1, p2, .5);
    
    // Compute the bearing of the line in degrees
    var dir = g.geometry.spherical.computeHeading(p1, p2).toFixed(1);
    // round it to a multiple of 3 and correct unusable numbers
    dir = Math.round(dir/3) * 3;
    if (dir < 0) dir += 240;
    if (dir > 117) dir -= 120;
    // use the corresponding icon
    var icon = this.addIcon("dir_" +dir+ ".png");
    var marker = new g.Marker({position: markerpos,
                              map: cm_map, icon: icon, clickable: false
                              });
    if (mode == "head") {
        // Store markers with 'head' arrows to adjust their offset position on zoom change
        marker.p1 = p1;
        marker.p2 = p2;
        // marker.setValues({ p1: p1, p2: p2 });
        this.arrowheads.push(marker);
    }
};

ArrowHandler.prototype.load = function (points, mode) {
    for (var i = 0; i < points.length-1; i++) {
        var p1 = points[i],
        p2 = points[i + 1];
        this.create(p1, p2, mode); 
    }
};


// Draws a polyline with accordant arrow heads
function createPoly(path, mode) {
    var poly = new google.maps.Polyline({
                                        strokeColor: "#FFFF00",
                                        strokeOpacity: 1.0,
                                        strokeWeight: 10,
                                        map: cm_map,
                                        path: path });
    
    setArrows.load(path, mode);
    return poly;
}


