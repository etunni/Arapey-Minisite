import "./assets.js";
import { fontName } from "./font";
import FontFaceObserver from "fontfaceobserver";

const fontTimeOut = 5000; // In milliseconds

// Generic: throttle
const throttle = (fn, wait) => {
	let last, queue;

	return function runFn(...args) {
		const now = Date.now();
		queue = clearTimeout(queue);

		if (!last || now - last >= wait) {
			fn.apply(null, args);
			last = now;
		} else {
			queue = setTimeout(runFn.bind(null, ...args), wait - (now - last));
		}
	};
};

// Generic: Like setInterval, but with rAF for better performance
function setRAFInterval(fn, delay) {
	let start = Date.now();
	const data = {};
	data.id = requestAnimationFrame(loop);

	return data;

	function loop() {
		data.id = requestAnimationFrame(loop);

		if (Date.now() - start >= delay) {
			fn();
			start = Date.now();
		}
	}
}

// Set up FontFaceObserver
const font = new FontFaceObserver(fontName);
font.load(null, fontTimeOut).then(
	() => {
		// Font has loaded
		document.documentElement.classList.add("fonts-loaded");
		initializeApp();
	},
	() => {
		// Font didn't load
		document.documentElement.classList.add("fonts-failed");
		initializeApp();
	}
);

const setupInputs = () => {
	// Interactive controls (sliders that tweak axes)
	const interactives = document.querySelectorAll(".interactive-controls");
	for (const interactive of interactives) {
		const area = interactive.querySelector(".interactive-controls-text");
		const sliders = interactive.querySelectorAll(
			".interactive-controls-slider"
		);

		const instances = interactive.querySelector(
			".interactive-controls-instances"
		);

		const varset = (name, value) => {
			area.style.setProperty(`--${name}`, value);
		};

		for (const slider of sliders) {
			// Apply initial axis value to text area

			varset(slider.name, slider.value);
			setupBadge(slider, slider.value);

			slider.oninput = e => {
				// Set new axis value to text area
				varset(e.target.name, e.target.value);
				// Unselect named instance dropdown
				// Optionally, see if current axes match instance and select that
				if (instances) {
					instances.selectedIndex = -1;
				}

				setupBadge(slider, e.target.value);
			};
		}

		if (instances) {
			instances.onchange = e => {
				const axes = JSON.parse(
					e.target.options[e.target.selectedIndex].value
				);

				for (const axis in axes) {
					// Set new axis value on slider
					interactive.querySelector(`[name=${axis}]`).value =
						axes[axis];
					// Apply new axis value to text area
					varset(axis, axes[axis]);
				}
			};
		}
	}
};

// Watch if .am-i-in-view elements are visible on screen
// and apply a class accordingly
if ("IntersectionObserver" in window) {
	// eslint-disable-next-line compat/compat
	const obs = new IntersectionObserver(els => {
		els.forEach(el => {
			el.intersectionRatio > 0
				? el.target.classList.add("in-view")
				: el.target.classList.remove("in-view");
		});
	});

	const elements = document.querySelectorAll(".am-i-in-view");
	elements.forEach(el => {
		obs.observe(el);
	});
}

// Character grid
const gridSection = document.querySelector(".character-grid-section");
const grid = gridSection.querySelector(".character-grid");
const gridzoom = gridSection.querySelector(".character-grid-zoom");
let previousCharacterGrid = null;
const setGridCharacter = e => {
	if (!e) {
		// Init on first view
		gridzoom.textContent = "A";
		grid.querySelector("[data-character=A]").classList.add("active");
	} else if (e.target.tagName === "LI") {
		if (e.target.textContent !== previousCharacterGrid) {
			grid.querySelector(".active").classList.remove("active");
			e.target.classList.add("active");
			gridzoom.textContent = previousCharacterGrid = e.target.textContent;
		}
	}
};

grid.onmousemove = throttle(setGridCharacter, 100);

// Sliders
// TODO: maybe we can cache the value of slide.offsetWidth and
// badge.offsetWidth, as they won't change unless the viewport
// size changes (in which we can recalculate them, see comment
// around initializeApp)
const setupBadge = (slider, value) => {
	const sliderContainer = slider.closest(`.${slider.name}-container`);
	const badge = sliderContainer.querySelector(".interactive-controls-badge");
	const badgeOffset =
		slider.offsetWidth / (parseFloat(slider.max) - parseFloat(slider.min));

	if (!badge) return;

	const badgePosition =
		(parseFloat(value) - parseFloat(slider.min)) * badgeOffset -
		badge.offsetWidth / 2;

	badge.style.setProperty("--badge-position-x", `${badgePosition}px`);
	badge.style.setProperty("--weight", `${value}`);
	badge.style.setProperty("--weight-string", `"${Math.round(value)}"`);
};

const toggleBlockContainer = document.querySelector(".toggle-block-container");
const toggles = toggleBlockContainer.querySelectorAll(
	".interactive-controls-checkbox"
);

const handleToggle = e => {
	const value = e.target.checked ? 900 : 100;
	e.target
		.closest(".toggle-block")
		.style.setProperty("--toggle-block-font-weight", value);
};

toggles.forEach(toggle => toggle.addEventListener("change", handleToggle));

const aboutInteractiveElement = document.querySelector(
	".about-arapey-content-interactive"
);

const alignmentHandle = document.querySelector(
	"#about-arapey-alignment-controls"
);
const alignmentInputs = alignmentHandle.querySelectorAll(".alignment-input");

const handleAlignmentClick = e => {
	aboutInteractiveElement.style.setProperty(
		"--text-alignment",
		e.target.value
	);
};

alignmentInputs.forEach(item =>
	item.addEventListener("click", handleAlignmentClick)
);

// Handle select box
const selectElements = {
	handle: document.querySelector("#about-arapey-select-controls"),
	dropdown: document.querySelector(".interactive-controls-options-list")
};

selectElements.handle.addEventListener("click", e => {
	e.stopPropagation();

	selectElements.dropdown.classList.add("show");
});

selectElements.dropdown.addEventListener("click", e => {
	if (e.target.type == "button") {
		const textContainer = selectElements.handle.querySelector("span");
		selectElements.handle.setAttribute("value", e.target.value);

		selectElements.dropdown
			.querySelector(".active")
			.classList.remove("active");

		e.target.classList.add("active");

		textContainer.textContent = e.target.value;
		selectElements.dropdown.classList.remove("show");

		aboutInteractiveElement.style.setProperty(
			"--wght",
			e.target.getAttribute("data-wght")
		);
	}
});

const onClickOutside = e => {
	if (
		selectElements.dropdown.classList.contains("show") &&
		e.target.contains(selectElements.handle)
	)
		selectElements.dropdown.classList.remove("show");
};

window.addEventListener("click", onClickOutside);

// Letterwave
const letterWave = {
	// Setup stuff:
	letter: "A",
	color: "eeeeee",
	cellSize: 30, // Smaller = more letters
	steps: 16, // How many frames in animation from lowest to highest weight
	waveStep: 3, // Speed to step through weightMap
	waveAngle: 0.5, // Use this to determine steepness/angle
	lineOffsetLines: 3, // How many "jagged starts"
	darkenFactor: 2, // How much to darken bolder weight
	// Internal stuff:
	letters: [],
	waveOffset: 0,
	canvas: null,
	ctx: null,
	width: 0,
	height: 0,
	weightMap: [],
	letterCanvases: [],
	setup(selector) {
		this.canvas = document.querySelector(selector);
		this.setupCanvas();
		this.setupLetterPositions();
		this.setupWeightMap();
		this.preRenderChars();
	},
	setLetter(letter) {
		this.letter = letter;
		this.preRenderChars();
	},
	resizeCanvas() {
		topWave.setupCanvas();
		topWave.setupLetterPositions();
	},
	// Pre-render chars
	// We need to do this as rendering (variable) fonts directly
	// to canvas each frame is too slow. We now build a cache of
	// canvassed of the letter at each desired weight, and render
	// those to the main canvas.
	preRenderChars() {
		const weighStep = Math.round(800 / this.steps); // Weight 100 to 900 = 800 steps
		let weight = 100; // Weight starts at this value
		let hexColor = parseInt(this.color, 16);

		// Generate pre-rendered letters for weights 100 to 900
		this.letterCanvases = [];
		for (let i = 0; i <= this.steps; i++) {
			const letterCanvas = document.createElement("canvas");
			const letterCtx = letterCanvas.getContext("2d");
			letterCtx.canvas.width = this.cellSize;
			letterCtx.canvas.height = this.cellSize;
			letterCtx.fillStyle = `#${hexColor.toString(16)}`;

			letterCtx.font = `${weight} ${this.cellSize}px Arapey`;
			letterCtx.textAlign = "center";
			letterCtx.textBaseline = "middle";
			letterCtx.fillText(
				this.letter,
				this.cellSize / 2,
				this.cellSize / 2
			);
			this.letterCanvases.push(letterCanvas);

			weight += weighStep;

			// 65793 = 0x0101010, so turns #CCCCCC into #CBCBCB etc.
			hexColor -= this.darkenFactor * 65793;
		}
	},
	setupCanvas() {
		this.width = this.canvas.offsetWidth;
		this.height = this.canvas.offsetHeight;
		this.ctx = this.canvas.getContext("2d");
		this.ctx.canvas.width = this.width;
		this.ctx.canvas.height = this.height;
	},
	// Array of each letter's position
	setupLetterPositions() {
		const columns = Math.floor(this.width / this.cellSize);
		const rows = Math.floor(this.height / this.cellSize);

		this.letters = [];
		for (let i = 0; i <= rows; i++) {
			for (let j = 0; j <= columns; j++) {
				this.letters.push({
					x: j * this.cellSize,
					y: i * this.cellSize
				});
			}
		}
	},
	// Array weights to loop through
	setupWeightMap() {
		this.weightMap = [];
		for (let i = 0; i <= this.steps; i++) {
			this.weightMap.push(i);
			this.weightMap.unshift(i);
			this.weightMap.unshift(i);
			this.weightMap.unshift(i);
		}
	},
	// Draw a new iteration of the wave to canvas
	renderWave() {
		let lineStartOffset = 0;
		let count = this.waveOffset;
		let localCount = this.waveOffset;
		let previousLetterY;
		let offsetX;

		// Clear canvas
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Draw each letter
		for (const letter of this.letters) {
			if (previousLetterY !== letter.y) {
				// New row, shift starting weight
				localCount += this.waveAngle;
				count = Math.round(localCount);
				lineStartOffset++;
				lineStartOffset %= this.lineOffsetLines;
				offsetX =
					(lineStartOffset / this.lineOffsetLines) * this.cellSize;
			}

			// Determine weight based on wave
			const weight = this.weightMap[count++ % this.weightMap.length];

			this.ctx.drawImage(
				this.letterCanvases[weight],
				Math.round(letter.x - offsetX),
				letter.y
			);
			previousLetterY = letter.y;
		}
		this.waveOffset += this.waveStep;
	}
};

const topWave = Object.create(letterWave);
const initializeApp = () => {
	// TODO: set these value in a generic function that
	// can be recalculated on window resize
	// See https://github.com/undercasetype/fraunces-minisite/blob/master/src/js/main.js#L326

	setupInputs();
	setGridCharacter();

	selectElements.dropdown
		.querySelector("[value='Regular']")
		.classList.add("active");

	// Timeout as poor man's font loading strategy
	topWave.setup(".arapey-hero-canvas");
	setRAFInterval(() => {
		topWave.renderWave();
	}, 100);
};

// Update variables related to the viewport
const setViewportValues = () => {
	// Recalculate letterWave canvas dimensions
	topWave.resizeCanvas();
};
window.onresize = throttle(setViewportValues, 100);
