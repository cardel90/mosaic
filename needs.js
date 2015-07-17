
function Hunting(cell) {
	this.cell = cell;
}

Hunting.prototype.findPrey = function() {
	var tcell = this.cell;
	var tab = this.cell.nearestCells(function(c){return c.color != tcell.color;});
	if(tab.length > 0)
		return tab[0];
}

Hunting.prototype.prepare = function() {
	this.prey = this.findPrey();
}

Hunting.prototype.perform = function() {
	if(this.prey === undefined)
		return new Vector(0, 0);
	var d = this.prey.position.distance(this.cell.position) - this.prey.fat - this.cell.fat;
	if(d < 5) {
		this.cell.getAspect('eating').feed(this.prey.fat);
		// should this be in eating?
		this.prey.getAspect('eating').fat = 0;
		return new Vector(0, 0);
	}
		
	return this.prey.position.minus(this.cell.position).normalize();
};

Hunting.prototype.draw = function(ctx) {
	ctx.beginPath();
	ctx.strokeStyle = '#FF0000';
	ctx.moveTo(this.cell.position.x, this.cell.position.y);
	ctx.lineTo(this.prey.position.x, this.prey.position.y);
	ctx.stroke();
};

Hunting.prototype.priority = function() {
	return this.prey === undefined ? 0 : this.cell.getAspect('eating').hunger;
}

/*
// return COST (less -> better)
Feeding.prototype.judgeFood = function(f) {
	var d = this.cell.position.distance(f.position) - (f.amount + this.cell.fat + 5);
	if(d<0)
		d = -100;
	return (d - 10*f.amount);
}

Feeding.prototype.findFood = function() {
	if(food.length == 0)
		return undefined;
	var best = food[0];
	var value = this.judgeFood(food[0]);
	for(var i=0; i<food.length; i++) {
		var f = food[i];
		var j = this.judgeFood(f);
		if(j<value) {
			best = f;
			value = j;
		}
	}
	return best;
}
*/


function RunningAway(cell) {
	this.cell = cell;
}

RunningAway.prototype.prepare = function() {
	this.hunter = undefined;
	var tcell = this.cell;
	var tab = this.cell.nearestCells(function(c){return c.color==='red' && c.distance(tcell)<200;});
	var n = tab.length;
	for(var i=0; i<n; i++) {
		var c = tab[i];
		if(c.velocity.length() > 1 && 
			c.velocity.dotReduced(tcell.position.minus(c.position)) > 0.5) {
			this.hunter = c;
			break;
		}
	}
}

RunningAway.prototype.perform = function() {
	if(this.hunter === undefined)
		return new Vector(0, 0);
	return this.cell.position.minus(this.hunter.position).normalize();
};

RunningAway.prototype.draw = function(ctx) {
	ctx.beginPath();
	ctx.strokeStyle = 'yellow';
	ctx.moveTo(this.cell.position.x, this.cell.position.y);
	ctx.lineTo(this.hunter.position.x, this.hunter.position.y);
	ctx.stroke();
};

RunningAway.prototype.priority = function() {
	return this.hunter === undefined ? 0 : 10;
}
