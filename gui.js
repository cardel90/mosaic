
var speed = 20;
var canvas;
var interval;
var selected;

Mating.prototype.color = 'pink';
Hunting.prototype.color = 'red';
RunningAway.prototype.color = 'yellow';
Grazing.prototype.color = 'green';

Cell.prototype.draw = function(ctx) {
	ctx.strokeStyle = 'black';
	ctx.fillStyle = this.color;
	ctx.beginPath();
	ctx.arc(this.position.x, this.position.y, this.fat, 0, 2*Math.PI);
	ctx.stroke();
	ctx.fill();
	ctx.closePath();

	if(this === selected) {
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, this.fat+5, 0, 2*Math.PI);
		ctx.stroke();
		ctx.closePath();
	}
	
	// draw aspects with no priority and the top one
	for(var i=0; i<this.aspectList.length; i++) {
		var a = this.aspectList[i];
		if(a.draw) {
			if(!a.priority || a===this.top) {
				a.draw(ctx);
			}
		}
	}
}

function repaint() {
	var ctx = canvas.getContext("2d");
	
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
	
	cellAside(selected);
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

function cellAside(cell) {
	$('#cell').text('');
	if(!cell)
		return;
	$('#cell').text('Cell');
	for(var aName in cell.aspects) {
		var a = cell.aspects[aName];
		var node = $('<div>');
		node.css('background-color', a.color ? a.color : 'grey');
		console.log(a.color);
		node.text( (a===cell.top?'*':' ') + aName);
		$('#cell').append(node);
	}
}

function click(e) {
	var x = e.pageX - $(this).offset().left,
		y = e.pageY - $(this).offset().top,
		v = new Vector(x, y);
	selected = undefined;
	for(var i=0; i<cells.length; i++) {
		if(cells[i].position.distance(v) <= cells[i].fat) {
			selected = cells[i];
			cellAside(selected);
			break;
		}
	}
}

function initGui() {
	canvas = $('canvas').get(0);
	
	$('#play').click(play);
	$('#plants').change(plants);
	$('#speed').change(changeSpeed);
	$('#canvas1').click(click);
	$('#canvas2').click(click);

	changeSpeed();
	plants();
}
