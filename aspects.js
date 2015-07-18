function topSort(tab) {
	var free = [];
	for(var i in tab) {
		if(tab[i].input == 0)
			free.push(tab[i]);
	}
	var result = [];
	while(free.length > 0) {
		var node = free[0];
		result.push(node);
		free.splice(0, 1);
		for(var i in node.edges) {
			var s = tab[node.edges[i]];
			s.input--;
			if(s.input == 0)
				free.push(s);
		}
	}
	return result;
}

function sortAspects(aspects) {
	var tab = [];
	for(var i=0; i<aspects.length; i++) {
		var node = {input:0, edges:[], aspect:aspects[i]};
		tab[aspects[i]] = node;
	}
	for(var i=0; i<aspects.length; i++) {
		var a = aspects[i];
		for(var j in a.pre) {
			var s = a.pre[j];
			tab[a].input++;
			tab[s].edges.push(a);
		}
		for(var j in a.post) {
			var s = a.post[j];
			tab[s].input++;
			tab[a].edges.push(s);
		}
	}
	var sorted = topSort(tab);
	var result = [];
	for(var i in sorted)
		result.push(sorted[i].aspect);
	return result;
}

Wandering.post = [Walking];
RunningAway.post = [Walking];
Grazing.post = [Walking];
Grazing.pre = [Eating];
FromOthers.post = [Walking];
FromWalls.post = [Walking];
FromWater.post = [Walking];
Herding.post = [Walking];
Mating.post = [Walking];
Hunting.pre = [Eating];
Hunting.post = [Walking];

function loadAspect(cell, aspect) {
	return new aspect(cell);
}

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
		if(d < 2*this.cell.getSize()) {
			v = v.plus(p.minus(w.position).scale(1/w.radius).scale(1/(d*d)));
		}
	}
	
	this.v = v;
};

FromWater.prototype.perform = function() {
	this.cell.getAspect(Walking).applyForce(this.v.scale(2));
};

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
		return;
	var f = this.cell.position.minus(this.hunter.position).normalize().scale(1.5);
	this.cell.getAspect(Walking).applyForce(f);
};

RunningAway.prototype.draw = function(ctx) {
	if(this.hunter) {
		ctx.beginPath();
		ctx.strokeStyle = 'yellow';
		ctx.moveTo(this.cell.position.x, this.cell.position.y);
		ctx.lineTo(this.hunter.position.x, this.hunter.position.y);
		ctx.stroke();
	}
};

RunningAway.prototype.priority = function() {
	return this.hunter === undefined ? 0 : 100;
}

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
		return;
	var d = this.prey.position.distance(this.cell.position) - this.prey.getSize() - this.cell.getSize();
	if(d < 5) {
		this.cell.getAspect(Eating).feed(this.prey.getAspect(Eating).fat);
		// should this be in eating?
		this.prey.getAspect(Eating).fat = 0;
		return;
	}
		
	var f = this.prey.position.minus(this.cell.position).normalize().scale(2);
	this.cell.getAspect(Walking).applyForce(f);
};

Hunting.prototype.draw = function(ctx) {
	if(this.prey) {
		ctx.beginPath();
		ctx.strokeStyle = '#FF0000';
		ctx.moveTo(this.cell.position.x, this.cell.position.y);
		ctx.lineTo(this.prey.position.x, this.prey.position.y);
		ctx.stroke();
	}
};

Hunting.prototype.priority = function() {
	return this.prey === undefined ? 0 : this.cell.getAspect(Eating).hunger - this.prey.distance(this.cell)/100;
}

Hunting.prototype.report = function() {
	return [this.priority()];
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
	}
		
	var f = this.mate.position.minus(this.cell.position).normalize();
	this.cell.getAspect(Walking).applyForce(f);
};

Mating.prototype.draw = function(ctx) {
	if(this.mate) {
		ctx.beginPath();
		ctx.strokeStyle = '#FF77DD';
		ctx.moveTo(this.cell.position.x, this.cell.position.y);
		ctx.lineTo(this.mate.position.x, this.mate.position.y);
		ctx.stroke();
	}
};

Mating.prototype.priority = function() {
	if(this.cell.gender == 0)
		return 0;
	return this.mate === undefined ? 0 : this.horny;
}

Mating.prototype.report = function() {
	return [this.cell.gender, this.horny];
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
	this.cell.getAspect(Walking).applyForce(this.v.scale(5));
};

function FromOthers(cell) {
	this.cell = cell;
	this.vector = new Vector(0, 0);
	this.tab = [];
}

FromOthers.modifiedDistance = function(from, to) {
	var d = from.distance(to)-1.1*to.getSize()-from.getSize();
	return d<=0 ? 0.001 : d;
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
	this.cell.getAspect(Walking).applyForce(this.vector);
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
	this.cell.getAspect(Walking).applyForce(this.vector);
};

function Grazing(cell) {
	this.cell = cell;
}

Grazing.prototype.prepare = function() {
	this.target = this.findFood();
}

// return COST (less -> better)
Grazing.prototype.judgeFood = function(f) {
	var d = this.cell.position.distance(f.position) - (f.amount + this.cell.getSize() + 5);
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
	var d = this.target.position.distance(this.cell.position) - this.target.amount - this.cell.getSize();
	if(d < 5) {		
		this.target.amount -= 0.1;
		this.cell.getAspect(Eating).feed(0.1);
	}
	if(d>0) {
		var f = this.target.position.minus(this.cell.position).normalize().scale(1.5);
		this.cell.getAspect(Walking).applyForce(f);
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
	return this.target === undefined ? 0 : this.cell.getAspect(Eating).hunger - this.target.position.distance(this.cell.position)/100;
}

Grazing.prototype.report = function() {
	return [this.priority()];
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
	this.cell.getAspect(Walking).applyForce(this.speed.capLength(0.5));
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

function Eating(cell) {
	this.cell = cell;
	this.fat = 10;
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

Eating.prototype.report = function() {
	return [this.fat, this.hunger];
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

Looking.prototype.report = function() {
	return [this.seen.length];
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
	
	desired = desired.scale(0.6*(20-this.cell.getSize())/20 + 0.7);
	this.velocity = this.velocity.plus(desired.minus(this.velocity).scale(0.3));
	
	// for legacy
	this.cell.velocity = this.velocity;
	this.cell.position = this.cell.position.plus(this.velocity);
}


Walking.prototype.report = function() {
	return [this.forceCount];
}
