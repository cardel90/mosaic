var width;
var height;
var cells = [];
var food = [];
var score = 0;

function Species(name, colors, aspectTypes, aspectArguments, ancestor) {
	this.name = name;
	this.colors = colors;
	this.aspectTypes = sortAspects(aspectTypes);
	this.aspectArguments = aspectArguments;
	this.ancestor = ancestor;
	this.children = [];
	if(ancestor)
		ancestor.children.push(this);
}

Species.prototype.makeCell = function(position) {
	score++;
	var color = this.colors[Math.floor(Math.random()*this.colors.length)];
	var ncell = new Cell(position, color, this.aspectTypes, this.aspectArguments);
	ncell.species = this;
	cells.push(ncell);
	return ncell;
}

var deer = new Species('Sarna', ['yellow', 'blue'], [Looking, RunningAway, FromWalls, Mating, Walking, Herding, FromOthers, Eating, Grazing, Wandering], {Herding: {strength: 2}});
var bear = new Species('Niedźwiedź', ['teal'], [Looking, FromWalls, Walking, Eating, Grazing, Hunting, Wandering], {}, deer);
var wolf = new Species('Wilk', ['red'], [Looking, Walking, Eating, Hunting, Wandering], {}, bear);
var sparrow = new Species('Wróbel', ['brown'], [Walking, Looking, RunningAway, FromWalls, Mating, Herding, FromOthers, Eating, Grazing, Wandering], {Walking: {topSpeed: 10, agility: 0.6}, Herding:{strength: 0.1}}, bear);
var species = [wolf, deer, bear, sparrow];
var root = deer;

function Food(position, amount) {
	this.position = position;
	this.amount = amount;
}

Food.prototype.draw = function(ctx) {
	ctx.strokeStyle = 'black';
	ctx.fillStyle = '#66CC33';
	ctx.beginPath();
	ctx.arc(this.position.x, this.position.y, this.amount, 0, 2*Math.PI);
	ctx.stroke();
	ctx.fill();
}

var Cell = function(pos, color, aspectTypes, aspectArguments){
	this.position = pos;
	this.velocity = new Vector(0, 0);
	this.color = color;
	this.gender = Math.random()<0.5 ? 1 : 0;
	this.aspectTypes = aspectTypes;
	this.aspects = {};
	this.aspectList = [];
	for(var i=0; i<this.aspectTypes.length; i++) {
		var aspect = loadAspect(this, this.aspectTypes[i], aspectArguments[this.aspectTypes[i].name]);
		this.aspects[this.aspectTypes[i].name] = aspect;
		this.aspectList.push(aspect);
	}
}

Cell.prototype.getSize = function() {
	return this.getAspect(Eating).fat;
}

Cell.prototype.makeChild = function(position) {
	var ncell = this.species.makeCell(this.position.plus(new Vector(20, 20)));
	ncell.getAspect(Eating).fat = this.getAspect(Eating).fat/2;
}

Cell.prototype.vectorTo = function(other) {
	return other.position.minus(this.position);
}

Cell.prototype.distance = function(other) {
	return other.position.minus(this.position).length();
}

Cell.prototype.nearestCells = function(maxDistance) {
	var tcell = this;
	var result = _.filter(cells, function(c){
		return c.position.distance(tcell.position) <= maxDistance;
	});
	
	//var comparator = function(a, b){ return a.distance(tcell) - b.distance(tcell); };
	//result.sort(comparator);
	return result;
}

Cell.prototype.getAspect = function(a) {
	return this.aspects[a.name];
}

Cell.prototype.hasAspect = function(a) {
	return (a.name in this.aspects);
}

Cell.prototype.sim = function() {

	for(var i=0; i<this.aspectList.length; i++) {
		var a = this.aspectList[i];
		if(a.prepare)
			a.prepare();
	}

	// find top priority
	this.top = undefined;
	var max = -1;
	
	for(var i=0; i<this.aspectList.length; i++) {
		var a = this.aspectList[i];
		if(a.priority) {
			var p = a.priority();
			if(p>max) {
				max = p;
				this.top = a;
			}
		}
	}
	
	// perform aspects with no priority and the top one
	for(var i=0; i<this.aspectList.length; i++) {
		var a = this.aspectList[i];
		if(a.perform) {
			if(!a.priority || a===this.top) {
				a.perform();
			}
		}
	}
}

function update() {

	if(food.length<config.get('plant-growth'))
		food.push(new Food(Vector.random(25, 25, width-50, height-50), Math.random()*10+1));
	if(food.length>config.get('plant-growth'))
		food.splice(0,1);
	if(cells.length>config.get('max-cells'))
		cells.splice(cells.length-1);

	for(var i=cells.length-1; i>=0; i--) {
		var cell = cells[i];
		cell.sim();
		
		if(cell.getAspect(Eating).fat <= 2)
			cells.splice(i, 1);
	}
	
	for(var i=food.length-1; i>=0; i--) {
		if(food[i].amount < 0.2) {
			food.splice(i, 1);
		}
	}
	
	repaint();
}

$(function(){
	width = $('canvas').get(0).width;
	height = $('canvas').get(0).height;

	for(var i=0; i<30; i++) {
		species[1].makeCell(Vector.random(25, 25, width-50, height-50));
	}
	
	species[0].makeCell(Vector.random(25, 25, width-50, height-50));
	species[0].makeCell(Vector.random(25, 25, width-50, height-50));

	initGui();
	
	update();
})
