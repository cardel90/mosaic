function Config() {
	this.params = {};
}

Config.prototype.get = function(name) {
	return this.params[name].value;
}

Config.prototype.set = function(name, value) {
	this.params[name].value = value;
}

Config.prototype.add = function(param) {
	this.params[param.name] = param;
	param.makeInput();
}

function ConfigParam(name, type, params, value, description) {
	this.name = name;
	this.value = value;
	this.type = type;
	this.params = params;
	this.description = description;
}
/*
 * Example result:
<label for="plants">Plant amount</label>
<input id="plants" type="range" min="0" max="500" step="1" value="50" />
*/
ConfigParam.prototype.makeInput = function() {
	var $label = $('<label>');
	$label.attr('for', 'config-'+this.name);
	$label.text(this.description);
	var $input = $('<input>');
	$input.attr('id', 'config-'+this.name);
	$input.attr('value', this.value);
	switch(this.type) {
		case 'int':
			$input.attr('type', 'range');
			$input.attr('min', this.params.min);
			$input.attr('max', this.params.max);
			$input.attr('step', 1);
			break;
		case 'bool':
			$input.attr('type', 'checkbox');
			$input.attr('step', 1);
			break;
	}
	
	var theParam = this;
	$input.change(function(){
		theParam.fromInput($(this));
	});
	
	$result = $('<div>');
	$result.append($label).append($input);
	
	this.toInput($input);
	$('#configuration').append($result);
}

ConfigParam.prototype.fromInput = function($input) {
	switch(this.type) {
		case 'bool':
			this.value = $input.is(':checked');
			break;
		default:
			this.value = $input.val();
	}
}

ConfigParam.prototype.toInput = function($input) {
	switch(this.type) {
		case 'bool':
			$input.prop('checked', this.value);
			break;
		default:
			$input.val(this.value);
	}
}


var config = new Config();
