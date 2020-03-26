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
		setViewportValues();
		aboutFonts.init();
	},
	() => {
		// Font didn't load
		document.documentElement.classList.add("fonts-failed");
		initializeApp();
		setViewportValues();
		aboutFonts.init();
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

			if (slider.name == "opsz-slider" || slider.name == "wght-slider")
				aboutFonts.syncCodeBlock(slider.name, slider.value);

			slider.oninput = e => {
				// Set new axis value to text area
				varset(e.target.name, e.target.value);
				// Unselect named instance dropdown
				// Optionally, see if current axes match instance and select that
				if (instances) {
					instances.selectedIndex = -1;
				}

				setupBadge(slider, e.target.value);

				if (
					slider.name == "opsz-slider" ||
					slider.name == "wght-slider"
				)
					aboutFonts.syncCodeBlock(slider.name, e.target.value);
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
			el.isIntersecting
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

	badge.textContent = Math.round(value);
	badge.style.setProperty("--badge-position-x", `${badgePosition}px`);
	badge.style.setProperty("--weight", `${value}`);
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
	handle: document.querySelectorAll("#interactive-controls-select"),
	dropdown: document.querySelectorAll(".interactive-controls-options-list")
};

selectElements.handle.forEach(handle => {
	handle.addEventListener("click", e => {
		e.stopPropagation();
		e.currentTarget.nextElementSibling.classList.add("show");
	});
});

selectElements.dropdown.forEach(dropdown => {
	dropdown.addEventListener("click", e => {
		const interactiveElement = dropdown.closest(".interactive-controls");
		const opszSlider = interactiveElement.querySelector(".opsz");
		if (e.target.type == "button") {
			const textContainer = e.currentTarget.previousElementSibling.querySelector(
				"span"
			);
			e.currentTarget.previousElementSibling.setAttribute(
				"value",
				e.target.value
			);

			e.currentTarget.querySelector(".active").classList.remove("active");

			e.target.classList.add("active");

			textContainer.textContent = e.target.value;
			e.currentTarget.classList.remove("show");

			interactiveElement.style.setProperty(
				"--wght",
				e.target.getAttribute("data-wght")
			);

			interactiveElement.style.setProperty(
				"--opsz",
				e.target.getAttribute("data-opsz")
			);

			if (opszSlider) {
				opszSlider.value = e.target.getAttribute("data-opsz");

				setupBadge(
					interactiveElement.querySelector(".opsz"),
					e.target.getAttribute("data-opsz")
				);
			}
		}
	});
});

const onClickOutside = () => {
	selectElements.dropdown.forEach(dropdown => {
		if (dropdown.classList.contains("show")) {
			dropdown.classList.remove("show");
		}
	});
};

window.addEventListener("click", onClickOutside);

// Sliding wall of characters
// TODO: avoid layout thrashing by caching offset values,
//       especially in the loop
const characterSlide = {
	x: 0,
	oldX: 0,
	isDown: false,
	shouldSlide: true,
	scrollLeft: 0,
	momentumID: null,
	slideSpeed: -1,
	dir: "right"
};
const characterSlideSection = document.querySelector(
	".character-slide-section"
);
const characterSlideListContainer = characterSlideSection.querySelector(
	".character-slide-lists"
);
characterSlideListContainer.addEventListener("mouseover", () => {
	characterSlide.shouldSlide = false;
});
characterSlideListContainer.addEventListener("mouseout", () => {
	characterSlide.shouldSlide = true;
	characterSlide.slideSpeed = characterSlide.lastSlideSpeed;
});
characterSlideListContainer.addEventListener("mousedown", e => {
	characterSlide.isDown = true;
	characterSlide.oldX = e.pageX;
	characterSlide.x = e.pageX - e.currentTarget.offsetLeft;
	characterSlide.scrollLeft = e.currentTarget.scrollLeft; // keep pos of scrolling in the scroll container
	characterSlideListContainer.classList.add("active");
});
characterSlideListContainer.addEventListener("mousemove", e => {
	if (!characterSlide.isDown) return;
	const slideDistance = e.pageX - characterSlide.x;
	characterSlide.slideSpeed = e.pageX - characterSlide.oldX;
	characterSlide.oldX = e.pageX;
	e.currentTarget.scrollLeft = characterSlide.scrollLeft - slideDistance;
});
const stopCharacterSlider = () => {
	characterSlide.isDown = false;
	characterSlideListContainer.classList.remove("active");
	cancelAnimationFrame(characterSlide.momentumID);
	loop();
};
characterSlideListContainer.addEventListener("mouseup", stopCharacterSlider);
characterSlideListContainer.addEventListener("mouseleave", stopCharacterSlider);
const loop = () => {
	const factor = 0.9;
	if (characterSlide.slideSpeed > 1.5 || characterSlide.slideSpeed < -1.5) {
		// Finish momentum slide
		characterSlide.slideSpeed *= factor;
		characterSlide.lastSlideSpeed = characterSlide.slideSpeed;
	} else {
		// Done slowing down, round last speed to a sane minimum
		if (characterSlide.shouldSlide) {
			characterSlide.slideSpeed = characterSlide.slideSpeed >= 0 ? 1 : -1;
		} else {
			characterSlide.slideSpeed = 0;
		}
	}

	// If edge is reached, reverse scroll direction
	if (
		characterSlideListContainer.scrollWidth -
			characterSlideSection.scrollWidth ===
			characterSlideListContainer.scrollLeft ||
		characterSlideListContainer.scrollLeft === 0
	) {
		characterSlide.slideSpeed = characterSlide.slideSpeed * -1;
		characterSlide.lastSlideSpeed = characterSlide.slideSpeed;
	}

	characterSlideListContainer.scrollLeft -= characterSlide.slideSpeed;
	characterSlide.momentumID = requestAnimationFrame(() => loop());
};

const capsSelectionList = characterSlideSection.querySelector(
	".slider-selector"
);
const onSwitchCase = e => {
	if (e.target.tagName !== "BUTTON") return;
	capsSelectionList.querySelector(".active").classList.remove("active");
	characterSlideListContainer
		.querySelector(".active")
		.classList.remove("active");

	e.target.classList.add("active");
	characterSlideListContainer
		.querySelector(`[data-value=${e.target.value}]`)
		.classList.add("active");
};
capsSelectionList.addEventListener("click", onSwitchCase);

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
	cursorSize: 1,
	// Internal stuff:
	letters: [],
	waveOffset: 0,
	canvas: null,
	ctx: null,
	width: 0,
	height: 0,
	weightMap: [],
	letterCanvases: [],
	row: 0,
	columns: 0,
	setup(selector, mapType) {
		this.canvas = document.querySelector(selector);
		this.setupCanvas();
		this.setupLetterPositions();
		this.setupWeightMap(mapType);
		this.preRenderChars();
	},
	setLetter(letter, color) {
		this.letter = letter ? letter : this.letter;
		this.color = color ? color : this.color;
		this.preRenderChars();
	},
	resizeCanvas() {
		this.setupCanvas();
		this.setupLetterPositions();
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
		this.columns = Math.floor(this.width / this.cellSize);
		this.rows = Math.floor(this.height / this.cellSize);

		this.letters = [];
		for (let i = 0; i <= this.rows; i++) {
			for (let j = 0; j <= this.columns; j++) {
				this.letters.push({
					x: j * this.cellSize,
					y: i * this.cellSize
				});
			}
		}
	},
	// Array weights to loop through
	setupWeightMap(mapType) {
		this.weightMap = [];
		for (let i = 0; i <= this.steps; i++) {
			if (mapType === "flat") {
				this.weightMap.push(0);
			} else {
				this.weightMap.push(i);
				this.weightMap.unshift(i);
				this.weightMap.unshift(i);
				this.weightMap.unshift(i);
			}
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

			// Determine weight based on cursor distance
			const topOffset = this.canvas.getBoundingClientRect().top; // TODO: perf heavy!
			const spotLightRatio = this.columns / this.rows;
			const weightX = Math.abs((letter.x - mouse.x) / this.columns);
			const weightY = Math.abs(
				(letter.y - mouse.y + topOffset) / this.rows
			);
			let spotLightWeight = Math.round(
				Math.hypot(weightX * spotLightRatio, weightY) * this.cursorSize
			);
			spotLightWeight =
				this.steps - Math.min(Math.max(spotLightWeight, 0), this.steps);

			// Determine weight based on wave
			const waveWeight = this.weightMap[count++ % this.weightMap.length];

			const weight = Math.max(waveWeight, spotLightWeight);

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

// On hover, put new letter in top letterwave
document.querySelector(".arapey-hero-title").addEventListener(
	"mouseover",
	throttle(e => {
		if (e.target.tagName === "SPAN") {
			const newLetter = e.target.textContent;
			topWave.setLetter(newLetter.toUpperCase());
		}
	}, 100)
);

const topWave = Object.create(letterWave);
const bottomWave = Object.create(letterWave);
const initializeApp = () => {
	setupInputs();
	setGridCharacter();

	selectElements.dropdown.forEach(dropdown =>
		dropdown.querySelector("[value='Regular']").classList.add("active")
	);

	// Animate top letterwave ("AAAAAA")
	topWave.setup(".arapey-hero-canvas");
	bottomWave.setup(".arapey-zzzz-canvas", "flat");
	bottomWave.setLetter("Z", "c02020");
	setRAFInterval(() => {
		topWave.renderWave();
		bottomWave.renderWave();
	}, 100);

	// Slide wall of characters
	loop();
};

// General mouse object.
const mouse = {
	x: 0,
	y: 0
};

window.addEventListener("mousemove", e => {
	mouse.x = e.clientX;
	mouse.y = e.clientY;
});

const aboutFontsSection = document.querySelector(
	".about-variable-fonts-section"
);

const aboutFonts = {
	init() {
		this.parentContainerEl.addEventListener("mousedown", this.onMouseDown);
		this.parentContainerEl.addEventListener(
			"mousemove",
			this.onDragCharacter
		);
		this.parentContainerEl.addEventListener(
			"mouseup",
			this.onDropCharacter
		);
		this.parentContainerEl.addEventListener(
			"mouseleave",
			this.onDropCharacter
		);
		this.weightSlider.addEventListener("input", this.onDragInput);
	},
	parentContainerEl: aboutFontsSection.querySelector(
		".character-slider-container"
	),
	containerEl: aboutFontsSection.querySelector(".character-slider"),
	characterEl: aboutFontsSection.querySelector(".character"),
	weightSlider: aboutFontsSection.querySelector(".wght-slider"),
	isDown: false,
	maxFontWeight: 900,
	onDragCharacter: () => {
		if (!aboutFonts.isDown) return;
		aboutFonts.calculateCharacterPos();
	},
	onDragInput: () => {
		aboutFonts.calculateCharacterPos();
	},
	onDropCharacter: () => {
		aboutFonts.isDown = false;
	},
	onMouseDown: () => {
		aboutFonts.isDown = true;
	},
	syncCodeBlock(name, value) {
		const sliderValue = Math.round(value);

		aboutFontsSection
			.querySelector("code")
			.querySelector(`.${name}`).textContent = sliderValue;
	},
	calculateCharacterPos() {
		const distX = mouse.x - this.containerEl.offsetLeft;
		const percentageWidth = (
			distX /
			(this.containerEl.offsetWidth / 100)
		).toFixed(2);
		const posX = Math.max(0, Math.min(percentageWidth, 100));
		let weight = 100 + percentageWidth * 8;
		weight = Math.max(100, Math.min(weight, 900));

		this.weightSlider.value = weight;
		this.characterEl.style.setProperty("--character-pos-x", `${posX}%`);
		this.characterEl.style.setProperty("--wght-slider", `${weight}`);
		this.syncCodeBlock(this.weightSlider.name, weight);

		setupBadge(this.weightSlider, weight);
	}
};

const fontsInUse = {
	element: document.querySelector(".fonts-in-use"),
	scrollPos: 0,
	start: null,
	end: null,
	perc: null
};

window.onscroll = throttle(() => {
	fontsInUse.scrollPos = window.scrollY;

	if (
		fontsInUse.scrollPos > fontsInUse.start &&
		fontsInUse.scrollPos < fontsInUse.uvEnd
	) {
		const offset =
			10 *
			(
				(fontsInUse.scrollPos - fontsInUse.start) /
				fontsInUse.perc
			).toFixed(4);
		fontsInUse.element.style.setProperty("--offset", offset);
	}
}, 100);

// Update variables related to the viewport
const setViewportValues = () => {
	// Recalculate letterWave canvas dimensions
	topWave.resizeCanvas();
	bottomWave.resizeCanvas();

	fontsInUse.start = fontsInUse.element.offsetTop - window.innerHeight;
	fontsInUse.uvEnd =
		fontsInUse.element.offsetTop + fontsInUse.element.offsetHeight;
	fontsInUse.perc = fontsInUse.uvEnd - fontsInUse.start;
};

const designFeatures = {
	container: document.querySelector(".floating-letter-container"),
	setActiveLetter(e) {
		const letter = e.target.closest(".floating-letter");
		if (letter) {
			designFeatures.container
				.querySelector(".active")
				.classList.remove("active");
			letter.classList.add("active");
		}
	}
};

designFeatures.container.addEventListener(
	"click",
	designFeatures.setActiveLetter
);

window.onresize = throttle(setViewportValues, 100);
