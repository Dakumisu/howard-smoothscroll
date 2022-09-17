# Howard SmoothScroll ⚡️
*Vue3 smooth scroll based on lenis made by @studio-freight*


```bash
npm install howard-smoothscroll
```


### Basic usage
```html
<template>
    <div id="app">
        <div class="container" data-scrollable>
            <h1>My App</h1>
            <p>My app is awesome</p>
            <span>So as this smoothScroll</span>
        </div>
    </div>
</template>

<script>
    import { useSmoothScroll } from 'howard-smoothscroll';
    const smoothScroll = useSmoothScroll();
</script>
```

> `data-scrollable` is the attribute that will be used to identify the scrollable area.

&nbsp;

### Options
```ts
const smoothScroll = useSmoothScroll({
    damping: <Number>, // Default: 0.1 (The higher the value, the more the scroll will be brutal)
    direction: <String>, // Default: 'vertical',

    /* Virual scroll parameters (optional) */
    // globalMult = .25
    mouseMultiplier: <Number>, // Default: 1 * globalMult
    touchMultiplier: <Number>, // Default: 8 * globalMult (iPad touch)
    desktopDragMultiplier: <Number>, // Default: 8 * globalMult (Desktop drag)
    firefoxMultiplier: <Number>, // Default: 15 * globalMult (Firefox wheel)
    windowsMultiplier: <Number>, // Default: 15 * globalMult (Windows wheel)
    keyStep: <Number>, // Default: 120
    preventTouch: <Boolean>, // Default: true
    unpreventTouchClass: <String>, // Default: 'vs-touchmove-allowed' (used to disabled touchmove on specific elements)
    useKeyboard: <Boolean>, // Default: false
    useTouch: <Boolean>, // Default: false
    passive: <Boolean>, // Default: false
});
```

&nbsp;

### Methods
```ts
smoothScroll.scrollTo(<Number> || <String> || <HTMLElement>, { offset: <Number> });
```
> Scroll to a specific position (in pixels) or to an element. You can also add an offset to the scroll position.

```ts
smoothScroll.start();
```
> Start the scroll.

```ts
smoothScroll.stop();
```
> Stop the scroll.

```ts
smoothScroll.refresh();
```
> Refresh the scroll. Useful when the scrollable area changes. Fired automatically on window resize.

&nbsp;

### Getters
```ts
smoothScroll.stopped = <Boolean>
```
> If true, the scroll is stopped.

```ts
smoothScroll.complete = <Promise>
```
> Resolved when the scroll is complete.

```ts
smoothScroll.el = <HTMLElement>
```
>The scrollable area.

```ts
smoothScroll.parent = <HTMLElement>
```
> The parent of the scrollable area.

```ts
smoothScroll.scroll = <Number>
```
> The current scroll position.

```ts
smoothScroll.limit = <Number>
```
> The maximum scroll position.

```ts
smoothScroll.velocity = <Number>
```
> The current scroll velocity.

```ts
smoothScroll.direction = <String>
```
> The current scroll direction.

```ts
smoothScroll.isMoving = <Boolean>
```
> If true, the scroll is moving.

```ts
smoothScroll.isScrollingTo = <Boolean>
```
> If true, the scroll is scrolling to a specific position.

&nbsp;

### Setters
```ts
smoothScroll.stopped = <Boolean>
```
> If true, stop the scroll.

```ts
smoothScroll.damping = <Number>
```
> The higher the value, the more the scroll will be brutal.

```ts
smoothScroll.direction = <String>
```
> 'vertical' or 'horizontal'.

&nbsp;

### Events
```ts
smoothScroll.on((virualScroll, getters) => {
    // const { scroll, limit, velocity, ...etc } = getters;
});
```
> Fired when the scroll is updated.
