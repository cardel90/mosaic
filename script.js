var width;
var height;
var root;
var species = [];
var cells = [];
var food = [];
var score = 0;

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

Cell.prototype.getAspect = function(a) {
	return this.aspects[a.name];
}

Cell.prototype.hasAspect = function(a) {
	return (a.name in this.aspects);
}

Cell.prototype.nearestCells = function(maxDistance) {
	var tcell = this;
	var result = _.filter(cells, function(c){
		return c.position.distance(tcell.position) <= maxDistance;
	});
	
	return result;
}

Cell.prototype.makeChild = function() {
	var ncell = this.species.makeCell(this.position.plus(Vector.random(-10, -10, 20, 20)));
	var f = this.getAspect(Eating).fat;
	this.getAspect(Eating).fat = 2*f/3;
	ncell.getAspect(Eating).fat = f/3;
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
		
		if(cell.getAspect(Eating).fat <= 4)
			cells.splice(i, 1);
	}
	
	for(var i=food.length-1; i>=0; i--) {
		if(food[i].amount < 0.2) {
			food.splice(i, 1);
		}
	}
	
	repaint();
}

function devInit() {
	var deer = new Species('Sarna', ['yellow', 'blue'], [Looking, RunningAway, FromWalls, Mating, Walking, Herding, FromOthers, Eating, Grazing, Wandering], {}, root);
	var bear = new Species('Niedźwiedź', ['teal'], [Looking, FromWalls, Walking, Eating, Grazing, Hunting, Wandering], {}, root);
	var wolf = new Species('Wilk', ['red'], [FromOthers, Looking, Walking, Eating, Hunting, Wandering], {Walking:{topSpeed:3}}, root);
	species = species.concat([deer, wolf, bear]);
	
	listSpecies();
	$('#taxonomy').text('').append(makeTree(root));
	
	for(var i=0; i<30; i++) {
		deer.makeCell(Vector.random(25, 25, width-50, height-50));
	}
	
	wolf.makeCell(Vector.random(25, 25, width-50, height-50));
	wolf.makeCell(Vector.random(25, 25, width-50, height-50));
}

$(function(){
	width = $('canvas').get(0).width;
	height = $('canvas').get(0).height;

	root = new Species('Alga', ['lime'], [Looking, Walking, Eating, Photosynthesis, Fission, FromOthers], {});
	species = [root];
	initGui();
	update();
})
