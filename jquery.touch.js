/* jquery.touch v0.3.0-dev | (c) @ajlkn | github.com/ajlkn/jquery.touch | MIT licensed */

(function($) {

	var $document = $(document),
		dragTarget = null;

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Defaults
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		/**
		 * Default settings.
		 *
		 * @type {object}
		 */
		var defaultSettings = {

			// If true, mouse clicks and movements will also trigger touch events.
				useMouse: true,

			// If true, certain events (like drag) can continue to track even if the mouse cursor leaves the originating element.
				trackDocument: false,

			// If true, when "trackDocument" is enabled, coordinates will be normalized to the confines of the originating element.
				trackDocumentNormalize: false,

			// Disables "click" event (prevents both "tap" and "click" firing on certain elements like <label>).
				noClick: false,

			// Distance from tap to register a drag (lower = more sensitive, higher = less sensitive).
				dragThreshold: 10,

			// Time to wait before registering a drag (needs to be high enough to not interfere with scrolling).
				dragDelay: 200,

			// Distance from tap to register a swipe (lower = more sensitive, higher = less sensitive).
				swipeThreshold: 30,

			// Delay between taps.
				tapDelay: 250,

			// Time to wait before triggering "tapAndHold".
				tapAndHoldDelay: 500,

			// Globally prevent default behavior for specific classes of gesture events.
			// NOTE: Previously this was "allowDefault", and jquery.touch's behavior was reversed (block all, selectively allow).
				preventDefault: {
					drag: false,
					swipe: false,
					tap: false
				}

		};

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// touch Class
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		/**
		 * Touch class. Keeps track of all touch event states.
		 *
		 * @param {jQuery} $element Target element.
		 * @param {jQuery} $sourceElement Source element.
		 * @param {object} settings Settings.
		 */
		function touch($element, $sourceElement, settings) {

			var t = this;

			t.settings = settings;

			// Properties.
				t.$element = $element;
				t.$sourceElement = $sourceElement;
				t.inTap = false;
				t.inDrag = false;
				t.tapStart = null;
				t.dragStart = null;
				t.timerTap = null;
				t.timerTapAndHold = null;
				t.tapScrollTop = null;
				t.mouseDown = false;
				t.x = null;
				t.y = null;
				t.ex = null;
				t.ey = null;
				t.taps = 0;
				t.started = false;
				t.ended = false;

			// Hack: Turn off useMouse if the device supports touch events. Temporary solution, as this may break things in environments with mixed input types (mouse + touch).
			/*
				if (!!('ontouchstart' in window))
					t.settings.useMouse = false;
			*/

		}

		/**
		 * Determines if the target element uses a particular class of gesture.
		 *
		 * @param {string} x Gesture class.
		 * @return {bool} If true, target element has at least one bound event for the specified gesture class. If false, it doesn't.
		 */
		touch.prototype.uses = function(x) {

			var events = $._data(this.$sourceElement[0], 'events');

			switch (x) {

				case 'swipe':
					return (events.hasOwnProperty(x) || events.hasOwnProperty('swipeUp') || events.hasOwnProperty('swipeDown') || events.hasOwnProperty('swipeLeft') || events.hasOwnProperty('swipeRight'));

				case 'drag':
					return (events.hasOwnProperty(x) || events.hasOwnProperty('dragStart') || events.hasOwnProperty('dragEnd'));

				case 'tapAndHold':
				case 'doubleTap':
					return events.hasOwnProperty(x);

				case 'tap':
					return (events.hasOwnProperty(x) || events.hasOwnProperty('doubleTap') || events.hasOwnProperty('tapAndHold'));

				default:
					break;

			}

			return false;

		};

		/**
		 * Determines if the user scrolled since a gesture was initiated.
		 *
		 * @return {bool} If true, user scrolled. If false, user did not scroll.
		 */
		touch.prototype.scrolled = function() {
			return (this.tapScrollTop !== null && (this.tapScrollTop != $document.scrollTop()));
		};

		/**
		 * Cancels all touch events.
		 *
		 * @param {bool} mouseDown If true, also cancel events relying on mouseDown.
		 */
		touch.prototype.cancel = function(mouseDown) {

			var t = this;

			t.taps = 0;
			t.inTap = false;
			t.inDrag = false;
			t.tapStart = null;
			t.dragStart = null;

			if (mouseDown)
				t.mouseDown = false;

		};

		/**
		 * Touch start handler.
		 *
		 * @param {object} event Original event.
		 * @param {integer} x X position.
		 * @param {integer} y Y position.
		 */
		touch.prototype.doStart = function(event, x, y) {

			var t = this,
				offset = t.$element.offset();

			// Prevent original event from bubbling.
				event.stopPropagation();

			// Prevent default if the element has a swipe or drag event (and the user has "preventDefault" turned on).
				if ((t.uses('drag') && t.settings.preventDefault.drag)
				||	(t.uses('swipe') && t.settings.preventDefault.swipe)
				||	(t.uses('tap') && t.settings.preventDefault.tap))
					event.preventDefault();

			// Hack: Clear touch callout/user select stuff on Webkit if the element has a tapAndHold event.
				if (t.uses('tapAndHold'))
					t.$element
						.css('-webkit-touch-callout', 'none')
						.css('-webkit-user-select', 'none');

			// Set x, y, ex, ey.
				t.x = x;
				t.y = y;
				t.ex = x - offset.left;
				t.ey = y - offset.top;

			// Set timestamp.
				t.tapStart = Date.now();
				t.tapScrollTop = $document.scrollTop();

			// Set timers.

				// tap.

					// Stop existing timer.
						clearTimeout(t.timerTap);

					// Set new timer.
						t.timerTap = setTimeout(function() {

							// In a valid tap? Trigger "tap".
								if (t.inTap && t.taps > 0) {

									t.$element.trigger(
										(t.taps == 2 ? 'doubleTap' : 'tap'),
										{
											'taps': t.taps,
											'x': t.x,
											'y': t.y,
											'ex': t.ex,
											'ey': t.ey,
											'duration': Date.now() - t.tapStart,
											'event': event
										}
									);

									t.cancel();

								}

							// Clear tap timer.
								t.timerTap = null;

						}, t.settings.tapDelay);

				// tapAndHold.

					if (t.uses('tapAndHold')) {

						// Stop existing timer.
							clearTimeout(t.timerTapAndHold);

						// Set new timer.
							t.timerTapAndHold = setTimeout(function() {

								// Use tapAndHold and in a valid tap? Trigger "tapAndHold".
									if (t.inTap) {

										t.$element.trigger(
											'tapAndHold',
											{
												'x': t.x,
												'y': t.y,
												'ex': t.ex,
												'ey': t.ey,
												'duration': Date.now() - t.tapStart,
												'event': event
											}
										);

										t.cancel();

									}

								// Clear tapAndHold timer.
									t.timerTapAndHold = null;

							}, t.settings.tapAndHoldDelay);

					}

			// We're now in a tap.
				t.inTap = true;

		};

		/**
		 * Touch move handler.
		 *
		 * @param {object} event Original event.
		 * @param {integer} x X position.
		 * @param {integer} y Y position.
		 */
		touch.prototype.doMove = function(event, x, y) {

			var	t = this,
				offset = t.$element.offset(),
				diff = (Math.abs(t.x - x) + Math.abs(t.y - y)) / 2;

			// Prevent original event from bubbling.
				event.stopPropagation();

			// Prevent default if the element has a swipe or drag event (and the user has "preventDefault" turned on).
				if ((t.uses('swipe') && t.settings.preventDefault.swipe)
				|| (t.uses('drag') && t.settings.preventDefault.drag))
					event.preventDefault();

			// Scrolled? Bail.
			/*
				if (t.scrolled()) {

					t.cancel();
					return;

				}
			*/

			// In a drag? Trigger "drag".
				if (t.inDrag
				&&	dragTarget == t)
					t.$element.trigger(
						'drag',
						{
							'x': x,
							'y': y,
							'ex': x - offset.left,
							'ey': y - offset.top,
							'event': event
						}
					);

			// If we've moved past the drag threshold ...
				else if (diff > t.settings.dragThreshold) {

					// Enough time to start?
						if (Date.now() - t.tapStart < t.settings.dragDelay) {

							t.cancel();
							return;

						}

					// Cancel everything.
						t.cancel();

					// We're now in a drag.
						t.inDrag = true;

					// Set timestamp
						t.dragStart = Date.now();

					// Prevent default if the element has a drag event.
						if (t.uses('drag'))
							event.preventDefault();

					// Trigger "dragStart".
						t.$element.trigger(
							'dragStart',
							{
								'x': x,
								'y': y,
								'ex': x - offset.left,
								'ey': y - offset.top,
								'event': event
							}
						);

					// Set drag target.
						dragTarget = t;

				}

		};

		/**
		 * Touch end handler.
		 *
		 * @param {object} event Original event.
		 * @param {integer} x X position.
		 * @param {integer} y Y position.
		 */
		touch.prototype.doEnd = function(event, x, y) {

			var	t = this,
				offset = t.$element.offset(),
				dx = Math.abs(t.x - x),
				dy = Math.abs(t.y - y),
				distance,
				velocity,
				duration;

			// Prevent original event from bubbling.
				event.stopPropagation();

			// Scrolled? Bail.
			/*
				if (t.scrolled()) {

					t.cancel();
					return;

				}
			*/

			// If we're in a tap ...
				if (t.inTap) {

					// Increase the tap count.
						t.taps++;

					// Did we hit an end tap condition?
						if	(!t.timerTap // Timer ran out?
						||	(t.taps == 1 && !t.uses('doubleTap')) // Got one tap (and the element doesn't have a doubleTap event)?
						||	(t.taps == 2 && t.uses('doubleTap'))) { // Got two taps (and the element does have a doubleTap event)?

							t.$element.trigger(
								(t.taps == 2 ? 'doubleTap' : 'tap'),
								{
									'taps': t.taps,
									'x': t.x,
									'y': t.y,
									'ex': t.ex,
									'ey': t.ey,
									'duration': Date.now() - t.tapStart,
									'event': event
								}
							);

							t.cancel();

						}

				}

			// If we're in a drag ...
				else if (t.inDrag) {

					// Calculate some stuff.
						duration = Date.now() - t.dragStart;
						distance = Math.sqrt(Math.pow(Math.abs(t.x - x), 2) + Math.pow(Math.abs(t.y - y), 2));
						velocity = distance / duration;

					// Trigger "dragEnd".
						t.$element.trigger(
							'dragEnd',
							{
								'start': {
									'x': t.x,
									'y': t.y,
									'ex': t.ex,
									'ey': t.ey
								},
								'end': {
									'x': x,
									'y': y,
									'ex': x - offset.left,
									'ey': y - offset.top
								},
								'distance': distance,
								'duration': duration,
								'velocity': velocity,
								'event': event
							}
						);

					// Clear drag target.
						dragTarget = null;

					// Swipe?
						if (dx > t.settings.swipeThreshold
						||	dy > t.settings.swipeThreshold) {

							// Trigger "swipe".
								t.$element.trigger(
									'swipe',
									{
										'distance': distance,
										'duration': duration,
										'velocity': velocity,
										'event': event
									}
								);

							// Left/Right?
								if (dx > dy)
								{
									// Calculate velocity.
										velocity = dx / duration;

									// Left? Trigger "swipeLeft".
										if (x < t.x)
											t.$element.trigger(
												'swipeLeft',
												{
													'distance': dx,
													'duration': duration,
													'velocity': velocity,
													'event': event
												}
											);

									// Right? Trigger "swipeRight".
										else
											t.$element.trigger(
												'swipeRight',
												{
													'distance': dx,
													'duration': duration,
													'velocity': velocity,
													'event': event
												}
											);
								}

							// Up/Down?.
								else if (dy > dx) {

									// Calculate velocity.
										velocity = dy / duration;

									// Up? Trigger "swipeUp".
										if (y < t.y)
											t.$element.trigger(
												'swipeUp',
												{
													'distance': dy,
													'duration': duration,
													'velocity': velocity,
													'event': event
												}
											);

									// Down? Trigger "swipeDown".
										else
											t.$element.trigger(
												'swipeDown',
												{
													'distance': dy,
													'duration': duration,
													'velocity': velocity,
													'event': event
												}
											);

								}

						}

					t.inDrag = false;

				}

		};

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// jQuery function
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		/**
		 * Enables touch events on a selector.
		 *
		 * @param {object} userSettings User settings.
		 */
		$.fn.enableTouch = function(userSettings) {

			var $this = $(this);

			// Multiple elements?
				if (this.length > 1) {

					for (var i=0; i < this.length; i++)
						$.enableTouch($(this[i]), userSettings);

				}

			// Single element?
				else if (this.length == 1)
					$.enableTouch($this, userSettings);

			return $this;

		};

		$.enableTouch = function($this, userSettings) {

			var settings = {};

			// Build settings.
				settings = $.extend(settings, defaultSettings);
				settings = $.extend(settings, userSettings);

			// Disable click event?
			// Needed for some elements, otherwise "click" triggers in addition to "tap".
				if (settings.noClick)
					$this
						.on('click', function(event) {
							event.preventDefault();
						});

			// Bind touch events.

				// Start (touchstart).
					var onTouchStart = function(event) {

						var	$element = $(this),
							touch = getTouch($element, $this, settings);

						// Mark as started.
							touch.started = true;

						// Start.
							touch.doStart(
								event,
								event.originalEvent.touches[0].pageX,
								event.originalEvent.touches[0].pageY
							);

						// Clear started after delay.
							setTimeout(function() {
								touch.started = false;
							}, 1000);

					};

					$this
						.on('touchstart', onTouchStart)
						.on('touchstart', '*', onTouchStart);

				// Move (touchmove).
					var onTouchMove = function(event) {

						var	$element = $(this),
							touch = getTouch($element, $this, settings);

						// Get position.
							var pos = fixPos(
								touch,
								event.originalEvent.touches[0].pageX,
								event.originalEvent.touches[0].pageY
							);

						// Move.
							touch.doMove(
								event,
								pos.x,
								pos.y
							);

					};

					$this
						.on('touchmove', onTouchMove)
						.on('touchmove', '*', onTouchMove);

				// End (touchend).
					var onTouchEnd = function(event) {

						var	$element = $(this),
							touch = getTouch($element, $this, settings);

						// Mark as ended.
							touch.ended = true;

						// Get position.
							var pos = fixPos(
								touch,
								event.originalEvent.changedTouches[0].pageX,
								event.originalEvent.changedTouches[0].pageY
							);

						// End.
							touch.doEnd(
								event,
								pos.x,
								pos.y
							);

						// Clear ended after delay.
							setTimeout(function() {
								touch.ended = false;
							}, 1000);

					};

					$this
						.on('touchend', onTouchEnd)
						.on('touchend', '*', onTouchEnd);

			// If useMouse is enabled, bind mouse events as well.
				if (settings.useMouse) {

					// Start (mousedown).
						var onMouseDown = function(event) {

							var	$element = $(this),
								touch = getTouch($element, $this, settings);

							// If we've already been started (which would *only* happen if touchstart were just triggered),
							// bail immediately so we don't attempt to double start.
								if (touch.started)
									return false;

							// Mark mouse down.
								touch.mouseDown = true;

							// Start.
								touch.doStart(
									event,
									event.pageX,
									event.pageY
								);

						};

						$this
							.on('mousedown', onMouseDown)
							.on('mousedown', '*', onMouseDown);

					// Move (mousemove).
						var onMouseMove = function(event) {

							var	$element = $(this),
								touch = getTouch($element, $this, settings);

							// If mouse down, move.
								if (touch.mouseDown)
									touch.doMove(
										event,
										event.pageX,
										event.pageY
									);

						};

						$this
							.on('mousemove', onMouseMove)
							.on('mousemove', '*', onMouseMove);

					// End (mouseup).
						var onMouseUp = function(event) {

							var	$element = $(this),
								touch = getTouch($element, $this, settings);

							// If we've already ended (which would *only* happen if touchend were just triggered),
							// bail immediately so we don't attempt to double end.
								if (touch.ended)
									return false;

							// Trigger document's mouseup handler (in case this event was fired on this element while dragging another).
								$document.triggerHandler('mouseup', event);

							// End.
								touch.doEnd(
									event,
									event.pageX,
									event.pageY
								);

							// Clear mouse down.
								touch.mouseDown = false;

						};

						$this
							.on('mouseup', onMouseUp)
							.on('mouseup', '*', onMouseUp);

				}

			// No document tracking? Watch for "mouseleave".
				if (!settings.trackDocument)
					$this
						.on('mouseleave', function(event) {

							var	$element = $(this),
								touch = getTouch($element, $this, settings);

							touch.doEnd(
								event,
								event.pageX,
								event.pageY
							);

							touch.mouseDown = false;

						})


		};

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Init.
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		/**
		 * Gets an element's touch property.
		 *
		 * @param {jQuery} $element Target element.
		 * @param {jQuery} $sourceElement Source element.
		 * @param {object} userSettings User settings.
		 */
		function getTouch($element, $sourceElement, userSettings) {

			var element = $element[0];

			// No touch property? Initialize it.
				if (typeof element._touch == 'undefined')
					element._touch = new touch($element, $sourceElement, userSettings);

			return element._touch;

		};

		/**
		 * Adjusts a pair of coordinates to ensure they're within the boundaries of a given touch object's element.
		 *
		 * @param t {object} Touch object.
		 * @param x {integer} X value.
		 * @param y {integer} y value.
		 * @return {object} New coordinates.
		 */
		function fixPos(t, x, y) {

			var offset, width, height, nx, ny;

			// Get element's offset and dimenions.
				offset = t.$element.offset(),
				width = t.$element.width(),
				height = t.$element.height();

			// Normalize x and y.
				nx = Math.min(Math.max(x, offset.left), offset.left + width);
				ny = Math.min(Math.max(y, offset.top), offset.top + height);

			// Return new coordinates.
				return {
					x: nx,
					y: ny
				};

		};

		// Documnet-level events (mouse only).
		// These are used to trigger drag events on an element even if the mouse cursor is beyond its boundaries.
			$document
				.on('mousemove', function(event) {

					var t = dragTarget;

					if (t
					&&	t.settings.useMouse
					&&	t.mouseDown
					&&	t.settings.trackDocument) {

						// Get coordinates.
							var	x = event.pageX,
								y = event.pageY;

						// Normalize coordinates?
							if (t.settings.trackDocumentNormalize) {

								var pos = fixPos(
									t,
									x,
									y
								);

								x = pos.x;
								y = pos.y;

							}

						// Trigger "move".
							t.doMove(
								event,
								x,
								y
							);

					}

				})
				.on('mouseup', function(event, previousEvent) {

					var t = dragTarget;

					if (t
					&&	t.settings.useMouse
					&&	t.settings.trackDocument) {

						// Previous event provided? Use that instead.
							if (typeof previousEvent !== 'undefined')
								event = previousEvent;

						// No pageX in event? "mouseup" likely already handled by originating element, so bail.
							if (!('pageX' in event))
								return;

						// Get coordinates.
							var	x = event.pageX,
								y = event.pageY;

						// Normalize coordinates?
							if (t.settings.trackDocumentNormalize) {

								var pos = fixPos(
									t,
									x,
									y
								);

								x = pos.x;
								y = pos.y;

							}

						// Trigger "end".
							t.doEnd(
								event,
								x,
								y
							);

						// Clear mouseDown state.
							t.mouseDown = false;

					}

				});

})(jQuery);