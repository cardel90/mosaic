var canvas;
var interval;
var selected;

Mating.prototype.color = 'pink';
Hunting.prototype.color = 'red';
RunningAway.prototype.color = 'violet';
Grazing.prototype.color = 'green';
Wandering.prototype.color = 'lightgrey';
Looking.prototype.color = 'lightblue';
Herding.prototype.color = 'brown';
Eating.prototype.color = 'yellow';
Walking.prototype.color = 'orange';
Photosynthesis.prototype.color = 'lightgreen';

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
	repaint();
}

function addCell() {
	var name = $('#adder select').val();
	for(var i=0; i<species.length; i++) {
		if(species[i].name == name) {
			selected = species[i].makeCell(Vector.random(25, 25, width-50, height-50));
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
	$result.append($('<input>').attr('id', 'species-name'));
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
		var color = aspect.prototype.color ? aspect.prototype.color : 'grey';
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
	var sp = new Species($('#species-name').val(), [$('#species-color').val()], aspectTypes, aspectArguments, ancestor);
	species.push(sp);
	
	listSpecies();
	$('#taxonomy').text('').append(makeTree(root));
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
	$('#canvas').click(click);
	$('.showtab').click(changeTab);
	$('#add').click(addCell);

	config.add(new ConfigParam('sim-speed', 'int', {min:0, max:100}, 70, 'Simulation speed', restart));
	config.add(new ConfigParam('plant-growth', 'int', {min:0, max:100}, 20, 'Amount of plants'));
	config.add(new ConfigParam('max-cells', 'int', {min:0, max:100}, 70, 'Max number of cells'));
	config.add(new ConfigParam('draw-aspects', 'bool', {}, true, 'Draw aspect lines'));
	
	listSpecies();
	$('#taxonomy').text('').append(makeTree(root));
	makeCreator();

	play();
	
	showTab('species-creator');
}
