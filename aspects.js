function loadAspect(cell, name) {
	var aspects = {
		'looking': Looking
	};
	cell.aspects.push(new aspects[name](cell));
}

function Looking(cell) {
	this.cell = cell;
	this.angle = Math.PI*3/4;
	this.range = 100;
	this.seen = [];
}

function canvas_arrow(context, fromx, fromy, tox, toy){
    var headlen = 10;   // length of head in pixels
    var angle = Math.atan2(toy-fromy,tox-fromx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6));
    context.moveTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6));
}

Looking.prototype.draw = function(ctx) {
	ctx.beginPath();
	ctx.strokeStyle = 'black';
	/*
	var m1 = [[Math.cos(this.angle),-Math.sin(this.angle)], [Math.sin(this.angle),Math.cos(this.angle)]];
	var m2 = [[Math.cos(-this.angle),-Math.sin(-this.angle)], [Math.sin(-this.angle),Math.cos(-this.angle)]];
	var v = this.cell.velocity.normalize().scale(this.range);
	var v1 = v.mulMatrix(m1);
	var p1 = this.cell.position.plus(v1);
	var v2 = v.mulMatrix(m2);
	var p2 = this.cell.position.plus(v2);
	ctx.moveTo(this.cell.position.x, this.cell.position.y);
	ctx.lineTo(p1.x, p1.y);
	ctx.moveTo(this.cell.position.x, this.cell.position.y);
	ctx.lineTo(p2.x, p2.y);
	var a = v.angle();//Math.PI/4;
	ctx.arc(this.cell.position.x, this.cell.position.y, this.range, a-this.angle, a+this.angle);
	ctx.stroke();
	*/
	
	for(var i=0; i<this.seen.length; i++) {
		canvas_arrow(ctx, 
			this.cell.position.x, this.cell.position.y, this.seen[i].position.x, this.seen[i].position.y
		);
		ctx.stroke();
	}
}

Looking.prototype.perform = function() {
	var tcell = this.cell;
	var l = this;
	this.seen = tcell.nearestCells(function(c){
		return c.distance(tcell) < l.range && tcell.velocity.dot(c.position.minus(tcell.position)) > 0;
	});
}

