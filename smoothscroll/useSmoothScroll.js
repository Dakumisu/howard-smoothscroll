import { getCurrentInstance, onBeforeUnmount, onMounted, watch } from "vue";
import { clamp, dampPrecise, deferredPromise, wait } from "../utils";
import VirtualScroll from "./VirtualScroll";

const DEFAULT_SETTINGS = {
	label: "smoothScroll",
	damping: 0.1,
	direction: "vertical",
	isDesktop: true,
};

export default function useSmoothScroll(opts = {}) {
	const settings = Object.assign(DEFAULT_SETTINGS, opts);

	let vueComponent = getCurrentInstance();
	let unwatchResize = null;

	let label = settings.label;

	let el = null;
	let parent = null;
	let handler = null;
	const isDesktop = !!settings.isDesktop;

	let width = 0;
	let height = 0;
	let targetScroll = 0;
	let scroll = 0;
	let limit = 0;
	let velocity = 0;

	let damping = clamp(settings.damping, 0, 1);
	let smooth = damping > 0;
	let direction = settings.direction || "vertical";

	let isScrollingTo = false;
	let isMoving = false;
	let stopped = false;

	let complete = deferredPromise();

	const api = {
		scrollTo,
		start,
		stop,
		refresh,

		get el() {
			return el;
		},
		get parent() {
			return parent;
		},

		get scroll() {
			return scroll;
		},
		get limit() {
			return limit;
		},
		get velocity() {
			return velocity;
		},
		get direction() {
			return direction;
		},
		get isMoving() {
			return isMoving;
		},
		get isScrollingTo() {
			return isScrollingTo;
		},
		get stopped() {
			return stopped;
		},
		set stopped(v) {
			if (typeof v === "boolean") stopped = v;
		},

		get complete() {
			return complete;
		},
	};

	onMounted(() => init());
	onBeforeUnmount(() => destroy());

	return api;

	async function init() {
		if (handler) return;

		const base = vueComponent.vnode.el;
		el = base.querySelector("[data-scrollable]");
		if (!el) return;

		parent = el.parentElement; // el.parentNode;
		parent.addEventListener("scroll", onScroll, false);
		if (!parent) return;

		handler = new VirtualScroll({
			...opts,
		});

		handler.on((e) => onVirtualScroll(e));

		window.addEventListener("resize", onResize, false);

		update();

		complete.resolve();
	}

	function onResize() {
		if (!el) return;
		height = el.clientHeight;
		width = el.clientWidth;

		const vw = window.innerWidth;
		const vh = window.innerHeight;

		limit = direction === "horizontal" ? width - vw : height - vh;
	}

	function onVirtualScroll({ deltaY, originalEvent: e }) {
		if (stopped || isScrollingTo) {
			e.preventDefault();
			return;
		}

		// prevent native wheel scrolling
		if (smooth && !e.ctrlKey) e.preventDefault();

		targetScroll -= deltaY;
		targetScroll = clamp(0, targetScroll, limit);
	}

	function onScroll(e) {
		if (stopped) return;

		// if scrolling is false we can estimate use isn't
		// scrolling with wheel (cmd+F, keyboard or whatever).

		// So we must scroll to without any easing
		if (!isMoving || !smooth) {
			// where native scroll happens

			const lastScroll = scroll;
			targetScroll = scroll =
				direction === "horizontal"
					? parent.scrollLeft
					: parent.scrollTop;

			velocity = scroll - lastScroll;
		}
	}

	function start() {
		stopped = false;
	}

	function stop() {
		stopped = true;
	}

	function refresh() {
		return onResize();
	}

	function update(dt) {
		if (stopped || !smooth) return;
		// where smooth scroll happens

		let lastScroll = scroll;

		// lerp scroll value
		const ease = isScrollingTo ? 0.05 : damping + (isDesktop ? 0 : 0.2);
		scroll = dampPrecise(scroll, targetScroll, ease, dt, 0.01);
		if (Math.round(scroll) === Math.round(targetScroll)) {
			scroll = lastScroll = targetScroll;
		}
		velocity = scroll - lastScroll;

		if (isMoving) {
			// scroll to lerped scroll value
			direction === "horizontal"
				? parent.scrollTo(scroll, 0)
				: parent.scrollTo(0, scroll);
		}

		isMoving = scroll !== targetScroll;
		if (isScrollingTo) if (Math.abs(velocity) < 1) isScrollingTo = false;

		window.requestAnimationFrame(update);
	}

	function scrollTo(target, { offset = 0 } = {}) {
		let value;

		if (typeof target === "number") {
			// Number
			value = target;
		} else if (target === "top") {
			value = 0;
		} else if (target === "bottom") {
			value = limit;
		} else {
			let node;

			if (typeof target === "string") {
				// CSS selector
				node = document.querySelector(target);
			} else if (target?.nodeType) {
				// Node element
				node = target;
			} else {
				return;
			}

			if (!target) return;
			const rect = node.getBoundingClientRect();
			value =
				(direction === "horizontal" ? rect.left : rect.top) + scroll;
		}

		value += offset;

		targetScroll = value;
		isMoving = true;
		isScrollingTo = typeof target !== "number";

		if (smooth) return;

		scroll = value;

		direction === "horizontal"
			? parent.scrollTo(value, 0)
			: parent.scrollTo(0, value);
	}

	function destroy() {
		if (parent) parent.removeEventListener("scroll", onScroll);
		if (handler) handler.destroy();
		// remove update from raf
		window.cancelAnimationFrame(update);
		el = vueComponent = handler = null;
		window.removeEventListener("resize", onResize);
		complete = null;
	}
}
