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
 * @static
 */
function Search(config) {
  Search.superclass.constructor.apply(this, arguments);
}

// -- Shorthand ----------------------------------------------------------------
var doc       = Y.config.doc,
    win       = Y.config.win,
    Array     = Y.Array,
    Attribute = Y.Attribute,
    DOM       = Y.DOM,
    History   = Y.HistoryLite,
    Lang      = Y.Lang,
    Node      = Y.Node,

// Attribute names.
API_URL       = 'apiUrl',
CONTENT_BOX   = 'contentBox',
PENDING_QUERY = 'pendingQuery',
QUERY         = 'query',
QUERY_NODES   = 'queryNodes',
RESULT_COUNT  = 'resultCount',
RESULT_START  = 'resultStart',
RESULTS       = 'results',
SEARCH_FORMS  = 'searchForms',
TEMPLATES     = 'templates',

// Selectors.
SELECTOR_FIRST_WEB_RESULT = '#results .web a',
SELECTOR_INFO             = '#bd .info',
SELECTOR_SEARCH_FORM      = 'form.sf',
SELECTOR_SEARCH_QUERY     = SELECTOR_SEARCH_FORM + ' input.q',
SELECTOR_RESULTS          = '#results',

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
Search.ATTRS = {
  /**
   * URL of the Jetpants Search API.
   *
   * @attribute apiUrl
   * @type String
   */
  apiUrl: {value: '/api/search'},

  /**
   * Current query in the search box, which may or may not have been submitted
   * yet (thus "pending").
   *
   * @attribute pendingQuery
   * @type String
   */
  pendingQuery: {
    setter: function (value) {
      return Lang.trim(value) || '';
    },

    valueFn: function () {
      return this.get(CONTENT_BOX).one(SELECTOR_SEARCH_QUERY).get('value');
    }
  },

  /**
   * Currently active search query from the page URL, or <code>null</code> if
   * there isn't one.
   *
   * @attribute query
   * @type String|null
   */
  query: {
    readOnly: true,
    valueFn : function () {
      return Lang.trim(History.get('q')) || null;
    }
  },

  /**
   * NodeList containing all search input boxes on the page.
   *
   * @attribute queryNodes
   * @type NodeList
   * @final
   */
  queryNodes: {
    readOnly: true,
    valueFn : function () {
      return this.get(CONTENT_BOX).all(SELECTOR_SEARCH_QUERY);
    }
  },

  /**
   * Number of web results to return for a search.
   *
   * @attribute resultCount
   * @type Number
   * @default 10
   */
  resultCount: {
    setter: function (value) {
      value = parseInt(value, 10);

      if (isNaN(value) || value < 1 || value > 100) {
        return Attribute.INVALID_VALUE;
      }
    },

    valueFn: function () {
      return +(History.get('count') || 10);
    }
  },

  /**
   * 0-based result offset to use when requesting search results.
   *
   * @attribute resultStart
   * @type Number
   * @default 0
   */
  resultStart: {
    setter: function (value) {
      value = parseInt(value, 10);

      if (isNaN(value) || value < 0 || value > 999) {
        return Attribute.INVALID_VALUE;
      }
    },

    valueFn: function () {
      return +(History.get('start') || 0);
    }
  },

  /**
   * Results of the most recent search request, if any.
   *
   * @attribute results
   * @type Object
   * @final
   */
  results: {
    readOnly: true,
    value   : {}
  },

  /**
   * NodeList containing all search forms on the page.
   *
   * @attribute searchForms
   * @type NodeList
   * @final
   */
  searchForms: {
    readOnly: true,
    valueFn : function () {
      return this.get(CONTENT_BOX).all(SELECTOR_SEARCH_FORM);
    }
  },

  /**
   * JSON templates.
   *
   * @attribute templates
   * @type Object
   */
  templates: {
    getter: function (templates) {
      // Compile templates on first use.
      templates = this._compileTemplates(templates);

      // Remove this getter to ensure that compilation only occurs once.
      this.modifyAttr(TEMPLATES, {getter: null});

      return templates;
    },

    writeOnce: true,
    value: {}
  }
};

Y.extend(Search, Y.Widget, {

  // -- Public Instance Methods ------------------------------------------------
  initializer: function (config) {
    this.publish(EVT_SEARCH,         {defaultFn: this._defSearchFn});
    this.publish(EVT_SEARCH_FAILURE, {defaultFn: this._defSearchFailureFn});
    this.publish(EVT_SEARCH_SUCCESS, {defaultFn: this._defSearchSuccessFn});

    Y.after('history-lite:change', this._afterHistoryChange, this);
  },

  // destructor: function () {
  // },

  bindUI: function () {
    this.after('queryChange', this._afterQueryChange);
    this.after('resultsChange', this._afterResultsChange);

    this.get(SEARCH_FORMS).on('submit', this._onSubmit, this);
    this.get(QUERY_NODES).after('input', this._afterQueryInput, this);
  },

  renderUI: function () {
    var agents     = ['chrome', 'gecko', 'ie', 'mobile', 'opera', 'webkit'],
        autoFocus  = true,
        query      = this.get(QUERY),
        root       = Y.one(doc.documentElement),
        UA         = Y.UA;

    // Assign useragent-specific classnames to the root element for use in CSS.
    Array.each(agents, function (agent) {
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
      root.removeClass('entry');
      this.fire(EVT_SEARCH, {query: query});
    }

    // Remove the .loading class from the contentBox now that we're done
    // rendering the initial page state.
    this.get(CONTENT_BOX).removeClass('loading');

    if (autoFocus) {
      this.get(QUERY_NODES).item(0).focus();
    }
  },

  syncUI: function () {
    this.get(QUERY_NODES).set('value', this.get(QUERY) || '');
  },

  // -- Protected Methods ------------------------------------------------------

  // TODO: use YUI for this?
  _buildQueryString: function (params) {
    var _params = [],
        encode  = encodeURIComponent;

    Y.each(params, function (value, name) {
        _params.push(encode(name) + '=' + encode(value));
    });

    return _params.join('&');
  },

  _compileTemplates: function (templates) {
    if (Lang.isObject(templates)) {
      Y.Object.each(templates, function (value, name) {
        templates[name] = this._compileTemplates(value);
      }, this);

      return templates;
    } else {
      return jsontemplate.Template(templates);
    }
  },

  _formatNumber: function (number) {
    return Y.DataType.Number.format(number, {
      thousandsSeparator: ','
    });
  },

  _renderInfo: function (parent) {
    var parentNode = Y.one(parent),
        results    = this.get(RESULTS + '.web'),
        template   = this.get(TEMPLATES + '.web.info');

    parentNode.get('children').remove();

    if (!results) {
      return;
    }

    parentNode.append(template.expand({
      info: !results.count ? false : {
        first: results.start + 1,
        last : results.start + results.count,
        total: this._formatNumber(results.deephits),
        query: this.get(QUERY)
      }
    }));
  },

  _renderPagination: function (parent) {
    var currentPage = 1,
        i,
        pagination,
        pages       = [],
        queryParams,
        results     = this.get(RESULTS + '.web'),
        resultCount = this.get(RESULT_COUNT),
        resultStart = this.get(RESULT_START),
        template    = this.get(TEMPLATES + '.web.pagination'),
        that        = this,
        totalPages  = 1,
        windowEnd,
        windowStart;

    if (!results) {
      return;
    }

    if (results.totalhits) {
      totalPages  = Math.min(100, Math.ceil(results.totalhits / resultCount));
      currentPage = Math.ceil((resultStart + 1) / resultCount);
    }

    if (totalPages === 1) {
      return;
    }

    queryParams = {
      q    : this.get(QUERY),
      count: resultCount
    };

    windowStart = Math.max(1, currentPage - 5);
    windowEnd   = Math.min(windowStart + 9, totalPages);

    for (i = windowStart; i <= windowEnd; ++i) {
      pages.push({
        current    : i === currentPage,
        page       : i,
        queryString: this._buildQueryString(Y.merge(queryParams, {
          start: (i - 1) * resultCount
        }))
      });
    }

    pagination = {
      next: (function () {
        if (windowEnd > currentPage) {
          return {
            queryString: that._buildQueryString(Y.merge(queryParams, {
              start: currentPage * resultCount
            }))
          };
        }
      }()),

      pages: pages,

      prev: (function () {
        if (currentPage > 1) {
          return {
            queryString: that._buildQueryString(Y.merge(queryParams, {
              start: ((currentPage - 2) * resultCount)
            }))
          };
        }
      }())
    };

    Y.one(parent).append(template.expand(pagination));
  },

  _renderWebResults: function (parent) {
    var results  = this.get(RESULTS + '.web'),
        template = this.get(TEMPLATES + '.web.results');

    if (!results) {
      return;
    }

    results.query = this.get(QUERY);
    Y.one(parent).append(template.expand(results));
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
      data   : this._buildQueryString(params),
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
   * @method _onHistoryChange
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
   * @method _afterQueryChange
   * @protected
   */
  _afterQueryChange: function (e) {
    var query = e.newVal,
        root  = Y.one(doc.documentElement);

    this.set(PENDING_QUERY, query || '');
    this._set(RESULTS, {});

    if (query) {
      root.removeClass('entry');
      doc.title = e.query + ' - Jetpants Search';
    } else {
      root.addClass('entry');
      doc.title = 'Jetpants Search';
    }
  },

  /**
   * @method _afterQueryInput
   * @protected
   */
  _afterQueryInput: function (e) {
    this.set(PENDING_QUERY, e.currentTarget.get('value'));
  },

  /**
   * @method _afterResultsChange
   * @protected
   */
  _afterResultsChange: function (e) {
    var resultsNode = Y.one(SELECTOR_RESULTS);

    resultsNode.get('children').remove();

    this._renderInfo(SELECTOR_INFO);
    this._renderWebResults(resultsNode);
    this._renderPagination(resultsNode);
  },

  /**
   * Handles search form submission.
   *
   * @method _onSubmit
   * @protected
   */
  _onSubmit: function (e) {
    e.preventDefault();
    History.add({q: this.get(PENDING_QUERY)});
  },

  // -- Private Event Handlers -------------------------------------------------

  /**
   * @method _defSearchFn
   * @private
   */
  _defSearchFn: function (e) {
    this._search();
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

Y.namespace('Jetpants').Search = Search;

// TODO: need to file a bug to get this added to YUI.
Y.Node.DOM_EVENTS.input = 1;

}, '1.0.0', {
    requires: [
      'datatype-number', 'event', 'event-custom', 'gallery-history-lite',
      'io-base', 'json-parse', 'node', 'widget'
    ]
});
