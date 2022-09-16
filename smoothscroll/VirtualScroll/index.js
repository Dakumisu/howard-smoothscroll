import Emitter from '../TinyEmitter';
import { getSupport } from './support';
import { keyCodes } from './keycodes';

const EVT_ID = 'virtualscroll';
let support;

export default class VirtualScroll {
	constructor(options) {
		this._el = window;
		if (options && options.el) {
			this._el = options.el;
			delete options.el;
		}

		if (!support) support = getSupport();

		const globalMult = 0.25;
		this._options = Object.assign(
			{
				mouseMultiplier: 1 * globalMult,
				touchMultiplier: 8 * globalMult, // iPad touch
				desktopDragMultiplier: 8 * globalMult, // Desktop drag
				firefoxMultiplier: 15 * globalMult, // Firefox wheel
				windowsMultiplier: 15 * globalMult, // Windows wheel
				keyStep: 120,
				preventTouch: true,
				unpreventTouchClass: 'vs-touchmove-allowed',
				useKeyboard: false,
				useTouch: false,
				passive: false,
			},
			options,
		);

		this._emitter = new Emitter();
		this._event = {
			y: 0,
			x: 0,
			deltaX: 0,
			deltaY: 0,
		};
		this._touchStart = {
			x: null,
			y: null,
		};
		this._bodyTouchAction = null;

		if (this._options.passive !== undefined) {
			this.listenerOptions = { passive: this._options.passive };
		}
	}

	_notify(e) {
		let evt = this._event;
		evt.x += evt.deltaX;
		evt.y += evt.deltaY;

		this._emitter.emit(EVT_ID, {
			x: evt.x,
			y: evt.y,
			deltaX: evt.deltaX,
			deltaY: evt.deltaY,
			originalEvent: e,
		});
	}

	_onWheel = (e) => {
		let options = this._options;
		let evt = this._event;

		// In Chrome and in Firefox (at least the new one)
		evt.deltaX = e.wheelDeltaX || e.deltaX * -1;
		evt.deltaY = e.wheelDeltaY || e.deltaY * -1;

		// for our purpose deltamode = 1 means user is on a wheel mouse, not touch pad
		// real meaning: https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent#Delta_modes
		if (support.isFirefox && e.deltaMode === 1) {
			evt.deltaX *= options.firefoxMultiplier;
			evt.deltaY *= options.firefoxMultiplier;
		}

		if (support.isWindows) {
			evt.deltaX *= options.windowsMultiplier;
			evt.deltaY *= options.windowsMultiplier;
		}

		evt.deltaX *= options.mouseMultiplier;
		evt.deltaY *= options.mouseMultiplier;

		this._notify(e);
	};

	_onMouseWheel = (e) => {
		let evt = this._event;

		// In Safari, IE and in Chrome if 'wheel' isn't defined
		evt.deltaX = e.wheelDeltaX ? e.wheelDeltaX : 0;
		evt.deltaY = e.wheelDeltaY ? e.wheelDeltaY : e.wheelDelta;

		this._notify(e);
	};

	_onTouchStart = (e) => {
		let t = e.targetTouches ? e.targetTouches[0] : e;
		this._touchStart.x = t.pageX;
		this._touchStart.y = t.pageY;
	};

	_onTouchMove = (e) => {
		let options = this._options;
		if (options.preventTouch && !e.target.classList.contains(options.unpreventTouchClass)) {
			e.preventDefault();
		}

		let evt = this._event;

		let t = e.targetTouches ? e.targetTouches[0] : e;

		evt.deltaX = (t.pageX - this._touchStart.x) * options.touchMultiplier;
		evt.deltaY = (t.pageY - this._touchStart.y) * options.touchMultiplier;

		this._touchStart.x = t.pageX;
		this._touchStart.y = t.pageY;

		this._notify(e);
	};

	_onMouseStart = (e) => {
		this.mousedown = true;
		let t = e.targetTouches ? e.targetTouches[0] : e;
		this._touchStart.x = t.pageX;
		this._touchStart.y = t.pageY;
	};

	_onMouseMove = (e) => {
		if (!this.mousedown) return;
		let options = this._options;
		if (options.preventTouch && !e.target.classList.contains(options.unpreventTouchClass)) {
			e.preventDefault();
		}

		let evt = this._event;

		let t = e.targetTouches ? e.targetTouches[0] : e;

		evt.deltaX = (t.pageX - this._touchStart.x) * options.desktopDragMultiplier;
		evt.deltaY = (t.pageY - this._touchStart.y) * options.desktopDragMultiplier;

		this._touchStart.x = t.pageX;
		this._touchStart.y = t.pageY;

		this._notify(e);
	};

	_onMouseStop = (e) => {
		this.mousedown = false;
	};

	_onKeyDown = (e) => {
		let evt = this._event;
		evt.deltaX = evt.deltaY = 0;
		let windowHeight = window.innerHeight - 40;

		switch (e.keyCode) {
			case keyCodes.LEFT:
			case keyCodes.UP:
				evt.deltaY = this._options.keyStep;
				break;

			case keyCodes.RIGHT:
			case keyCodes.DOWN:
				evt.deltaY = -this._options.keyStep;
				break;
			case keyCodes.SPACE:
				evt.deltaY = windowHeight * (e.shiftKey ? 1 : -1);
				break;
			default:
				return;
		}

		this._notify(e);
	};

	_bind() {
		if (support.hasWheelEvent) {
			this._el.addEventListener('wheel', this._onWheel, this.listenerOptions);
		}

		if (support.hasMouseWheelEvent) {
			this._el.addEventListener('mousewheel', this._onMouseWheel, this.listenerOptions);
		}

		if (support.hasTouch && this._options.useTouch) {
			this._el.addEventListener('touchstart', this._onTouchStart, this.listenerOptions);
			this._el.addEventListener('touchmove', this._onTouchMove, this.listenerOptions);
		}

		if (this._options.useTouch) {
			this._el.addEventListener('mousedown', this._onMouseStart, this.listenerOptions);
			this._el.addEventListener('mousemove', this._onMouseMove, this.listenerOptions);
			this._el.addEventListener('mouseup', this._onMouseStop, this.listenerOptions);
		}

		if (support.hasPointer && support.hasTouchWin && this._options.useTouch) {
			this._bodyTouchAction = document.body.style.msTouchAction;
			document.body.style.msTouchAction = 'none';
			this._el.addEventListener('MSPointerDown', this._onTouchStart, true);
			this._el.addEventListener('MSPointerMove', this._onTouchMove, true);
		}

		if (support.hasKeyDown && this._options.useKeyboard) {
			document.addEventListener('keydown', this._onKeyDown);
		}
	}

	_unbind() {
		if (support.hasWheelEvent) {
			this._el.removeEventListener('wheel', this._onWheel);
		}

		if (support.hasMouseWheelEvent) {
			this._el.removeEventListener('mousewheel', this._onMouseWheel);
		}

		if (support.hasTouch) {
			this._el.removeEventListener('touchstart', this._onTouchStart);
			this._el.removeEventListener('touchmove', this._onTouchMove);
		}

		if (this._options.useTouch) {
			this._el.removeEventListener('mousedown', this._onMouseStart);
			this._el.removeEventListener('mousemove', this._onMouseMove);
			this._el.removeEventListener('mouseup', this._onMouseStop);
		}

		if (support.hasPointer && support.hasTouchWin) {
			document.body.style.msTouchAction = this._bodyTouchAction;
			this._el.removeEventListener('MSPointerDown', this._onTouchStart, true);
			this._el.removeEventListener('MSPointerMove', this._onTouchMove, true);
		}

		if (support.hasKeyDown && this._options.useKeyboard) {
			document.removeEventListener('keydown', this._onKeyDown);
		}
	}

	on(cb, ctx) {
		this._emitter.on(EVT_ID, cb, ctx);

		let events = this._emitter.e;

		if (events && events[EVT_ID] && events[EVT_ID].length === 1) this._bind();
	}

	off(cb, ctx) {
		this._emitter.off(EVT_ID, cb, ctx);

		let events = this._emitter.e;
		if (!events[EVT_ID] || events[EVT_ID].length <= 0) this._unbind();
	}

	destroy() {
		this._emitter.off();
		this._unbind();
	}
}
