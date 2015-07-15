var width;
var height;
var cells = [];
var colors = ['yellow'];//, 'green', 'yellow', 'blue'];
var food = [];
var waters = [];
var currentCanvas = 0;
var canvases = [];

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
	this.behaviors = [new Herding(this), new FromOthers(this), new FromWater(this), new FromWalls(this)];
	this.needs = [new RunningAway(this), new Mating(this), new Feeding(this), new Wandering(this)];
	this.gender = Math.random()<0.1 ? 1 : 0;
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
	
	return;
	for(var i=0; i<this.behaviors.length; i++) {
		var b = this.behaviors[i];
		if(b.draw)
			b.draw(ctx);
	}
	
	if(this.needs[0].draw)
		this.needs[0].draw(ctx);
	
}

Cell.prototype.sim = function() {

	this.fat -= (Math.random()*0.02);
	//this.velocity = new Vector(2*Math.random()-1, 2*Math.random()-1);
	this.velocity = new Vector(0, 0);
	
	for(var i=0; i<this.behaviors.length; i++) {
		if(this.behaviors[i].prepare)
			this.behaviors[i].prepare();
	}
	
	for(var i=0; i<this.needs.length; i++) {
		this.needs[i].prepare();
	}
	
	var compare = function(a,b){
		return b.priority() - a.priority();
	}
	
	// perform biggest need
	this.needs.sort(compare);
	this.velocity = this.velocity.plus(this.needs[0].perform());
	
	// perform average of all behaviors
	var c = 0;
	var v = new Vector(0, 0);
	for(var i=0; i<this.behaviors.length; i++) {
		var vect = this.behaviors[i].perform();
		v = v.plus(vect);
		c++;
	}
	this.velocity = this.velocity.plus(v.scale(2/c));
	
	this.velocity = this.velocity.capLength(2);
	
	this.velocity = this.velocity.scale(0.6*(20-this.fat)/20 + 0.7);
	if(this.color === 'red')
		this.velocity = this.velocity.scale(1.5);
	this.position = this.position.plus(this.velocity);
}

function update() {

	if(cells.length > 1000 || food.length > 10000)
		return;

	if(Math.random()<0.1)
		food.push(new Food(
			new Vector(25+Math.random()*(width-50), 25+Math.random()*(height-50)),
			Math.random()*10+1));

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

$(function(){
	width = $('canvas').get(0).width;
	height = $('canvas').get(0).height;
	canvases[0] = $('canvas').get(0);
	canvases[1] = $('canvas').get(1);
	
	// waters[0] = new Water(new Vector(500, 300), 100);
	
	for(var i=0; i<30; i++) {
		var color = colors[Math.floor(Math.random()*colors.length)];
		cells[i] = new Cell(new Vector(25+Math.random()*(width-50), 25+Math.random()*(height-50)), color);
		cells[i].cells = cells;
	}
	var ncell = new Cell(new Vector(25+Math.random()*(width-50), 25+Math.random()*(height-50)), 'red');
	ncell.behaviors = [new FromWater(ncell), new FromWalls(ncell)];
	ncell.needs = [new Hunting(ncell), new Wandering(ncell)]; 
	ncell.cells = cells;
	ncell.fat = 10;
	cells.push(ncell);
	
	ncell = new Cell(new Vector(25+Math.random()*(width-50), 25+Math.random()*(height-50)), 'red');
	ncell.behaviors = [new FromWater(ncell), new FromWalls(ncell)];
	ncell.needs = [new Hunting(ncell), new Wandering(ncell)]; 
	ncell.cells = cells;
	ncell.fat = 10;
	cells.push(ncell);
	
	setInterval(update, 20);
})
