function Config() {
	this.params = {};
}

Config.prototype.get = function(name) {
	return this.params[name].get();
}

Config.prototype.set = function(name, value) {
	this.params[name].set(value);
}

Config.prototype.add = function(param) {
	this.params[param.name] = param;
	$('#configuration').append(param.makeInput());
}

function ConfigParam(name, type, params, defaultValue, description) {
	this.name = name;
	this.type = type;
	this.params = params;
	this.description = description;
	var value = localStorage.getItem(name);
	if(value) {
		switch(type) {
			case 'int':
				this.value = +value;
				break;
			case 'bool':
				this.value = value=='true' ? true : false;
				break;
			default:
				this.value = value;
		}
	}
	else
		this.value = defaultValue;
}

ConfigParam.prototype.set = function(val) {
	this.value = val;
	localStorage.setItem(this.name, this.value);
}

ConfigParam.prototype.get = function() {
	return this.value;
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
	return $result;
}

ConfigParam.prototype.fromInput = function($input) {
	var val;
	switch(this.type) {
		case 'bool':
			val = $input.is(':checked');
			break;
		case 'int':
			val = +($input.val());
			break;
		default:
			val = $input.val();
	}
	this.set(val);
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
