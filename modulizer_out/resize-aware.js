import { PolymerElement } from '../../@polymer/polymer/polymer-element.js';
import { html } from '../../@polymer/polymer/lib/utils/html-tag.js';
/**
* `resize-aware`
*
* Container element that is aware of, and notifies of, changes to its size
*
* Use `resize-aware` in place of a `div` when you need to take some action
* if the rendered dimensions of the element change (content change affecting the
* size, layout changes, viewport change). `resize-aware` will fire an event when
* its dimensions change that includes the new size.
* 
* Example:
* 
* ```
* <resize-aware on-element-size-changed="handleChange">
*  any content that could have been in a div
* </resize-aware>
* ``` 
* 
* ```
* <resize-aware>
*  any content that could have been in a div
* </resize-aware>
* 
* this.$$('resize-aware').addEventListener('element-resize', this.someHandlerName);
* ``` 
* 
* @demo demo/index.html
**/
class ResizeAware extends PolymerElement {
  static get template() {
    return html`
		<style>
			:host {
				display: block;
				margin: 0px;
				padding: 0px;
				border: none;
				position: relative;
			}
			
			#saw {
				height: 100%;
				width: 100%;
				display: inline-block;
				margin: 0px;
				padding: 0px;
				border: none;
				position: relative;
			}
			
			@keyframes resizeanim {
				from {
					opacity: 0;
				}
				to {
					opacity: 0;
				}
			}
			
			.ResizeSensor__resizeTriggers {
				animation: 1ms resizeanim;
				visibility: hidden;
				opacity: 0;
			}
			
			.ResizeSensor__resizeTriggers,
			.ResizeSensor__resizeTriggers>div,
			.ResizeSensor__contractTrigger:before {
				content: ' ';
				display: block;
				position: absolute;
				top: 0;
				left: 0;
				height: 100%;
				width: 100%;
				overflow: hidden;
			}
			
			.ResizeSensor__resizeTriggers>div {
				background: #eee;
				overflow: auto;
			}
			
			.ResizeSensor__contractTrigger:before {
				width: 200%;
				height: 200%;
			}
		</style>
		<div id="saw">
			<slot></slot>
			<div id="rsrt" class="ResizeSensor ResizeSensor__resizeTriggers">
				<div id="rsexpt" class="ResizeSensor__expandTrigger">
					<div id="rsexptc" style="width: 1px; height: 1px;"></div>
				</div>
				<div id="rscntrt" class="ResizeSensor__contractTrigger">
				</div>
			</div>
		</div>
`;
  }

  static get is() {
      return 'resize-aware';
  }

  static get properties() {
      return {
          /**
           * Current element size in px. { height: width: }
           * @type {Object}
           */
          elementSize: {
              type: Object,
              notify: true,
              readOnly: true,
              value: function () {
                  return {
                      width: 0,
                      height: 0
                  };
              }
          },
          _rsApi: {
              type: Object
          }
      }
  }
  /**
   * Initialize listening for size changes
   */
  ready() {
      super.ready();
      this._rsApi = this._resizeSensorApi(this._resizeSensor(this));
      this._rsApi.create(this.$.saw, [this.$.rsrt, this.$.rsexpt, this.$.rsexptc, this.$.rscntrt], this._handleResize.bind(this));
  }

  /**
   * Handle resize events
   * @param  {[type]} e [description]
   * @return {[type]}   [description]
   */
  _handleResize(e) {
      this.dispatchEvent(new CustomEvent('element-resize', { detail: e }));
      this._setElementSize({
					width: e.width,
					height: e.height
      });
  }

  /**
   * The API for resize sensor
   *
   * Adapted from procurios/ResizeSensor - https://github.com/procurios/ResizeSensor
   * in order to work in Polymer and Shadow DOM. This includes removing dynamic generation
   * of CSS styles and the sensor divs and moving that into the template markup.
   * @param  ResizeSensor ResizeSensor
   * @return ResizeSensorApi              public API of ResizeSensor
   */
  _resizeSensorApi(ResizeSensor) {
      'use strict';

      /** {{}} Map of all resize sensors (id => ResizeSensor) */
      var allResizeSensors = {};

      /**
       * @constructor
       */
      var ResizeSensorApi = function () {};

      /**
       * @param {HTMLElement} targetElement
       * @param {Function} callback
       * @returns {ResizeSensor}
       */
      ResizeSensorApi.prototype.create = function (targetElement, trigElements, callback) {
					var sensorId = this.getSensorId(targetElement);

					if (allResizeSensors[sensorId]) {
              return allResizeSensors[sensorId];
					}

					var Instance = new ResizeSensor(targetElement, trigElements, callback);
					allResizeSensors[sensorId] = Instance;
					return Instance;
      };

      /**
       * @param {HTMLElement} targetElement
       */
      ResizeSensorApi.prototype.destroy = function (targetElement) {
					var sensorId = this.getSensorId(targetElement);

					/** @var ResizeSensor */
					var Sensor = allResizeSensors[sensorId];

					if (!Sensor) {
              console && console.error("Can't destroy ResizeSensor (404 not found).", targetElement);
					}

					Sensor.destroy();
					delete allResizeSensors[sensorId];
      };

      /**
       * @param {HTMLElement} targetElement
       * @returns {string}
       */
      ResizeSensorApi.prototype.getSensorId = function (targetElement) {
					return targetElement.id;
      };

      return new ResizeSensorApi();
  }

  /**
   * Resize sensor core function
   *
   * Adapted with fairly minor changes from
   * procurios/ResizeSensor - https://github.com/procurios/ResizeSensor
   * in order to work in Polymer and Shadow DOM
   *
   * @param  HTMLElement rootNode the shadow root of this component
   * @return ResizeSensor          core function class
   */
  _resizeSensor(rootNode) {
      /** ----- Feature tests and polyfills ----- */
      /** {array} */
      var unsuitableElements = ['IMG', 'COL', 'TR', 'THEAD', 'TFOOT'];
      /** {boolean} */
      var supportsAttachEvent = ('attachEvent' in document);

      if (!supportsAttachEvent) {
					var browserSupportsCSSAnimations = isCSSAnimationSupported();
					var animationPropertiesForBrowser = (browserSupportsCSSAnimations) ? getAnimationPropertiesForBrowser() : {};
					insertResizeSensorStyles();

					if (!('requestAnimationFrame' in window) || !('cancelAnimationFrame' in window)) {
              polyfillRAF();
					}
      }

      /** ----- ResizeSensor ----- */

      /**
       * @param {HTMLElement} targetElement
       * @param {Function} callback
       * @constructor
       */
      var ResizeSensor = function (targetElement, trigElements, callback) {
					if (isUnsuitableElement(targetElement)) {
              console && console.error(
                  "Given element isn't suitable to act as a resize sensor. Try wrapping it with one that is. Unsuitable elements are:",
                  unsuitableElements);
              return;
					}

					/** @var {HTMLElement} */
					this.targetElement = targetElement;
					/** @var {Function} */
					this.callback = callback;
					/** @var {{width: int, height: int}} */
					this.dimensions = {
              width: 0,
              height: 0
					};

					if (supportsAttachEvent) {
              this.boundOnResizeHandler = this.onElementResize.bind(this);
              this.targetElement.attachEvent('onresize', this.boundOnResizeHandler);
              return;
					}

					/** @var {{container: HTMLElement, expand: HTMLElement, expandChild: HTMLElement, contract: HTMLElement}} */
					/** trigger elements */
					this.triggerElements = {};
					this.triggerElements.container = trigElements[0];
					this.triggerElements.expand = trigElements[1];
					this.triggerElements.expandChild = trigElements[2];
					this.triggerElements.contract = trigElements[3];
					/** @var {int} */
					this.resizeRAF = 0;

					this.setup();
      };

      ResizeSensor.prototype.setup = function () {
					// Make sure the target element is "positioned"
					forcePositionedBox(this.targetElement);

					// Create and append resize trigger elements
					this.insertResizeTriggerElements();

					// Start listening to events
					this.boundScrollListener = this.handleElementScroll.bind(this);
					this.targetElement.addEventListener('scroll', this.boundScrollListener, true);

					if (browserSupportsCSSAnimations) {
              this.boundAnimationStartListener = this.resetTriggersOnAnimationStart.bind(this);
              this.triggerElements.container.addEventListener(animationPropertiesForBrowser.animationStartEvent, this.boundAnimationStartListener);
					}

					// Initial value reset of all triggers
					this.resetTriggers();
      };

      ResizeSensor.prototype.insertResizeTriggerElements = function () {
					
      };

      ResizeSensor.prototype.onElementResize = function () {
					var currentDimensions = this.getDimensions();

					if (this.isResized(currentDimensions)) {
              this.dimensions.width = currentDimensions.width;
              this.dimensions.height = currentDimensions.height;
              this.elementResized();
					}
      };

      ResizeSensor.prototype.handleElementScroll = function () {
					var _this = this;

					this.resetTriggers();

					if (this.resizeRAF) {
              window.cancelAnimationFrame(this.resizeRAF);
					}

					this.resizeRAF = window.requestAnimationFrame(function () {
              var currentDimensions = _this.getDimensions();
              if (_this.isResized(currentDimensions)) {
                  _this.dimensions.width = currentDimensions.width;
                  _this.dimensions.height = currentDimensions.height;
                  _this.elementResized();
              }
					});
      };

      /**
       * @param {{width: number, height: number}} currentDimensions
       * @returns {boolean}
       */
      ResizeSensor.prototype.isResized = function (currentDimensions) {
					return (currentDimensions.width !== this.dimensions.width || currentDimensions.height !== this.dimensions.height)
      };

      /**
       * @returns {{width: number, height: number}}
       */
      ResizeSensor.prototype.getDimensions = function () {
					return {
              width: this.targetElement.offsetWidth,
              height: this.targetElement.offsetHeight
					};
      };

      /**
       * @param {Event} event
       */
      ResizeSensor.prototype.resetTriggersOnAnimationStart = function (event) {
					if (event.animationName === animationPropertiesForBrowser.animationName) {
              this.resetTriggers();
					}
      };

      ResizeSensor.prototype.resetTriggers = function () {
					this.triggerElements.contract.scrollLeft = this.triggerElements.contract.scrollWidth;
					this.triggerElements.contract.scrollTop = this.triggerElements.contract.scrollHeight;
					this.triggerElements.expandChild.style.width = this.triggerElements.expand.offsetWidth + 1 + 'px';
					this.triggerElements.expandChild.style.height = this.triggerElements.expand.offsetHeight + 1 + 'px';
					this.triggerElements.expand.scrollLeft = this.triggerElements.expand.scrollWidth;
					this.triggerElements.expand.scrollTop = this.triggerElements.expand.scrollHeight;
      };

      ResizeSensor.prototype.elementResized = function () {
					this.callback(this.dimensions);
      };

      ResizeSensor.prototype.destroy = function () {
					this.removeEventListeners();
					this.targetElement.removeChild(this.triggerElements.container);
					delete this.boundAnimationStartListener;
					delete this.boundScrollListener;
					delete this.callback;
					delete this.targetElement;
      };

      ResizeSensor.prototype.removeEventListeners = function () {
					if (supportsAttachEvent) {
              this.targetElement.detachEvent('onresize', this.boundOnResizeHandler);
					}

					this.triggerElements.container.removeEventListener(animationPropertiesForBrowser.animationStartEvent, this.boundAnimationStartListener);
					this.targetElement.removeEventListener('scroll', this.boundScrollListener, true);
      };

      /** ----- Various helper functions ----- */

      /**
       * An element is said to be positioned if its 'position' property has a value other than 'static'
       * @see http://www.w3.org/TR/CSS2/visuren.html#propdef-position
       * @param {HTMLElement} element
       */
      function forcePositionedBox(element) {
					var position = getStyle(element, 'position');

					if (position === 'static') {
              element.style.position = 'relative';
					}
      }

      /**
       * @returns {boolean}
       */
      function isCSSAnimationSupported() {
					var testElement = document.createElement('div');
					var isAnimationSupported = ('animationName' in testElement.style);

					if (isAnimationSupported) {
              return true;
					}

					var browserPrefixes = 'Webkit Moz O ms'.split(' ');
					var i = 0;
					var l = browserPrefixes.length;

					for (; i < l; i++) {
              if ((browserPrefixes[i] + 'AnimationName') in testElement.style) {
                  return true;
              }
					}

					return false;
      }

      /**
       * @param {HTMLElement} targetElement
       * @returns {boolean}
       */
      function isUnsuitableElement(targetElement) {
					var tagName = targetElement.tagName.toUpperCase();
					return (unsuitableElements.indexOf(tagName) > -1);
      }

      /**
       * Determines which style convention (properties) to follow
       * @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Using_CSS_animations/Detecting_CSS_animation_support
       * @returns {{keyframesRule: string, styleDeclaration: string, animationStartEvent: string, animationName: string}}
       */
      function getAnimationPropertiesForBrowser() {
					var testElement = document.createElement('div');
					var supportsUnprefixedAnimationProperties = ('animationName' in testElement.style);

					// Unprefixed animation properties
					var animationStartEvent = 'animationstart';
					var animationName = 'resizeanim';

					if (supportsUnprefixedAnimationProperties) {
              return {
                  keyframesRule: '@keyframes ' + animationName + ' {from { opacity: 0; } to { opacity: 0; }}',
                  styleDeclaration: 'animation: 1ms ' + animationName + ';',
                  animationStartEvent: animationStartEvent,
                  animationName: animationName
              };
					}

					// Browser specific animation properties
					var keyframePrefix = '';
					var browserPrefixes = 'Webkit Moz O ms'.split(' ');
					var startEvents = 'webkitAnimationStart animationstart oAnimationStart MSAnimationStart'.split(' ');

					var i;
					var l = browserPrefixes.length;

					for (i = 0; i < l; i++) {
              if ((browserPrefixes[i] + 'AnimationName') in testElement.style) {
                  keyframePrefix = '-' + browserPrefixes[i].toLowerCase() + '-';
                  animationStartEvent = startEvents[i];
                  break;
              }
					}

					return {
              keyframesRule: '@' + keyframePrefix + 'keyframes ' + animationName +
                  ' {from { opacity: 0; } to { opacity: 0; }}',
              styleDeclaration: keyframePrefix + 'animation: 1ms ' + animationName + ';',
              animationStartEvent: animationStartEvent,
              animationName: animationName
					};
      }

      /**
       * Provides requestAnimationFrame in a cross browser way
       * @see https://gist.github.com/mrdoob/838785
       */
      function polyfillRAF() {
					if (!window.requestAnimationFrame) {
              window.requestAnimationFrame = (function () {
                  return window.webkitRequestAnimationFrame ||
                      window.mozRequestAnimationFrame ||
                      window.oRequestAnimationFrame ||
                      window.msRequestAnimationFrame ||
                      function (callback) {
                          window.setTimeout(callback, 1000 / 60);
                      };
              })();
					}

					if (!window.cancelAnimationFrame) {
              window.cancelAnimationFrame = (function () {
                  return window.webkitCancelAnimationFrame ||
                      window.mozCancelAnimationFrame ||
                      window.oCancelAnimationFrame ||
                      window.msCancelAnimationFrame ||
                      window.clearTimeout;
              })();
					}
      }

      /**
       * Adds a style block that contains CSS essential for detecting resize events
       */
      function insertResizeSensorStyles() {
					
      }

      /**
       *
       * @param {HTMLElement} element
       * @param {string} property
       * @returns {null|string}
       */
      function getStyle(element, property) {
					var value = null;

					if (element.currentStyle) {
              value = element.currentStyle[property];
					} else if (window.getComputedStyle) {
              value = document.defaultView.getComputedStyle(element, null).getPropertyValue(property);
					}

					return value;
      }

      return ResizeSensor;
  }
}
window.customElements.define(ResizeAware.is, ResizeAware);
