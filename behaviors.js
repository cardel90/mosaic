
function Herding(cell) {
	this.cell = cell;
	this.vector = new Vector(0, 0);
}

Herding.prototype.prepare = function() {
	var vel = new Vector(0, 0);
	var loc = new Vector(0, 0);
	
	var tcell = this.cell;
	var tab = this.cell.nearestCells(function(c){return c.color===tcell.color && c.distance(tcell)<100;});
	var n = tab.length;
	for(var i=0; i<n; i++) {
		var c = tab[i];
		vel = vel.plus(c.velocity);
		loc = loc.plus(c.position);
	}
	
	var toLoc = loc.scale(1/n).minus(tcell.position).normalize();
	
	this.vector = vel.scale(1/n).plus(toLoc);
};

Herding.prototype.perform = function() {
	return this.vector;
};

function FromOthers(cell) {
	this.cell = cell;
	this.vector = new Vector(0, 0);
	this.tab = [];
}

FromOthers.prototype.prepare = function() {
	var x = 0;
	var y = 0;
	
	var tcell = this.cell;
	this.tab = this.cell.nearestCells(function(c){
		return c!==tcell && c.distance(tcell)<(1.1*c.fat+tcell.fat+15);
	});
	
	for(var i=0; i<this.tab.length; i++) {
		var c = this.tab[i];
		var d = this.cell.distance(c)-1.1*c.fat-tcell.fat;
		var v = this.cell.vectorTo(c);
		x -= 1*v.x/(d*d);
		y -= 1*v.y/(d*d);
	}
	
	this.vector = new Vector(x, y);
}

FromOthers.prototype.perform = function() {
	return this.vector;
};

FromOthers.prototype.draw = function(ctx) {
	return;
	ctx.strokeStyle = '#FFCCCC';
	for(var i=0; i<this.tab.length; i++) {
		ctx.moveTo(this.cell.position.x, this.cell.position.y);
		ctx.lineTo(this.tab[i].position.x, this.tab[i].position.y);
		ctx.stroke();
	}
}

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
	return this.v.scale(2);
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