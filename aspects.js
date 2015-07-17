// temporary, DAG by pre- and post- requirements in the future
var aspectOrder = ['looking', 'eating', 'walking'];

function loadAspect(cell, name) {
	var aspects = {
		'eating': Eating,
		'walking': Walking,
		'looking': Looking
	};
	cell.aspects[name] = (new aspects[name](cell));
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
	
	
	for(var i=0; i<this.cell.behaviors.length; i++) {
		if(this.cell.behaviors[i].prepare)
			this.cell.behaviors[i].prepare();
	}
	
	for(var i=0; i<this.cell.needs.length; i++) {
		this.cell.needs[i].prepare();
	}
	
	var compare = function(a,b){
		return b.priority() - a.priority();
	}
	// perform biggest need
	this.cell.needs.sort(compare);
	desired = desired.plus(this.cell.needs[0].perform());
	
	// perform average of all behaviors
	var c = 0;
	var v = new Vector(0, 0);
	for(var i=0; i<this.cell.behaviors.length; i++) {
		var vect = this.cell.behaviors[i].perform();
		v = v.plus(vect);
		c++;
	}
	desired = desired.plus(v.scale(2/c));
	
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
