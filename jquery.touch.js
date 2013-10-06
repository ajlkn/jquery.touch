/* jquery.touch.js v0.1 | (c) n33 | n33.co | MIT licensed */

(function($) {

	var d = $(document);

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Defaults
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		
		var defaultSettings = {
			useTapAndHold:		false,	// If true, enable tapAndHold event
			useMouse:		true,	// If true, mouse clicks and movements will also trigger touch events
			dragThreshold:		10,	// Distance from tap to register a drag (lower = more sensitive, higher = less sensitive)
			dragDelay: 		100,	// Time to wait before registering a drag (needs to be high enough to not interfere with scrolling)
			swipeThreshold:		30,	// Distance from tap to register a swipe (lower = more sensitive, higher = less sensitive)
			tapLimit:		2,	// Maximum number of taps allowed by "tap"
			tapDelay:		250,	// Delay between taps
			tapAndHoldDelay:	1000	// Time to wait before triggering "tapAndHold"
		};

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// touchJS Class
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

		function touchJS(element, userSettings)
		{

			var t = this;

			// Settings
				t.settings = $.extend(defaultSettings, userSettings);

			// Properties
				t.element = element;
				t.inTap = false;
				t.inDrag = false;
				t.tapStart = null;
				t.dragStart = null;
				t.timerTap = null;
				t.timerTapAndHold = null;
				t.tapScrollTop = null;
				t.x = null;
				t.y = null;
				t.ex = null;
				t.ey = null;
				t.taps = 0;
			
			// Init
				t.init();

		}

		touchJS.prototype.init = function()
		{

			var t = this;
		
			// Bind touch events
				t.element
					.on('touchstart', function(e) {
					
						t.doStart(
							e,
							e.originalEvent.touches[0].pageX,
							e.originalEvent.touches[0].pageY
						);
					
					})
					.on('touchmove', function(e) {
						
						t.doMove(
							e,
							e.originalEvent.changedTouches[0].pageX,
							e.originalEvent.changedTouches[0].pageY
						);

					})
					.on('touchend', function(e) {
					
						t.doEnd(
							e,
							e.originalEvent.changedTouches[0].pageX,
							e.originalEvent.changedTouches[0].pageY
						);
					
					});

			// If useMouse is enabled, bind mouse events as well
				if (t.settings.useMouse)
				{
					t.mouseDown = false;
					
					t.element
						.on('mousedown', function(e) {
							
							t.mouseDown = true;
							
							t.doStart(
								e,
								e.pageX,
								e.pageY
							);
						
						})
						.on('mousemove', function(e) {

							if (t.mouseDown)
							{
								t.doMove(
									e,
									e.pageX,
									e.pageY
								);
							}

						})
						.on('mouseup mouseleave', function(e) {

							t.mouseDown = false;
							
							t.doEnd(
								e,
								e.pageX,
								e.pageY
							);

						});
				}

		}
		
		touchJS.prototype.scrolled = function()
		{
			return (this.tapScrollTop != d.scrollTop());
		};
		
		touchJS.prototype.cancel = function()
		{

			var t = this;
		
			t.taps = 0;
			t.inTap = false;
			t.inDrag = false;
			t.tapStart = null;
			t.dragStart = null;

		};

		touchJS.prototype.doStart = function(e, x, y)
		{

			var t = this,
				offset = t.element.offset();
		
			// Set x, y, ex, ey
				t.x = x;
				t.y = y;
				t.ex = x - offset.left;
				t.ey = y - offset.top;

			// Set timestamp
				t.tapStart = Date.now();
				t.tapScrollTop = d.scrollTop();
		
			// Set timers
				
				// tap
					
					// Stop existing timer
						window.clearTimeout(t.timerTap);
				
					// Set new timer
						t.timerTap = window.setTimeout(function() {
						
							// In a valid tap? Trigger "tap"
								if (t.inTap && t.taps > 0)
								{
									e.preventDefault();
								
									t.element.trigger(
										(t.taps == 2 ? 'doubleTap' : 'tap'),
										{
											'taps': t.taps, 
											'x': t.x, 
											'y': t.y, 
											'ex': t.ex, 
											'ey': t.ey, 
											'duration': Date.now() - t.tapStart 
										}
									);
									
									t.cancel();
								}
							
							// Clear tap timer
								t.timerTap = null;
						
						}, t.settings.tapDelay);
					
				// tapAndHold
					
					// Stop existing timer
						window.clearTimeout(t.timerTapAndHold);

					// Set new timer
						t.timerTapAndHold = window.setTimeout(function() {
						
							// Use tapAndHold and in a valid tap? Trigger "tapAndHold"
								if (t.settings.useTapAndHold && t.inTap)
								{
									e.preventDefault();

									t.element.trigger(
										'tapAndHold', 
										{ 
											'x': t.x, 
											'y': t.y, 
											'ex': t.ex, 
											'ey': t.ey, 
											'duration': Date.now() - t.tapStart 
										}
									);
									
									t.cancel();
								}

							// Clear tapAndHold timer
								t.timerTapAndHold = null;
						
						}, t.settings.tapAndHoldDelay);
				
			// We're now in a tap
				t.inTap = true;

		};
		
		touchJS.prototype.doMove = function(e, x, y)
		{
		
			var	t = this,
				offset = t.element.offset(),
				diff = (Math.abs(t.x - x) + Math.abs(t.y - y)) / 2;

			// Scrolled? Bail.
				if (t.scrolled())
				{
					t.cancel();
					return;
				}
			
			// In a drag? Trigger "drag"
				if (t.inDrag)
				{
					e.preventDefault();

					t.element.trigger(
						'drag', 
						{ 
							'x': x, 
							'y': y,
							'ex': x - offset.left,
							'ey': y - offset.top
						}
					);
				}
			
			// If we've moved past the drag threshold ...
				else if (diff > t.settings.dragThreshold)
				{
					// Enough time to start?
						if (Date.now() - t.tapStart < t.settings.dragDelay)
						{
							t.cancel();
							return;
						}

					// Cancel everything
						t.cancel();

					// We're now in a drag
						t.inDrag = true;

					// Set timestamp
						t.dragStart = Date.now();
					
					// Trigger "dragStart"
						e.preventDefault();

						t.element.trigger(
							'dragStart', 
							{ 
								'x': x, 
								'y': y,
								'ex': x - offset.left,
								'ey': y - offset.top
							}
						);
				}

		};

		touchJS.prototype.doEnd = function(e, x, y)
		{
		
			var	t = this,
				offset = t.element.offset(),
				dx = Math.abs(t.x - x),
				dy = Math.abs(t.y - y),
				distance,
				velocity,
				duration;

			// Scrolled? Bail.
				if (t.scrolled())
				{
					t.cancel();
					return;
				}

			// If we're in a tap ...
				if (t.inTap)
				{
					// Increase the tap count
						t.taps++;
					
					// If the tap timer expired, or if we have more than one tap, trigger tap event
						if (!t.timerTap || t.taps >= t.settings.tapLimit)
						{
							e.preventDefault();

							t.element.trigger(
								(t.taps == 2 ? 'doubleTap' : 'tap'),
								{ 
									'taps': t.taps, 
									'x': t.x, 
									'y': t.y, 
									'ex': t.ex, 
									'ey': t.ey, 
									'duration': Date.now() - t.tapStart 
								}
							);
							
							t.cancel();
						}
				}

			// If we're in a drag ...
				else if (t.inDrag)
				{

					// Calculate some stuff
						duration = Date.now() - t.dragStart;
						distance = Math.sqrt(Math.pow(Math.abs(t.x - x), 2) + Math.pow(Math.abs(t.y - y), 2));
						velocity = distance / duration;

					// Trigger "dragEnd"
						e.preventDefault();

						t.element.trigger(
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
								'velocity': velocity 
							}
						);
					
					// Swipe?
						if (dx > t.settings.swipeThreshold
						||	dy > t.settings.swipeThreshold)
						{
						
							// Trigger "swipe"
								e.preventDefault();

								t.element.trigger(
									'swipe', 
									{ 
										'distance': distance, 
										'duration': duration, 
										'velocity': velocity 
									}
								);
						
							// Left/Right?
								if (dx > dy)
								{
									// Calculate velocity
										velocity = dx / duration;
								
									// Left? Trigger "swipeLeft"
										if (x < t.x)
											t.element.trigger(
												'swipeLeft', 
												{ 
													'distance': dx, 
													'duration': duration, 
													'velocity': velocity 
												}
											);
									
									// Right? Trigger "swipeRight"
										else
											t.element.trigger(
												'swipeRight', 
												{ 
													'distance': dx, 
													'duration': duration, 
													'velocity': velocity 
												}
											);
								}
							
							// Up/Down?
								else if (dy > dx)
								{
									// Calculate velocity
										velocity = dy / duration;

									// Up? Trigger "swipeUp"
										if (y < t.y)
											t.element.trigger(
												'swipeUp', 
												{ 
													'distance': dy, 
													'duration': duration, 
													'velocity': velocity 
												}
											);
							
									// Down? Trigger "swipeDown"
										else
											t.element.trigger(
												'swipeDown', 
												{ 
													'distance': dy, 
													'duration': duration, 
													'velocity': velocity 
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

		$.fn.enableTouch = function(userSettings) {

			// Handle multiple elements
				if (this.length > 1)
					for (var i=0; i < this.length; i++)
						$(this[i]).enableTouch();

			// Get this party started
				var	element = $(this),
					o = new touchJS(element, userSettings);

			return element;

		};

})(jQuery);