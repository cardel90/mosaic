// temporary, DAG by pre- and post- requirements in the future
var aspectOrder = ['looking', 'herding', 'fromOthers', 'eating', 'grazing', 'wandering', 'walking'];

function loadAspect(cell, name) {
	var aspects = {
		'fromOthers': FromOthers,
		'herding': Herding,
		'grazing': Grazing,
		'wandering': Wandering,
		'eating': Eating,
		'walking': Walking,
		'looking': Looking
	};
	cell.aspects[name] = (new aspects[name](cell));
}

function FromOthers(cell) {
	this.cell = cell;
	this.vector = new Vector(0, 0);
	this.tab = [];
}

FromOthers.modifiedDistance = function(from, to) {
	return from.distance(to)-1.1*to.fat-from.fat - (to.color === 'red' ? 5 : 0);
}

FromOthers.prototype.prepare = function() {
	var x = 0;
	var y = 0;
	
	var tcell = this.cell;
	this.tab = this.cell.nearestCells(function(c){
		return c!==tcell && FromOthers.modifiedDistance(tcell, c)<15;
	});
	
	for(var i=0; i<this.tab.length; i++) {
		var c = this.tab[i];
		var d = FromOthers.modifiedDistance(tcell, c);
		var v = this.cell.vectorTo(c);
		x -= 1*v.x/(d*d);
		y -= 1*v.y/(d*d);
	}
	
	this.vector = new Vector(x, y);
}

FromOthers.prototype.perform = function() {
	this.cell.getAspect('walking').applyForce(this.vector);
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
	this.cell.getAspect('walking').applyForce(this.vector);
};

function Grazing(cell) {
	this.cell = cell;
}

Grazing.prototype.prepare = function() {
	this.target = this.findFood();
}

// return COST (less -> better)
Grazing.prototype.judgeFood = function(f) {
	var d = this.cell.position.distance(f.position) - (f.amount + this.cell.fat + 5);
	if(d<0)
		d = -100;
	return (d - 10*f.amount);
}

Grazing.prototype.findFood = function() {
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

Grazing.prototype.perform = function() {
	if(this.target === undefined)
		return;
	var d = this.target.position.distance(this.cell.position) - this.target.amount - this.cell.fat;
	if(d < 5) {		
		this.target.amount -= 0.1;
		this.cell.getAspect('eating').feed(0.1);
	}
	if(d>0) {
		var f = this.target.position.minus(this.cell.position).normalize();
		this.cell.getAspect('walking').applyForce(f);
	}
};

Grazing.prototype.draw = function(ctx) {
	ctx.beginPath();
	ctx.strokeStyle = 'green';
	if(this.target !== undefined) {
		ctx.moveTo(this.cell.position.x,this.cell.position.y);
		ctx.lineTo(this.target.position.x, this.target.position.y);
		ctx.stroke();
	}
}

Grazing.prototype.priority = function() {
	return this.target === undefined ? 0 : this.cell.getAspect('eating').hunger;
}

function Wandering(cell) {
	this.cell = cell;
	this.speed = new Vector(0, 0);
	this.target = Vector.random(25, 25, width-50, height-50);
}

Wandering.prototype.prepare = function() {
}

Wandering.prototype.perform = function() {
	if(Math.random()<0.001 || this.target.distance(this.cell.position)<10)
		this.target = Vector.random(25, 25, width-50, height-50);
	var desired = this.target.minus(this.cell.position).normalize();
	this.speed = this.speed.plus(desired.minus(this.speed).normalize().scale(0.01));
	this.cell.getAspect('walking').applyForce(this.speed.capLength(0.5));
};

Wandering.prototype.draw = function(ctx) {
	ctx.beginPath();
	ctx.strokeStyle = '#CCCCCC';
	ctx.moveTo(this.cell.position.x, this.cell.position.y);
	ctx.lineTo(this.target.x, this.target.y);
	ctx.stroke();
};

Wandering.prototype.priority = function() {
	return 1;
}

function Eating(cell) {
	this.cell = cell;
	this.fat = 15;
	this.hunger = 0;
}

Eating.prototype.perform = function() {	
	this.fat -= (Math.random()*0.02);
	
	if(this.fat < 10)
		this.hunger += (10-this.fat)/10;
	if(this.fat > 15)
		this.hunger = 0;
	
	// for legacy
	this.cell.fat = this.fat;
}

Eating.prototype.feed = function(amount) {
	this.fat += amount;
}

function Looking(cell) {
	this.cell = cell;
	this.angle = Math.PI*3/4;
	this.range = 100;
	this.seen = [];
}

function canvas_arrow(context, fromx, fromy, tox, toy){
    var headlen = 10;   // length of head in pixels
    var angle = Math.atan2(toy-fromy,tox-fromx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6));
    context.moveTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6));
}

Looking.prototype.draw = function(ctx) {
	return;
	ctx.beginPath();
	ctx.strokeStyle = 'black';
	/*
	var m1 = [[Math.cos(this.angle),-Math.sin(this.angle)], [Math.sin(this.angle),Math.cos(this.angle)]];
	var m2 = [[Math.cos(-this.angle),-Math.sin(-this.angle)], [Math.sin(-this.angle),Math.cos(-this.angle)]];
	var v = this.cell.velocity.normalize().scale(this.range);
	var v1 = v.mulMatrix(m1);
	var p1 = this.cell.position.plus(v1);
	var v2 = v.mulMatrix(m2);
	var p2 = this.cell.position.plus(v2);
	ctx.moveTo(this.cell.position.x, this.cell.position.y);
	ctx.lineTo(p1.x, p1.y);
	ctx.moveTo(this.cell.position.x, this.cell.position.y);
	ctx.lineTo(p2.x, p2.y);
	var a = v.angle();//Math.PI/4;
	ctx.arc(this.cell.position.x, this.cell.position.y, this.range, a-this.angle, a+this.angle);
	ctx.stroke();
	*/
	
	for(var i=0; i<this.seen.length; i++) {
		canvas_arrow(ctx, 
			this.cell.position.x, this.cell.position.y, this.seen[i].position.x, this.seen[i].position.y
		);
		ctx.stroke();
	}
}

Looking.prototype.perform = function() {
	var tcell = this.cell;
	var l = this;
	this.seen = tcell.nearestCells(function(c){
		return c.distance(tcell) < l.range && tcell.velocity.dot(c.position.minus(tcell.position)) > 0;
	});
}

function Walking(cell) {
	this.cell = cell;
	this.velocity = new Vector(0, 0);
	this.force = new Vector(0, 0);
	this.forceCount = 0;
}

Walking.prototype.applyForce = function(f) {
	this.force = this.force.plus(f);
	this.forceCount++;
}

Walking.prototype.prepare = function() {
	this.force = new Vector(0, 0);
	this.forceCount = 0;
	
}

Walking.prototype.perform = function() {
	var desired = new Vector(0, 0);
	
	if(this.forceCount > 0)
		desired = desired.plus(this.force.scale(2/this.forceCount));
	
	desired = desired.capLength(2);
	
	desired = desired.scale(0.6*(20-this.cell.fat)/20 + 0.7);
	if(this.cell.color === 'red')
		desired = desired.scale(2);
	this.velocity = this.velocity.plus(desired.minus(this.velocity).scale(0.1));
	
	// for legacy
	this.cell.velocity = this.velocity;
	this.cell.position = this.cell.position.plus(this.velocity);
}
