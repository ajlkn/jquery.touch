# jquery.touch: Touch gestures for jQuery

Adds a bunch of touch gesture events to jQuery (with mouse support!)

Requires jQuery 1.7+. Tested on Android (latest), iOS (latest), Firefox, Chrome, Safari, and IE7-10.

## Usage

Load it after jQuery:

```html
<script src="http://code.jquery.com/jquery-x.x.x.min.js"></script>
<script src="jquery.touch.js"></script>
```

Use enableTouch() to add touch gesture events to a selector:

```js
var foo = $('.foo');
foo.enableTouch();
```

Bind stuff like you normally would:

```js
foo
	.on('tap', function(e) { alert('Tapped!'); })
	.on('doubleTap', function(e) { alert('DOUBLE tapped!'); })
	.on('swipeLeft', function(e) { alert('Swiped left!'); });
```

And that's about it.

## Supported Gesture Events

- tap
- doubleTap
- dragStart
- drag
- dragEnd
- swipe
- swipeUp
- swipeDown
- swipeLeft
- swipeRight
- tapAndHold

## Config

enableTouch() can optionally take a config to override some or all of the following defaults= settings:

```js
foo.enableTouch({
	useTapAndHold:		false,		// If true, enable tapAndHold event
	useMouse:			true,		// If true, mouse clicks and movements will also trigger touch events
	dragThreshold:		10,			// Distance from tap to register a drag (lower = more sensitive, higher = less sensitive)
	swipeThreshold:		30,			// Distance from tap to register a swipe (lower = more sensitive, higher = less sensitive)
	tapLimit:			2,			// Maximum number of taps allowed by "tap"
	tapDelay:			250,		// Delay between taps
	tapAndHoldDelay:	1000		// Time to wait before triggering "tapAndHold"
});
```

## Gesture Data

Almost every event passes back an object with data on the triggering gesture. For example:

```js
foo
	.on('tap', function(e, info) { 
		alert('Tapped at ' + info.x + ', ' + info.y + '!');
	});
```

And here's what you'll find in that object for each event:

### tap, doubleTap, tapAndHold, dragStart, drag

- x: X position (relative to document)
- y: Y position  (relative to document)
- ex: X position (relative to element)
- ey: Y position (relative to element)

### dragEnd

- start: x/y/ex/ey of starting point
- end: x/y/ex/ey of end point
- distance: Distance dragged (in pixels)
- duration: Time spent dragging (in ms)
- velocity: Dragging velocity (in pixels/ms)

### swipe, swipeUp, swipeDown, swipeLeft, swipeRight

- distance: Distance swiped (in pixels)
- duration: Time spent swiping (in ms)
- velocity: Swiping velocity (in pixels/ms)

## The Future

- Multitouch gestures (pinch, zoom, etc.)
- More demos

## License

jquery.touch.js is released under the MIT license.

Copyright © 2013 n33

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
