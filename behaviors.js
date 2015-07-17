
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
