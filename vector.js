function Vector(x, y) {
	this.x = x;
	this.y = y;
}

Vector.prototype.clone = function(){
	return new Vector(this.x, this.y);
}

Vector.prototype.lengthSq = function() {
	return (this.x*this.x) + (this.y*this.y);
}

Vector.prototype.length = function() {
	return Math.sqrt((this.x*this.x) + (this.y*this.y));
}

Vector.prototype.plus = function(other) {
	return new Vector(this.x+other.x, this.y+other.y);
}

Vector.prototype.minus = function(other) {
	return new Vector(this.x-other.x, this.y-other.y);
}

Vector.prototype.scale = function(factor) {
	return new Vector(this.x * factor, this.y * factor);
}

Vector.prototype.normalize = function() {
	if(this.x==0 && this.y==0)
		return this.clone();
	return this.scale(1/this.length());
}

Vector.prototype.distance = function(other) {
	return this.minus(other).length();
}

Vector.prototype.capLength = function(m) {
	var d = this.length();
	if(d>m)
		return this.scale(m/d);
	else
		return this.clone();
}

Vector.prototype.dot = function(v) {
	return this.x*v.x + this.y*v.y;
}

Vector.prototype.dotReduced = function(v) {
	return (this.x*v.x + this.y*v.y)/(this.length()*v.length());
}
