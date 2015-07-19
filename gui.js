var speed = 20;
var canvas;
var interval;
var selected;

Mating.prototype.color = 'pink';
Hunting.prototype.color = 'red';
RunningAway.prototype.color = 'yellow';
Grazing.prototype.color = 'green';
Wandering.prototype.color = 'lightgrey';

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
	$('#cell').text(cell.species.name);
	for(var aName in cell.aspects) {
		var a = cell.aspects[aName];
		var node = $('<div>');
		node.css('background-color', a.color ? a.color : 'grey');
		if(a===cell.top) {
			node.addClass('top-behavior');
		}
		var str = "";
		if(a.report) {
			var report = a.report();
			for(var i=0; i<report.length; i++)
				report[i] = Math.round(report[i]*100)/100;
			str = "["+report.join(',')+"]";
		}
		node.text(aName + ' : ' + str);
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

function addCell() {
	var name = $('#adder select').val();
	for(var i=0; i<species.length; i++) {
		if(species[i].name == name) {
			selected = species[i].makeCell(Vector.random(25, 25, width-50, height-50));
		}
	}
}

function listSpecies() {
	$('#species').text('');
	for(var i=0; i<species.length; i++) {
		var s = species[i];
		var node = $('<div>');
		var option = $('<option>');
		node.append($('<h1>').text(s.name));
		option.text(s.name);
		var ul = $('<ul>');
		for(var j in s.aspectTypes) {
			var li = $('<li>');
			li.text(s.aspectTypes[j].name);
			ul.append(li);
		}
		node.append(ul);
		$('#species').append(node);
		$('#adder select').append(option);
	}
}

function makeTree(sp) {
	if(!sp) return;
	var $result = $('<div>');
	$result.attr('class', 'node');
	$result.append(sp.name);
	for(var i=0; i<sp.children.length; i++) {
		var $child = makeTree(sp.children[i]);
		$result.append($child);
	}
	return $result;
}

function changeTab(e) {
	var tabId = $(this).attr('data-tabid');
	showTab(tabId);
}

function showTab(tabId) {
	$('.tab').hide();
	$('#'+tabId).show();
	
	$('.showtab').removeClass('activetab');
	$('.showtab[data-tabid="'+tabId+'"]').addClass('activetab');
}

function initGui() {
	canvas = $('canvas').get(0);
	
	$('#play').click(play);
	$('#plants').change(plants);
	$('#speed').change(changeSpeed);
	$('#canvas').click(click);
	$('.showtab').click(changeTab);
	$('#add').click(addCell);
	
	listSpecies();
	$('#taxonomy').append(makeTree(root));

	changeSpeed();
	plants();
	play();
	
	showTab('simulation');
}
