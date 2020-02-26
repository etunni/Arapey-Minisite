import "./assets.js";
import { fontName } from "./font";
import FontFaceObserver from "fontfaceobserver";

const fontTimeOut = 5000; // In milliseconds

// Generic: throttle
// COMMENTED OUT TILL WE NEED IT, TO SATISFY LINTER
// const throttle = (fn, wait) => {
// 	let last, queue;

// 	return function runFn(...args) {
// 		const now = Date.now();
// 		queue = clearTimeout(queue);

// 		if (!last || now - last >= wait) {
// 			fn.apply(null, args);
// 			last = now;
// 		} else {
// 			queue = setTimeout(runFn.bind(null, ...args), wait - (now - last));
// 		}
// 	};
// };

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
		slider.oninput = e => {
			// Set new axis value to text area
			varset(e.target.name, e.target.value);
			// Unselect named instance dropdown
			// Optionally, see if current axes match instance and select that
			if (instances) {
				instances.selectedIndex = -1;
			}

			setGridSliderValue(e.target.value);
		};
	}

	if (instances) {
		instances.onchange = e => {
			const axes = JSON.parse(
				e.target.options[e.target.selectedIndex].value
			);

			for (const axis in axes) {
				// Set new axis value on slider
				interactive.querySelector(`[name=${axis}]`).value = axes[axis];
				// Apply new axis value to text area
				varset(axis, axes[axis]);
			}
		};
	}
}

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
let previousActiveElement = null;

const setGridCharacter = e => {
	if (!e) {
		gridzoom.textContent = "A";
		// initialCharacter.classList.add("character-grid-zoom-active");
		return;
	}

	if (e.target.tagName === "LI") {
		// e.target.classList.add("character-grid-zoom-active");
		gridzoom.textContent = e.target.textContent;
		previousActiveElement = e.target;
	}
};

grid.onmouseleave = () => {
	previousActiveElement.classList.add("active");
};

grid.onmousemove = e => {
	if (previousActiveElement) previousActiveElement.classList.remove("active");
	setGridCharacter(e);
};

const gridSlider = document.querySelector(".weight-grid-slider");
const gridContainer = document.querySelector(".character-grid-inner-container");
const badge = document.querySelector(".interactive-controls-badge");
let badgeOffset;
let badgeOffsetWidth;

const setGridSliderValue = value => {
	const sliderValue = parseFloat(
		value || gridContainer.style.getPropertyValue("--weight-grid-slider")
	);

	const badgePosition =
		(parseFloat(sliderValue) - parseFloat(gridSlider.min)) * badgeOffset -
		badgeOffsetWidth / 2;

	badge.style.setProperty("--badge-position-x", `${badgePosition}px`);
	badge.style.setProperty("--weight", `${sliderValue}`);
	badge.style.setProperty("--weight-string", `"${Math.round(sliderValue)}"`);
};

// Handle select box
const selectElements = {
	handle: document.querySelector(".interactive-controls-select-handle"),
	dropdown: document.querySelector(".interactive-controls-options-list")
};

selectElements.handle.addEventListener("click", () => {
	selectElements.dropdown.classList.add("show");
});

selectElements.dropdown.addEventListener("click", e => {
	if (e.target.type == "button") {
		const textContainer = selectElements.handle.querySelector("span");
		selectElements.handle.setAttribute("value", e.target.value);

		textContainer.textContent = e.target.value;
		selectElements.dropdown.classList.remove("show");
	}
});

const initializeApp = () => {
	// TODO: set these value in a generic function that
	// can be recalculated on window resize
	// See https://github.com/undercasetype/fraunces-minisite/blob/master/src/js/main.js#L326
	badgeOffset =
		gridSlider.offsetWidth /
		(parseFloat(gridSlider.max) - parseFloat(gridSlider.min));
	badgeOffsetWidth = badge.offsetWidth;

	setGridSliderValue();
	setGridCharacter();
};
