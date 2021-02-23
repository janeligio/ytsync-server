const log = message => console.log(message);

function randomId(length) {
	let id = '';
	for(let i = 0; i < length; i++) {
		id += Math.floor(Math.random() * Math.floor(10))
	}
	return id;
}

module.exports = { log, randomId };