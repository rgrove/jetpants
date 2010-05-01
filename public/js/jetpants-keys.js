/*global YUI */
/*jslint bitwise: true, browser: true, eqeqeq: true, laxbreak: true, newcap: true, nomen: false, onevar: true, plusplus: false, white: false */

/**
 * @module jetpants-keys
 * @namespace Jetpants
 */
YUI.add('jetpants-keys', function (Y) {

/**
 * @class Keys
 * @constructor
 */
function Keys(config) {
  Keys.superclass.constructor.apply(this, arguments);
}

// -- Shorthand ----------------------------------------------------------------
var Search = Y.Jetpants.Search,

ATTRS = {},
CURRENT_FOCUS  = 'currentFocus',

SELECTOR_FOCUSABLE = '#hd input.q, #results .web h3 a',
SELECTOR_INPUT     = 'input[type=text],input[type=password],select,textarea';

// -- Static Properties and Attributes -----------------------------------------
Keys.NAME  = 'keys';
Keys.ATTRS = ATTRS;

/**
 * Node that currently has focus, if any.
 *
 * @attribute currentFocus
 * @type Node
 * @default null
 */
ATTRS[CURRENT_FOCUS] = {
  readOnly: true
};

Y.extend(Keys, Y.Base, {
  // -- Public Methods ---------------------------------------------------------
  initializer: function (config) {
    this._attachEvents();
  },

  // -- Protected Methods ------------------------------------------------------
  _attachEvents: function () {
    var doc = Y.one('#doc');

    // Watch for focus changes so we can track the focused result.
    Y.on('blur', this._onBlur, doc, this);
    Y.on('focus', this._onFocus, doc, this);

    // Keys  : esc, /
    // Action: Focus the search box and select its contents.
    Y.on('key', this._onKeySearch, doc, 'down:27,191', this);

    // Keys  : up arrow, down arrow, j, k
    // Action: Select previous/next web result.
    Y.on('key', this._onKeyResultNav, doc, 'down:38,40,74,75', this);
  },

  // -- Protected Event Handlers -----------------------------------------------
  _onBlur: function () {
    this._set(CURRENT_FOCUS, null);
  },

  _onFocus: function (e) {
    this._set(CURRENT_FOCUS, e.target);
  },

  _onKeyResultNav: function (e) {
    var currentFocus, focusable, focusableLen, focusedItem;

    if (e.keyCode === 40 || !e.target.test(SELECTOR_INPUT)) {
      e.preventDefault();

      currentFocus = this.get(CURRENT_FOCUS);
      focusable    = Y.all(SELECTOR_FOCUSABLE);
      focusableLen = focusable.size();
      focusedItem  = currentFocus ? focusable.indexOf(currentFocus) : -1;

      switch (e.keyCode) {
        case 38:
        case 74: // up arrow, j
          // Focus the nearest web result above us, or the search box if there
          // are no web results above us.
          if (focusedItem > 0) {
            focusable.item(focusedItem - 1).focus();
          } else {
            focusable.item(0).focus();
          }
          break;

        case 40:
        case 75: // down arrow, k
          // Focus the nearest web result below us.
          if (focusedItem === -1 && focusableLen > 1) {
            focusable.item(1).focus();
          } else if (focusedItem < focusableLen - 1) {
            focusable.item(focusedItem + 1).focus();
          }
          break;
      }
    }
  },

  _onKeySearch: function (e) {
    if (!e.target.test(SELECTOR_INPUT)) {
      e.preventDefault();
      Search.get('queryNodes').item(0).focus().select();
    }
  }
});

Y.Jetpants.Keys = new Keys();

}, '1.0.0', {
  requires: ['base-base', 'event-focus', 'event-key', 'jetpants-search']
});
