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

SELECTOR_WEB             = '#results .web',
SELECTOR_FOCUSABLE       = SELECTOR_WEB + ' h3 a',
SELECTOR_INPUT           = 'input[type=search],input[type=text],input[type=password],select,textarea',
SELECTOR_PAGINATION_NEXT = SELECTOR_WEB + ' .pg li.next a',
SELECTOR_PAGINATION_PREV = SELECTOR_WEB + ' .pg li.prev a',
SELECTOR_WEB_RESULT      = SELECTOR_WEB + ' a';

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

    // Keys  : h, l, p, n
    // Action: Previous page / Next page
    Y.on('key', this._onKeyPaginate, doc, 'down:72,76,78,80', this);

    // Keys  : up arrow, down arrow, j, k
    // Action: Select previous/next web result.
    Y.on('key', this._onKeyResultNav, doc, 'down:38,40,74,75', this);

    // Keys  : /, esc
    // Action: Focus or blur the search box
    Y.on('key', this._onKeySearch, doc, 'down:27,191', this);
  },

  // -- Protected Event Handlers -----------------------------------------------
  _onBlur: function () {
    this._set(CURRENT_FOCUS, null);
  },

  _onFocus: function (e) {
    this._set(CURRENT_FOCUS, e.target);
  },

  _onKeyPaginate: function (e) {
    var prevLink, nextLink;

    if (e.target.test(SELECTOR_INPUT)) {
      return;
    }

    e.preventDefault();

    switch (e.keyCode) {
      case 72: // h
      case 80: // p
        prevLink = Y.one(SELECTOR_PAGINATION_PREV);

        if (prevLink) {
          Y.config.win.location = prevLink.getAttribute('href');
        }
        break;

      case 76: // l
      case 78: // n
        nextLink = Y.one(SELECTOR_PAGINATION_NEXT);

        if (nextLink) {
          Y.config.win.location = nextLink.getAttribute('href');
        }
        break;
    }
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
        case 38: // up arrow
        case 75: // k
          // Focus the nearest web result above us.
          if (focusedItem > 0) {
            focusable.item(focusedItem - 1).focus();
          } else {
            focusable.item(0).focus();
          }
          break;

        case 40: // down arrow
        case 74: // j
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
    var firstLink,
        queryInput = Search.get('queryNodes').item(0);

    if (e.keyCode !== 27 && e.target.test(SELECTOR_INPUT)) {
      return;
    }

    e.preventDefault();

    if (e.keyCode === 27) {
      // Focus the first web result.
      firstLink = Y.one(SELECTOR_WEB_RESULT);

      if (firstLink) {
        firstLink.focus();
      }
    } else if (e.keyCode === 191) {
      queryInput.focus().select();
    }
  }
});

Y.Jetpants.Keys = new Keys();

}, '1.0.0', {
  requires: ['base-base', 'event-focus', 'event-key', 'jetpants-search']
});
