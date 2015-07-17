
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
