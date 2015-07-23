var canvas;
var interval;
var selected;
var lastFrame = 0;
var fps = 0;

var selectCursor = {
	click: function(x, y) {
		var v = new Vector(x, y);
		selected = undefined;
		for(var i=0; i<cells.length; i++) {
			if(cells[i].position.distance(v) <= cells[i].getSize()) {
				selected = cells[i];
				cellAside(selected);
				break;
			}
		}
		repaint();
	}
};

var cursor = selectCursor;

Mating.color = 'pink';
Hunting.color = 'red';
RunningAway.color = 'violet';
Grazing.color = 'green';
Wandering.color = 'lightgrey';
Looking.color = 'lightblue';
Herding.color = 'brown';
Eating.color = 'yellow';
Walking.color = 'orange';
Photosynthesis.color = 'lightgreen';

Cell.prototype.draw = function(ctx) {
	ctx.strokeStyle = 'black';
	ctx.fillStyle = this.color;
	ctx.beginPath();
	ctx.arc(this.position.x, this.position.y, this.getSize(), 0, 2*Math.PI);
	ctx.stroke();
	ctx.fill();
	ctx.closePath();

	if(this === selected) {
		ctx.beginPath();
		ctx.arc(this.position.x, this.position.y, this.getSize()+5, 0, 2*Math.PI);
		ctx.stroke();
		ctx.closePath();
	}
	
	if(config.get('draw-aspects')) {
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
}

function repaint() {
	var ctx = canvas.getContext("2d");
	
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0,0,width,height);
	
	for(var i=food.length-1; i>=0; i--) {
		food[i].draw(ctx);
	}
	for(var i=cells.length-1; i>=0; i--) {
		cells[i].draw(ctx);
	}
	
	cellAside(selected);
	$('#score').text(score);
	$('#cell-count').text(cells.length);
	
	$('#missions').text('');
	for(var i=0; i<missions.length; i++)
		$('#missions').append(showMission(missions[i]));
	
	var time = new Date().getTime();
	var delta = time-lastFrame;
	lastFrame = time;
	
	var d = 0.01;
	fps = (1-d)*fps + d * 1000/delta;

	$('#fps').text(Math.round(fps));
}

function play() {
	if(interval === undefined) {
		$('#play').text('Stop');
		interval = setInterval(update, 200-2*config.get('sim-speed'));
	} else {
		clearInterval(interval);
		interval = undefined;
		$('#play').text('Play');
	}
}

function restart() {
	play();
	play();
}

function cellAside(cell) {
	$('#cell').text('');
	if(!cell)
		return;
	$('#cell').text(cell.species.name);
	for(var aName in cell.aspects) {
		var a = cell.aspects[aName];
		var node = $('<div>');
		node.css('background-color', a.aspectType.color ? a.aspectType.color : 'grey');
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

function addCell() {
	var name = $('#adder select').val();
	for(var i=0; i<species.length; i++) {
		if(species[i].name == name) {
			selected = species[i].makeCell(Vector.random(25, 25, width-50, height-50));
			break;
		}
	}
	repaint();
}

function listSpecies() {
	$('#species').text('');
	$('#adder select').text('');
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

function makeCreator() {
	$('species-creator').text('');
	$result = $('<div>');
	$result.append($('<label>').attr('for', 'species-name').text('Species name'));
	$result.append($('<input>').attr('id', 'species-name').val('Animal'));
	$result.append('<br>');
	$result.append($('<label>').attr('for', 'ancestor').text('Ancestor'));
	var $select = $('<select>').attr('id', 'ancestor');
	for(var i=0; i<species.length; i++)
		$select.append($('<option>').text(species[i].name));
	$result.append($select);
	$result.append('<br>');
	$result.append($('<label>').attr('for', 'species-color').text('Species color'));
	$result.append($('<input>').attr('id', 'species-color').attr('type', 'color'));
	$result.append('<br>');
	for(var i=0; i<allAspects.length; i++) {
		var aspect = allAspects[i];
		var $div = $('<div>');
		var color = aspect.color ? aspect.color : 'grey';
		$div.css('background-color', color);
		$div.addClass('aspect');
		$div.attr('id', aspect.name+'-div');
		var $checkbox = $('<input>');
		$checkbox.attr('type', 'checkbox');
		$checkbox.attr('id', aspect.name+'-selected');
		$checkbox.change(function(){
			$(this).parent().toggleClass('aspect-selected');
		});
		if(aspect.required) {
			$checkbox.prop('disabled', true).prop('checked', true);
			$div.addClass('aspect-selected');
		}
		$div.append($checkbox);
		$div.append($('<label>').attr('for', aspect.name+'-selected').text(aspect.name));
		for(var j in aspect.defaults) {
			var $label = $('<label>').text(j);
			$label.attr('for', aspect.name+'-'+j);
			var $input = $('<input>');
			$input.attr('id', aspect.name+'-'+j);
			$input.val(aspect.defaults[j]);
			$div.append('<br>').append($label).append($input);
		}
		$result.append($div).append('<br>');
	}
	$result.append($('<button>').text('Create').click(createSpecies));
	$('#species-creator').prepend($result);
}

function createSpecies() {
	var aspectTypes = [];
	var aspectArguments = {};
	for(var i=0; i<allAspects.length; i++) {
		var aspect = allAspects[i];
		if($('#'+aspect.name+'-selected').is(':checked')) {
			aspectTypes.push(aspect);
			var args = {};
			for(var j in aspect.defaults) {
				args[j] = $('#'+aspect.name+'-'+j).val();
			}
			aspectArguments[aspect.name] = args;
		}
	}
	var ancestor = root;
	for(var i=0; i<species.length; i++) {
		if(species[i].name === $('#ancestor').val()) {
			ancestor = species[i];
			break;
		}
	}
	
	var cost = 10*(1
		+ _.difference(aspectTypes, ancestor.aspectTypes).length 
		+ _.difference( ancestor.aspectTypes, aspectTypes).length);
	score -= cost;
	
	var sp = new Species($('#species-name').val(), [$('#species-color').val()], aspectTypes, aspectArguments, ancestor);
	species.unshift(sp);
	
	listSpecies();
	$('#taxonomy').text('').append(makeTree(root));
	showTab('simulation');
}

function showMission(mission) {
	var $result = $('<div>').addClass('mission');
	if(mission.completed)
		$result.addClass('completed');
	$result.text(mission.name);
	return $result;
}

function changeTab() {
	var tabId = $(this).attr('data-tabid');
	showTab(tabId);
}

function showTab(tabId) {
	$('.tab').hide();
	$('#'+tabId).show();
	
	$('.showtab').removeClass('activetab');
	$('.showtab[data-tabid="'+tabId+'"]').addClass('activetab');
}

function keydown(e) {
	if(e.target.localName==='button' || e.target.localName==='input')
		return;
	switch(e.which) {
		case 32:
			play();
			break;
	}
}

function canvasClick(e) {
	var x = e.pageX - $(this).offset().left,
		y = e.pageY - $(this).offset().top;
	cursor.click(x, y);
}

function initGui() {
	canvas = $('canvas').get(0);
	
	$('#play').click(play);
	$('#canvas').click(canvasClick);
	$('.showtab').click(changeTab);
	$('#add').click(addCell);
	$('#init').click(devInit);
	$(document).keydown(keydown);

	config.add(new ConfigParam('sim-speed', 'int', {min:0, max:100}, 70, 'Simulation speed', restart));
	config.add(new ConfigParam('plant-growth', 'int', {min:0, max:1000}, 20, 'Amount of plants'));
	config.add(new ConfigParam('max-cells', 'int', {min:0, max:500}, 70, 'Max number of cells'));
	config.add(new ConfigParam('draw-aspects', 'bool', {}, true, 'Draw aspect lines'));
	
	listSpecies();
	$('#taxonomy').text('').append(makeTree(root));
	makeCreator();

	play();
	
	showTab('simulation');
}
