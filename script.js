var width;
var height;
var cells = [];
var colors = ['yellow', 'blue'];
var food = [];
var growth = 0.5;
var speed = 20;
var waters = [];
var currentCanvas = 0;
var canvases = [];
var interval;

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

function Species(name, colors, aspectTypes) {
	this.name = name;
	this.colors = colors;
	this.aspectTypes = sortAspects(aspectTypes);
}

Species.prototype.makeCell = function(position) {
	var color = this.colors[Math.floor(Math.random()*this.colors.length)];
	var ncell = new Cell(position, color, this.aspectTypes);
	ncell.species = this.species;
	ncell.cells = cells;
	cells.push(ncell);
}

var predator = new Species('Wilk', ['red'],	[Looking, Walking, Eating, Hunting, Wandering]);
var herbivore = new Species('Sarna', ['yellow', 'blue'], [Looking, RunningAway, FromWalls, Mating, Walking, Herding, FromOthers, Eating, Grazing, Wandering]);

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
	this.aspectTypes = aspectTypes;
	this.aspects = {};
	this.aspectList = [];
	for(var i=0; i<this.aspectTypes.length; i++) {
		var aspect = loadAspect(this, this.aspectTypes[i]);
		this.aspects[this.aspectTypes[i].name] = aspect;
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
	return this.aspects[a.name];
}

Cell.prototype.draw = function(ctx) {
	ctx.strokeStyle = 'black';
	ctx.fillStyle = this.color;
	ctx.beginPath();
	ctx.arc(this.position.x, this.position.y, this.getSize(), 0, 2*Math.PI);
	ctx.stroke();
	ctx.fill();
	ctx.closePath();
	
	for(var i=0; i<this.aspectList.length; i++) {
		var a = this.aspectList[i];
		if(a.draw)
			a.draw(ctx);
	}
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

function repaint() {
	var ctx = canvases[currentCanvas].getContext("2d");
	
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0,0,width,height);
	
	for(var i=waters.length-1; i>=0; i--) {
		waters[i].draw(ctx);
	}
	
	for(var i=food.length-1; i>=0; i--) {
		food[i].draw(ctx);
	}
	for(var i=cells.length-1; i>=0; i--) {
		cells[i].draw(ctx);
	}
	
	canvases[currentCanvas].style.visibility = 'visible';
	currentCanvas = 1-currentCanvas;
	canvases[currentCanvas].style.visibility = 'hidden';
}

function play() {
	if(interval === undefined) {
		$('#play').text('Stop');
		interval = setInterval(update, speed);
	} else {
		clearInterval(interval);
		interval = undefined;
		$('#play').text('Play');
	}
}

function changeSpeed() {
	var v = $('#speed').val();
	speed = 100-v;
	if(interval !== undefined) {
		play();
		play();
	}
}

function plants() {
	var v = $('#plants').val();
	growth = v;
}

$(function(){
	width = $('canvas').get(0).width;
	height = $('canvas').get(0).height;
	canvases[0] = $('canvas').get(0);
	canvases[1] = $('canvas').get(1);
	
	// waters[0] = new Water(new Vector(500, 300), 100);
	
	for(var i=0; i<30; i++) {
		herbivore.makeCell(Vector.random(25, 25, width-50, height-50));
	}
	predator.makeCell(Vector.random(25, 25, width-50, height-50));	
	predator.makeCell(Vector.random(25, 25, width-50, height-50));
	
	$('#play').click(play);
	$('#plants').change(plants);
	$('#speed').change(changeSpeed);

	changeSpeed();
	plants();
	update();
	
	play();
})
