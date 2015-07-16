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

function makePredator(position) {
	var ncell = new Cell(position, 'red');
	ncell.behaviors = [new FromWater(ncell), new FromWalls(ncell)];
	ncell.needs = [new Hunting(ncell), new Wandering(ncell)];
	ncell.cells = cells;
	ncell.fat = 10;
	cells.push(ncell);
}

function makeHerbivore(position) {
	var color = colors[Math.floor(Math.random()*colors.length)];
	var ncell = new Cell(Vector.random(25, 25, width-50, height-50), color);
	ncell.behaviors = [new Herding(ncell), new FromOthers(ncell), new FromWater(ncell), new FromWalls(ncell)];
	ncell.needs = [new Feeding(ncell), new Mating(ncell), new Wandering(ncell)];
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

var Cell = function(pos, color){
	this.position = pos;
	this.velocity = new Vector(0, 0);
	this.fat = 15;
	this.color = color;
	this.gender = Math.random()<0.1 ? 1 : 0;
	this.aspects = [];
	loadAspect(this, 'looking');
	loadAspect(this, 'walking');
}

Cell.prototype.makeChild = function(position) {
	var ncell = new Cell(this.position, this.color);
	// TODO: deep clone of parent
	ncell.behaviors = [new Herding(ncell), new FromOthers(ncell), new FromWater(ncell), new FromWalls(ncell)];
	ncell.needs = [new Feeding(ncell), new Mating(ncell), new Wandering(ncell)];
	ncell.cells = cells;
	ncell.fat = 7;
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

Cell.prototype.draw = function(ctx) {
	ctx.strokeStyle = 'black';
	ctx.fillStyle = this.color;
	ctx.beginPath();
	ctx.arc(this.position.x, this.position.y, this.fat, 0, 2*Math.PI);
	ctx.stroke();
	ctx.fill();
	ctx.closePath();
	
	for(var i=0; i<this.behaviors.length; i++) {
		var b = this.behaviors[i];
		if(b.draw)
			b.draw(ctx);
	}
	
	if(this.needs[0].draw)
		this.needs[0].draw(ctx);
	
	for(var i=0; i<this.aspects.length; i++) {
		if(this.aspects[i].draw)
			this.aspects[i].draw(ctx);
	}
}

Cell.prototype.sim = function() {

	this.fat -= (Math.random()*0.02);

	for(var a in this.aspects) {
		if(this.aspects[a].prepare)
			this.aspects[a].prepare();
	}
	
	for(var a in this.aspects) {
		if(this.aspects[a].perform)
			this.aspects[a].perform();
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
		makeHerbivore(Vector.random(25, 25, width-50, height-50));
	}
	//makePredator(Vector.random(25, 25, width-50, height-50));
	//makePredator(Vector.random(25, 25, width-50, height-50));
	
	$('#play').click(play);
	$('#plants').change(plants);
	$('#speed').change(changeSpeed);

	changeSpeed();
	plants();
	update();
	
	play();
})
