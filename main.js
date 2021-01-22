log("main.js loaded");

var GAMEFIELD_WIDTH = 512;
var GAMEFIELD_HEIGHT = 512;
var TILE_WIDTH = 8;
var TILE_HEIGHT = 8;
var CELLS_X = GAMEFIELD_WIDTH / TILE_WIDTH;
var CELLS_Y = GAMEFIELD_HEIGHT / TILE_HEIGHT;

var generation = 0;
var $generation = null;
var arena = buildArena(CELLS_X, CELLS_Y);
var arena_init = null;
var context = null;
var redraw = null;
var playing = false;
var generations_until_beaten = 0;

var $play = null;
var $stop = null;
var $prev = null;
var $next = null;
var $title = null;
var $gamefield = null;
var $piece_count = null;

var PLAYABLE = {
	x: 24,
	y: 24,
	width: 16,
	height: 16,
};

var goal = {};

$(function() {
	log("DOM Ready");

	$play = $('#button-play');
	$stop = $('#button-stop');
	$prev = $('#button-level-prev');
	$next = $('#button-level-next');

	$title = $('#title span');
	$generation = $('#generation span');
	$piece_count = $('#piececount span');
	$gamefield = $('#gamefield');

	var gamefield = document.getElementById('gamefield');
	context = gamefield.getContext('2d');

	log("Gamefield Cells: [" + CELLS_X + ", " + CELLS_Y + "]");

	goal = {
		x: Math.floor(Math.random() * CELLS_X),
		y: Math.floor(Math.random() * CELLS_Y),
	};

	// Quick lil' glider
	arena[30][30] = true;
	arena[31][30] = true;
	arena[32][30] = true;
	arena[32][29] = true;
	arena[31][28] = true;

	arena[36][37] = true;
	arena[35][36] = true;
	arena[37][36] = true;
	arena[36][35] = true;

	countPlayedPieces();

	drawArena(); // First Draw

	$play.on('click', function() {
		$stop.attr('disabled', false);
		$play.attr('disabled', true);
		playing = true;

		arena_init = arena.slice(0); // Backup the initial arena state

		drawArena();
		redraw = setInterval(animate, 150);
	});

	$stop.on('click', function() {
		clearTimeout(redraw); 

		$play.attr('disabled', false);
		$stop.attr('disabled', true);

		generation = 0;
		$generation.html(generation);

		playing = false;
		generations_until_beaten = 0;

		arena = arena_init.slice(0); // Restore the initial arena state
		drawArena();
	});

	$next.on('click', function() {
		log("Feature not-yet implemented :'(");
	});

	$gamefield.on('click', function(event) {
		var tile = {
			x: Math.floor((event.pageX - $gamefield.offset().left) / TILE_WIDTH),
			y: Math.floor((event.pageY - $gamefield.offset().top) / TILE_HEIGHT),
		};

		if (playing) {
			log("Cannot change the game while playing.");
		} else if (tile.x >= PLAYABLE.x && tile.y >= PLAYABLE.y && tile.x < PLAYABLE.x + PLAYABLE.width && tile.y < PLAYABLE.x + PLAYABLE.height) {
			arena[tile.y][tile.x] = !arena[tile.y][tile.x];
			log("Toggled [" + tile.x + ", " + tile.y + "].");
			countPlayedPieces();
		} else {
			log("Position [" + tile.x + ", " + tile.y + "] is outside of the playable (pink) zone.");
		}

		drawArena();
	});
});

function countPlayedPieces() {
	var counter = 0;

	for (var y = PLAYABLE.y; y < PLAYABLE.y + PLAYABLE.height; y++) {
		for (var x = PLAYABLE.x; x < PLAYABLE.x + PLAYABLE.width; x++) {
			if (arena[y][x]) {
				counter++;
			}
		}
	}
	$piece_count.text(counter);

	return counter;
}

function buildArena(constraint_x, constraint_y) {
	var new_arena = [];

	for (var y = 0; y < constraint_y; y++) {
		new_arena[y] = [];
		for (var x = 0; x < constraint_x; x++) {
			new_arena[y][x] = false;
		}
	}

	return new_arena;
}

function drawArena() {
	for (var y = 0; y < CELLS_Y; y++) {
		for (var x = 0; x < CELLS_X; x++) {
			if (goal.x == x && goal.y == y) {
				context.fillStyle = "rgb(0,127,255)";
				if (arena[y][x] && !generations_until_beaten) {
					$('#gamefield-wrapper').addClass('won');
					$next.attr('disabled', false);
					//clearTimeout(redraw); 
					log("Game won in " + generation + " generations!");
					generations_until_beaten = generation;
				}
			} else if (arena[y][x]) {
				context.fillStyle = "rgb(0,0,0)";
			} else {
				context.fillStyle = "rgb(255,255,255)";
			}
			context.fillRect(x * TILE_WIDTH, y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
		}
	}

	context.fillStyle = "rgba(255,127,0, 0.1)";
	context.fillRect(
		PLAYABLE.x * TILE_WIDTH,
		PLAYABLE.y * TILE_HEIGHT,
		PLAYABLE.width * TILE_WIDTH,
		PLAYABLE.height * TILE_HEIGHT
	);
}

function animate() {
	generation++;
	$generation.html(generation);

	var new_arena = buildArena(CELLS_X, CELLS_Y);

	for (var y = 0; y < CELLS_Y; y++) {
		for (var x = 0; x < CELLS_X; x++) {
			updateCellState(x, y, new_arena);
		}
	}

	arena = new_arena;
	drawArena();
}

function updateCellState(x, y, new_arena) {
	var cell_state = arena[y][x];
	var living_neighbors = 0;

	for (var mod_x = -1; mod_x <= 1; mod_x++) {
		for (var mod_y = -1; mod_y <= 1; mod_y++) {
			if (x + mod_x >= 0 && x + mod_x < CELLS_X && // Is this X coordinate outside of the array?
				y + mod_y >= 0 && y + mod_y < CELLS_Y && // Is this Y coordinate outside of the array?
				(!(mod_y == 0 && mod_x == 0)) && // Not looking at self but neighbor
				arena[y + mod_y][x + mod_x]) { // Is this cell alive?

			   living_neighbors++;
		   }
		}
	}

	if (cell_state) { // Cell is alive
		if (living_neighbors < 2) { // Under-Population
			new_arena[y][x] = false;
		} else if (living_neighbors > 3) { // Over-Crowding
			new_arena[y][x] = false;
		} else { // live on
			new_arena[y][x] = true;
		}
	} else { // Cell is dead
		if (living_neighbors == 3) { // Reproduction
			new_arena[y][x] = true;
		} else {
			new_arena[y][x] = false;
		}
	}
}

function log(msg) {
	$('#console').text(msg);
}
