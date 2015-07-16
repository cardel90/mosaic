
function Feeding(cell) {
	this.cell = cell;
	this.hunger = 0;
}

Feeding.prototype.prepare = function() {
	if(this.cell.fat < 10)
		this.hunger += (10-this.cell.fat)/10;
	if(this.cell.fat > 15)
		this.hunger = 0;
	this.target = this.findFood();
}

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

Feeding.prototype.perform = function() {
	if(this.target === undefined)
		return new Vector(0, 0);
	var d = this.target.position.distance(this.cell.position) - this.target.amount - this.cell.fat;
	if(d < 5) {		
		this.target.amount -= 0.1;
		this.cell.fat += 0.1;
	}
	if(d<0)
		return new Vector(0, 0);
	return this.target.position.minus(this.cell.position).normalize();
};

Feeding.prototype.draw = function(ctx) {
	ctx.beginPath();
	ctx.strokeStyle = 'green';
	if(this.target !== undefined) {
		ctx.moveTo(this.cell.position.x,this.cell.position.y);
		ctx.lineTo(this.target.position.x, this.target.position.y);
		ctx.stroke();
	}
}

Feeding.prototype.priority = function() {
	return this.target === undefined ? 0 : this.hunger;
}


function Wandering(cell) {
	this.cell = cell;
	this.speed = new Vector(0, 0);
	this.target = Vector.random(25, 25, width-50, height-50);
}

Wandering.prototype.prepare = function() {
	if(Math.random()<0.001 || this.target.distance(this.cell.position)<10)
		this.target = Vector.random(25, 25, width-50, height-50);
	var desired = this.target.minus(this.cell.position).normalize();
	this.speed = this.speed.plus(desired.minus(this.speed).normalize().scale(0.01));
}

Wandering.prototype.perform = function() {
	return this.speed.capLength(0.5);
};

Wandering.prototype.draw = function(ctx) {
	return;
	ctx.beginPath();
	ctx.strokeStyle = '#CCCCCC';
	ctx.moveTo(this.cell.position.x, this.cell.position.y);
	ctx.lineTo(this.target.x, this.target.y);
	ctx.stroke();
};

Wandering.prototype.priority = function() {
	return 1;
}

function Mating(cell) {
	this.cell = cell;
	this.horny = 0;
}

Mating.prototype.findMate = function() {
	var tcell = this.cell;
	var tab = this.cell.nearestCells(function(c){return c.gender != tcell.gender;});
	if(tab.length > 0)
		return tab[0];
}

Mating.prototype.prepare = function() {
	if(this.cell.gender == 0)
		return;
	this.horny += Math.random()*0.01;
	this.mate = this.findMate();
}

Mating.prototype.perform = function() {
	if(this.mate !== undefined && this.mate.position.distance(this.cell.position) < 30) {
		
		this.cell.makeChild(this.cell.position.plus(this.mate.position).scale(0.5));
		
		this.horny = -1;
		return new Vector(0, 0);
	}
		
	return this.mate.position.minus(this.cell.position).normalize();
};

Mating.prototype.draw = function(ctx) {
	ctx.beginPath();
	ctx.strokeStyle = '#FF77DD';
	ctx.moveTo(this.cell.position.x, this.cell.position.y);
	ctx.lineTo(this.mate.position.x, this.mate.position.y);
	ctx.stroke();
};

Mating.prototype.priority = function() {
	if(this.cell.gender == 0)
		return 0;
	return this.mate === undefined ? 0 : this.horny;
}



function Hunting(cell) {
	this.cell = cell;
	this.hunger = 0;
}

Hunting.prototype.findPrey = function() {
	var tcell = this.cell;
	var tab = this.cell.nearestCells(function(c){return c.color != tcell.color;});
	if(tab.length > 0)
		return tab[0];
}

Hunting.prototype.prepare = function() {
	if(this.cell.fat < 10)
		this.hunger += (10-this.cell.fat)/10;
	if(this.cell.fat > 15)
		this.hunger = 0;
	this.prey = this.findPrey();
}

Hunting.prototype.perform = function() {
	if(this.prey === undefined)
		return new Vector(0, 0);
	var d = this.prey.position.distance(this.cell.position) - this.prey.fat - this.cell.fat;
	if(d < 5) {		
		this.cell.fat += this.prey.fat;
		this.prey.fat = 0;
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
	return this.prey === undefined ? 0 : this.hunger;
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
