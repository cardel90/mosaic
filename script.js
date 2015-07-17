var width;
var height;
var cells = [];
var colors = ['yellow', 'blue'];
var food = [];
var growth = 0.5;
var waters = [];

function Water(position, radius) {
	this.position = position;
	this.radius = radius;
}

Water.prototype.draw = function(ctx) {
	ctx.strokeStyle = 'black';
	ctx.fillStyle = 'navy';
	ctx.beginPath();
	ctx.arc(this.position.x, this.position.y, this.radius, 0, 2*Math.PI);
	ctx.stroke();
	ctx.fill();
}

function makePredator(position) {
	var ncell = new Cell(position, 'red', 
		[Walking, Eating, Hunting, Wandering]);
	ncell.cells = cells;
	cells.push(ncell);
}

function makeHerbivore(position) {
	var color = colors[Math.floor(Math.random()*colors.length)];
	var ncell = new Cell(Vector.random(25, 25, width-50, height-50), color, 
		[Mating, Walking, Herding, FromOthers, Eating, Grazing, Wandering]);
	ncell.cells = cells;
	cells.push(ncell);
}

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

var Cell = function(pos, color, aspectTypes){
	this.position = pos;
	this.velocity = new Vector(0, 0);
	this.color = color;
	this.gender = Math.random()<0.1 ? 1 : 0;
	this.fat = 10;
	this.aspectTypes = sortAspects(aspectTypes);
	this.aspects = {};
	this.aspectList = [];
	for(var i=0; i<this.aspectTypes.length; i++) {
		var aspect = loadAspect(this, this.aspectTypes[i]);
		this.aspects[this.aspectTypes[i]] = aspect;
		this.aspectList.push(aspect);
	}
}

Cell.prototype.getSize = function() {
	return this.fat;
}

Cell.prototype.makeChild = function(position) {
	var ncell = new Cell(this.position.plus(new Vector(20, 20)), this.color, this.aspectTypes);
	ncell.cells = cells;
	cells.push(ncell);
	ncell.sim();
}

Cell.prototype.vectorTo = function(other) {
	return other.position.minus(this.position);
}

Cell.prototype.distance = function(other) {
	return other.position.minus(this.position).length();
}

Cell.prototype.nearestCells = function(condition) {
	var result = this.cells.slice(0).filter(condition);
	var tcell = this;
	var comparator = function(a, b){ return a.distance(tcell) - b.distance(tcell); };
	result.sort(comparator);
	return result;
}

Cell.prototype.getAspect = function(a) {
	return this.aspects[a];
}

Cell.prototype.sim = function() {

	for(var i=0; i<this.aspectList.length; i++) {
		var a = this.aspectList[i];
		if(a.prepare)
			a.prepare();
	}

	// find top priority
	var top = undefined;
	var max = -1;
	
	for(var i=0; i<this.aspectList.length; i++) {
		var a = this.aspectList[i];
		if(a.priority) {
			var p = a.priority();
			if(p>max) {
				max = p;
				top = a;
			}
		}
	}
	
	// perform aspects with no priority and the top one
	for(var i=0; i<this.aspectList.length; i++) {
		var a = this.aspectList[i];
		if(a.perform) {
			if(!a.priority || a===top) {
				a.perform();
			}
		}
	}
}

function update() {

	if(cells.length > 1000 || food.length > 10000)
		return;

	if(food.length<growth)
		food.push(new Food(Vector.random(25, 25, width-50, height-50), Math.random()*10+1));
	if(food.length>growth)
		food.splice(0,1);

	for(var i=cells.length-1; i>=0; i--) {
		var cell = cells[i];
		cell.sim();
		
		if(cell.fat <= 1)
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
		makeHerbivore(Vector.random(25, 25, width-50, height-50));
	}
//	makePredator(Vector.random(25, 25, width-50, height-50));
//	makePredator(Vector.random(25, 25, width-50, height-50));
	
	initGui();
	
	update();
	play();
})
