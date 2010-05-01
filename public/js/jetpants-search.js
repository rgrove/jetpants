/*global YUI */
/*jslint bitwise: true, browser: true, eqeqeq: true, laxbreak: true, newcap: true, nomen: false, onevar: true, plusplus: false, white: false */

/**
 * Jetpants Search module.
 *
 * @module jetpants-search
 * @namespace Jetpants
 */
YUI.add('jetpants-search', function (Y) {

/**
 * @class Search
 * @constructor
 */
function Search(config) {
  Search.superclass.constructor.apply(this, arguments);
}

// -- Shorthand ----------------------------------------------------------------
var doc = Y.config.doc,
    win = Y.config.win,

Attribute = Y.Attribute,
DOM       = Y.DOM,
History   = Y.HistoryLite,
Lang      = Y.Lang,
Node      = Y.Node,
YArray    = Y.Array,
YObject   = Y.Object,

ATTRS = {},
UI    = 'ui',

// Attribute names.
API_URL        = 'apiUrl',
CONTENT_BOX    = 'contentBox',
PENDING_QUERY  = 'pendingQuery',
QUERY          = 'query',
QUERY_NODES    = 'queryNodes',
RESULT_COUNT   = 'resultCount',
RESULT_START   = 'resultStart',
RESULTS        = 'results',
SEARCH_FORMS   = 'searchForms',
TEMPLATES      = 'templates',

// Selectors.
SELECTOR_CONTENT_BOX      = '#doc',
SELECTOR_FIRST_WEB_RESULT = '#results .web a',
SELECTOR_SEARCH_FORM      = 'form.sf',
SELECTOR_SEARCH_QUERY     = SELECTOR_SEARCH_FORM + ' input.q',
SELECTOR_RESULTS          = '#results',
SELECTOR_RESULTS_LEFT     = SELECTOR_RESULTS + ' .left',
SELECTOR_RESULTS_RIGHT    = SELECTOR_RESULTS + ' .right',

// -- Public Events ------------------------------------------------------------

/**
 * @event search
 */
EVT_SEARCH = 'search',

/**
 * @event searchEnd
 */
EVT_SEARCH_END = 'searchEnd',

/**
 * @event searchFailure
 */
EVT_SEARCH_FAILURE = 'searchFailure',

/**
 * @event searchSuccess
 */
EVT_SEARCH_SUCCESS = 'searchSuccess';

// -- Static Properties --------------------------------------------------------
Search.NAME  = 'search';
Search.ATTRS = ATTRS;

// -- Attributes ---------------------------------------------------------------

/**
 * URL of the Jetpants Search API.
 *
 * @attribute apiUrl
 * @type String
 */
ATTRS[API_URL] = {
  value: '/api/search'
};

/**
 * Content box for the page.
 *
 * @attribute contentBox
 * @type String|HTMLElement|Node
 */
ATTRS[CONTENT_BOX] = {
  setter   : Y.one,
  writeOnce: true
};

/**
 * Current query in the search box, which may or may not have been submitted
 * yet (thus "pending").
 *
 * @attribute pendingQuery
 * @type String
 */
ATTRS[PENDING_QUERY] = {
  setter: function (value) {
    return Lang.trim(value) || '';
  },

  valueFn: function () {
    return this.get(CONTENT_BOX).one(SELECTOR_SEARCH_QUERY).get('value');
  }
};

/**
 * Currently active search query from the page URL, or <code>null</code> if
 * there isn't one.
 *
 * @attribute query
 * @type String|null
 */
ATTRS[QUERY] = {
  readOnly: true,
  valueFn : function () {
    return Lang.trim(History.get('q')) || null;
  }
};

/**
 * NodeList containing all search input boxes on the page.
 *
 * @attribute queryNodes
 * @type NodeList
 * @final
 */
ATTRS[QUERY_NODES] = {
  readOnly: true,
  valueFn : function () {
    return this.get(CONTENT_BOX).all(SELECTOR_SEARCH_QUERY);
  }
};

/**
 * Number of web results to return for a search.
 *
 * @attribute resultCount
 * @type Number
 * @default 10
 */
ATTRS[RESULT_COUNT] = {
  setter: function (value) {
    value = parseInt(value, 10);

    if (isNaN(value) || value < 1 || value > 100) {
      return Attribute.INVALID_VALUE;
    }
  },

  valueFn: function () {
    return +(History.get('count') || 10);
  }
};

/**
 * 0-based result offset to use when requesting search results.
 *
 * @attribute resultStart
 * @type Number
 * @default 0
 */
ATTRS[RESULT_START] = {
  setter: function (value) {
    value = parseInt(value, 10);

    if (isNaN(value) || value < 0 || value > 999) {
      return Attribute.INVALID_VALUE;
    }
  },

  valueFn: function () {
    return +(History.get('start') || 0);
  }
};

/**
 * Results of the most recent search request, if any.
 *
 * @attribute results
 * @type Object
 * @final
 */
ATTRS[RESULTS] = {
  readOnly: true,
  value   : {}
};

/**
 * NodeList containing all search forms on the page.
 *
 * @attribute searchForms
 * @type NodeList
 * @final
 */
ATTRS[SEARCH_FORMS] = {
  readOnly: true,
  valueFn : function () {
    return this.get(CONTENT_BOX).all(SELECTOR_SEARCH_FORM);
  }
};

/**
 * Compiled JSON templates.
 *
 * @attribute templates
 * @type Object
 */
ATTRS[TEMPLATES] = {
  readOnly: true,
  value: {}
};

Y.extend(Search, Y.Base, {
  // -- Public Instance Methods ------------------------------------------------
  initializer: function (config) {
    this.publish(EVT_SEARCH,         {defaultFn: this._defSearchFn});
    this.publish(EVT_SEARCH_END,     {defaultFn: this._defSearchEndFn});
    this.publish(EVT_SEARCH_FAILURE, {defaultFn: this._defSearchFailureFn});
    this.publish(EVT_SEARCH_SUCCESS, {defaultFn: this._defSearchSuccessFn});

    this._activeModules = {};
    this._resultModules = {};

    this._render();
    this._attachEvents();
  },

  addResultModule: function (name, module) {
    this._resultModules[name] = module;
  },

  addShortcutModule: function (name, module) {
    this.addResultModule(name, module);
  },

  buildQueryString: function (params) {
    var _params = [],
        encode  = encodeURIComponent;

    Y.each(params, function (value, name) {
        _params.push(encode(name) + '=' + encode(value));
    });

    return _params.join('&');
  },

  // -- Protected Methods ------------------------------------------------------
  _attachEvents: function () {
    Y.after('historyLite:change', this._afterHistoryChange, this);

    this.after('pendingQueryChange', this._afterPendingQueryChange);
    this.after('queryChange', this._afterQueryChange);
    this.after('resultsChange', this._afterResultsChange);

    this.get(SEARCH_FORMS).on('submit', this._onSubmit, this);

    if (Y.UA.ie) {
      // In IE, use the propertychange event to simulate the input event.
      this.get(QUERY_NODES).after('propertychange', function (e) {
        if (e._event.propertyName === 'value') {
          this._afterQueryInput(e);
        }
      }, this);
    } else {
      this.get(QUERY_NODES).after('input', this._afterQueryInput, this);
    }
  },

  _compileTemplates: function (templates) {
    if (Lang.isObject(templates)) {
      YObject.each(templates, function (value, name) {
        templates[name] = this._compileTemplates(value);
      }, this);

      return templates;
    } else {
      return jsontemplate.Template(templates);
    }
  },

  _render: function () {
    var agents     = ['chrome', 'gecko', 'ie', 'mobile', 'opera', 'webkit'],
        autoFocus  = true,
        query      = this.get(QUERY),
        root       = Y.one(doc.documentElement),
        UA         = Y.UA;

    // Assign useragent-specific classnames to the root element for use in CSS.
    YArray.each(agents, function (agent) {
      if (UA[agent]) {
        root.addClass(agent);
      }
    }, this);

    if (UA.os) {
      root.addClass(UA.os);
    }

    // If the URL contains a search query, remove the .entry class from the
    // document element to indicate that this is now a SRP rather than an entry
    // page and fire a search event.
    if (query) {
      autoFocus = false;
      this._set(PENDING_QUERY, query);
      root.removeClass('entry');
      this.fire(EVT_SEARCH, {query: query});
    }

    this.get(QUERY_NODES).set('value', this.get(QUERY) || '');

    // Remove the .loading class from the contentBox now that we're done
    // rendering the initial page state.
    this.get(CONTENT_BOX).removeClass('loading');

    if (autoFocus) {
      this.get(QUERY_NODES).item(0).focus();
    }
  },

  _search: function () {
    var config = this.getAttrs([QUERY, RESULT_COUNT, RESULT_START]),
        params = {q: config[QUERY]},
        facade;

    // Only include the count and start params if they're set to values other
    // than the defaults.
    if (config.resultCount !== 10) {
      params.count = config.resultCount;
    }

    if (config.resultStart !== 0) {
      params.start = config.resultStart;
    }

    // Abort any pending requests.
    if (this._request && this._request.isInProgress()) {
      this._request.abort();
    }

    this._request = Y.io(this.get(API_URL), {
      context: this,
      data   : this.buildQueryString(params),
      timeout: 15000,

      on: {
        end: function () {
          this.fire(EVT_SEARCH_END, config);
        },

        failure: function (id, response) {
          var facade = Y.merge(config, {response: response});

          try {
            facade.data = Y.JSON.parse(response.responseText);
          } catch (ex) {
            facade.exception = ex;
          }

          this.fire(EVT_SEARCH_FAILURE, facade);
        },

        success: function (id, response) {
          var facade = Y.merge(config, {response: response});

          try {
            facade.results = Y.JSON.parse(response.responseText);
          } catch (ex) {
            facade.exception = ex;
            this.fire(EVT_SEARCH_FAILURE, facade);
            return;
          }

          this._set(RESULTS, facade.results);
          this.fire(EVT_SEARCH_SUCCESS, facade);
        }
      }
    });
  },

  // -- Protected Event Handlers -----------------------------------------------

  /**
   * @method _afterHistoryChange
   * @protected
   */
  _afterHistoryChange: function (e) {
    var changed   = e.changed,
        newParsed = e.newParsed,
        removed   = e.removed;

    if (changed.q || changed.count || changed.start ||
        removed.q || removed.count || removed.start) {

      // TODO: Debug _setAttrs(). Why doesn't it work?
      this._set(QUERY, newParsed.q || null);
      this.set(RESULT_COUNT, +newParsed.count || 10);
      this.set(RESULT_START, +newParsed.start || 0);

      if (!removed.q) {
        this.fire(EVT_SEARCH, {query: newParsed.q});
      }
    }
  },

  /**
   * @method _afterPendingQueryChange
   * @protected
   */
  _afterPendingQueryChange: function (e) {
    if (e.src !== UI) {
      this.get(QUERY_NODES).set('value', e.newVal || '');
    }
  },

  /**
   * @method _afterQueryChange
   * @protected
   */
  _afterQueryChange: function (e) {
    var query = e.newVal,
        root  = Y.one(doc.documentElement);

    this.set(PENDING_QUERY, query || '');
    this._set(RESULTS, {});

    if (!query) {
      root.addClass('entry');
      doc.title = 'Jetpants Search';
    }
  },

  /**
   * @method _afterQueryInput
   * @protected
   */
  _afterQueryInput: function (e) {
    this.set(PENDING_QUERY, e.currentTarget.get('value'), {src: UI});
  },

  /**
   * @method _afterResultsChange
   * @protected
   */
  _afterResultsChange: function (e) {
    var results     = e.newVal,
        resultsLeft = Y.one(SELECTOR_RESULTS_LEFT),
        templates;
        // resultsRight = Y.one(SELECTOR_RESULTS_RIGHT);

    // Extract JSON templates from the response and compile them.
    if (results.templates) {
      this._set(TEMPLATES, templates = this._compileTemplates(results.templates));
    }

    YObject.each(this._activeModules, function (module, name) {
      module.destroy();
      delete this._activeModules[name];
    }, this);

    YObject.each(results.results, function (results, name) {
      var Module = this._resultModules[name];

      if (Module) {
        this._activeModules[name] = new Module({
          parentNode: resultsLeft,
          results   : results,
          templates : (templates || {})[name] || {}
        });
      } else {
        Y.log('No result module registered for ' + name + ' results.');
      }
    }, this);

    YObject.each(this._activeModules, function (module) {
      module.render();
    }, this);
  },

  /**
   * Handles search form submission.
   *
   * @method _onSubmit
   * @protected
   */
  _onSubmit: function (e) {
    e.preventDefault();

    History.add({
      q    : this.get(PENDING_QUERY),
      count: null,
      start: null
    });
  },

  // -- Private Event Handlers -------------------------------------------------

  /**
   * @method _defSearchFn
   * @private
   */
  _defSearchFn: function (e) {
    DOM.removeClass(doc.documentElement, 'entry');
    doc.title = e.query + ' - Jetpants Search';

    Y.one(SELECTOR_RESULTS_LEFT).addClass('loading');
    this._search();
  },

  /**
   * @method _defSearchEndFn
   * @private
   */
  _defSearchEndFn: function (e) {
    Y.one(SELECTOR_RESULTS_LEFT).removeClass('loading');
  },

  /**
   * @method _defSearchFailureFn
   * @private
   */
  _defSearchFailureFn: function (e) {
      // TODO: handle search failures
  },

  /**
   * @method _defSearchSuccessFn
   * @private
   */
  _defSearchSuccessFn: function (e) {
    var firstLink;

    win.scroll(0, 0);

    firstLink = Y.one(SELECTOR_FIRST_WEB_RESULT);

    if (firstLink) {
      firstLink.focus();
    } else {
      this.get(QUERY_NODES).item(0).focus().select();
    }
  }
});

// TODO: need to file a bug to get these added to YUI.
Node.DOM_EVENTS.input = 1;
Node.DOM_EVENTS.propertychange = 1;

Y.namespace('Jetpants').Search = new Search({contentBox: SELECTOR_CONTENT_BOX});

}, '1.0.0', {
    requires: [
      'base-base', 'event', 'event-custom', 'history-lite', 'io-base',
      'jetpants-result-module', 'json-parse', 'node-base'
    ]
});
