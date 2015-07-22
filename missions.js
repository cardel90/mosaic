var missions = [];

missions.push({
	name: 'Have 50 cells',
	get completed() {
		return cells.length >= 50;
	}
});