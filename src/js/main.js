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
	handle: document.querySelectorAll("#interactive-controls-select"),
	dropdown: document.querySelectorAll(".interactive-controls-options-list")
};

selectElements.handle.forEach(handle => {
	console.log("handle", handle);

	handle.addEventListener("click", e => {
		e.stopPropagation();
		e.currentTarget.nextElementSibling.classList.add("show");
	});
});

selectElements.dropdown.forEach(dropdown => {
	dropdown.addEventListener("click", e => {
		const interactiveElement = dropdown.closest(".interactive-controls");

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

const characterSlide = {
	x: 0,
	oldX: 0,
	isDown: false,
	scrollLeft: 0
};

const characterSlideSection = document.querySelector(
	".character-slide-section"
);

const characterSlideListContainer = characterSlideSection.querySelector(
	".character-slide-list-container"
);

characterSlideListContainer.addEventListener("mousedown", e => {
	characterSlide.isDown = true;
	characterSlide.x = e.pageX - e.currentTarget.offsetLeft;
	characterSlide.scrollLeft = e.currentTarget.scrollLeft; // keep pos of scrolling in the scroll container
	characterSlideListContainer.classList.add("active");
});

characterSlideListContainer.addEventListener("mousemove", e => {
	if (!characterSlide.isDown) return;
	characterSlide.oldX = e.pageX - e.currentTarget.offsetLeft;
	const slideSpeed = characterSlide.oldX - characterSlide.x;

	e.currentTarget.scrollLeft = characterSlide.scrollLeft - slideSpeed;
});

characterSlideListContainer.addEventListener("mouseup", e => {
	characterSlide.isDown = false;
	characterSlideListContainer.classList.remove("active");
});

const capsSelectionList = characterSlideSection.querySelector(
	".caps-switch-list"
);

const capsListItems = capsSelectionList.querySelectorAll("button");

const onSwitchCase = e => {
	capsSelectionList.querySelector(".active").classList.remove("active");
	e.target.classList.add("active");

	characterSlideListContainer
		.querySelector(".active")
		.classList.remove("active");

	const buttonValue = e.target.getAttribute("data-value");
	characterSlideListContainer
		.querySelector(`[data-value=${buttonValue}]`)
		.classList.add("active");
};

capsListItems.forEach(item => item.addEventListener("click", onSwitchCase));

const initializeApp = () => {
	// TODO: set these value in a generic function that
	// can be recalculated on window resize
	// See https://github.com/undercasetype/fraunces-minisite/blob/master/src/js/main.js#L326

	setupInputs();
	setGridCharacter();

	selectElements.dropdown.forEach(dropdown =>
		dropdown.querySelector("[value='Regular']").classList.add("active")
	);
};
