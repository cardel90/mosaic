
function FromWalls(cell) {
	this.cell = cell;
	this.v = new Vector(0, 0);
}

FromWalls.prototype.prepare = function() {
	var v = this.cell.position;
	var x = 0;
	var y = 0;
	if(v.x > width-10)
		x += -1;
	if(v.y > height-10)
		y += -1;
	if(v.x < 10)
		x += 1;
	if(v.y < 10)
		y += 1;
	this.v = new Vector(x, y);
};

FromWalls.prototype.perform = function() {
	return this.v.scale(5);
};


function FromWater(cell) {
	this.cell = cell;
	this.v = new Vector(0, 0);
}

FromWater.prototype.prepare = function() {
	var p = this.cell.position;
	var v = new Vector(0, 0);
	
	for(var i=0; i<waters.length; i++) {
		var w = waters[i];
		var d = w.position.distance(p) - w.radius;
		if(d < 2*this.cell.fat) {
			v = v.plus(p.minus(w.position).scale(1/w.radius).scale(1/(d*d)));
		}
	}
	
	this.v = v;
};

FromWater.prototype.perform = function() {
	return this.v.scale(2);
};
