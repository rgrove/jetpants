/**
 * Jetpants core module.
 *
 * @module jetpants-core
 */
YUI.add('jetpants-core', function (Y) {

// -- Singleton Constructor ----------------------------------------------------

/**
 * @class Jetpants
 * @static
 */
function Jetpants(config) {
  Jetpants.superclass.constructor.apply(this, arguments);
}

// -- Shorthand ----------------------------------------------------------------
var doc     = Y.config.doc,
    win     = Y.config.win,
    DOM     = Y.DOM,
    History = Y.HistoryLite,
    Lang    = Y.Lang,

JETPANTS          = 'jetpants',
PENDING_QUERY     = 'pendingQuery',
QUERY             = 'query',
QUERY_NODES       = 'queryNodes',
RESULT_COUNT      = 'resultCount',
RESULT_START      = 'resultStart',
SEARCH_FORM_NODES = 'searchFormNodes',

EVT_SEARCH = 'search';

// -- Private Variables --------------------------------------------------------

// -- Static Properties --------------------------------------------------------
Jetpants.NAME  = JETPANTS;
Jetpants.ATTRS = {
  /**
   * Current query in the search box, which may or may not have been submitted
   * yet.
   *
   * @attribute pendingQuery
   * @type String
   */
  pendingQuery: {
    getter: function () {
      return Lang.trim(this.get(QUERY_NODES).item(0).get('value'));
    },

    setter: function (value) {
      value = Lang.trim(value);
      this.get(QUERY_NODES).set('value', value);
      return value;
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
    getter: function () {
      return History.get('q');
    },

    setter: function (value) {
      History.add({q: value, start: null});
      return value;
    }
  },

  /**
   * NodeList containing all search input boxes.
   *
   * @attribute queryNodes
   * @type NodeList
   * @final
   */
  queryNodes: {
    readOnly: true,
    valueFn : function () {
      return Y.all('form.sf input.q');
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

      if (isNaN(value)) {
        return Y.Attribute.INVALID_VALUE;
      }
    },

    valueFn: function () {
      return History.get('count') || 10;
    }
  },

  /**
   * Result offset to use when requesting search results.
   *
   * @attribute resultStart
   * @type Number
   * @default 1
   */
  resultStart: {
    setter: function (value) {
      value = parseInt(value, 10);

      if (isNaN(value)) {
        return Y.Attribute.INVALID_VALUE;
      }
    },

    valueFn: function () {
      return History.get('start') || 1;
    }
  },

  /**
   * NodeList containing all search forms.
   *
   * @attribute searchFormNodes
   * @type NodeList
   * @final
   */
  searchFormNodes: {
    readOnly: true,
    valueFn : function () {
      return Y.all('form.sf');
    }
  }
};

Y.extend(Jetpants, Y.Base, {
  // -- Public Instance Methods ------------------------------------------------
  initializer: function (config) {
    this.publish(EVT_SEARCH, {defaultFn: this._defSearchHandler});
    this._search = new Y.Jetpants.Search();

    this._attachEvents();
    this._render();
  },

  destructor: function () {
    this._detachEvents();
  },

  // -- Protected Methods ------------------------------------------------------
  _attachEvents: function () {
    var search = this._search;

    Y.on(JETPANTS + '|history-lite:change', this._onHistoryChange, this);
    this.get(SEARCH_FORM_NODES).on(JETPANTS + '|submit', this._onSubmit, this);

    search.on('searchStart', this._onSearchStart, this);
    search.on('searchSuccess', this._onSearchSuccess, this);
  },

  _detachEvents: function () {
    this._search.destroy();
    Y.detach(JETPANTS + '|*');
  },

  _render: function () {
    var agents    = ['chrome', 'gecko', 'ie', 'mobile', 'opera', 'webkit'],
        autoFocus = true,
        query     = this.get(QUERY),
        root      = Y.one(doc.documentElement),
        UA        = Y.UA;

    // If the URL contains a search query, remove the .entry class from the
    // document element to indicate that this is now a SRP rather than an entry
    // page and fire a search event.
    if (query) {
      autoFocus = false;

      root.removeClass('entry');
      this.set(PENDING_QUERY, query);

      this.fire(EVT_SEARCH, {
        count: this.get(RESULT_COUNT),
        query: query,
        start: this.get(RESULT_START)
      });
    }

    // Assign useragent-specific classnames to the root element for use in CSS.
    Y.Array.each(agents, function (agent) {
      if (UA[agent]) {
        root.addClass(agent);
      }
    }, this);

    if (UA.os) {
      root.addClass(UA.os);
    }

    // Remove the .loading class from the body now that we're done rendering
    // the initial page state.
    DOM.removeClass(doc.body, 'loading');

    if (autoFocus) {
      this.get(QUERY_NODES).item(0).focus();
    }
  },

  // -- Protected Event Handlers -----------------------------------------------

  /**
   * Default search event handler.
   *
   * @method _defSearchHandler
   * @protected
   */
  _defSearchHandler: function (e) {
    this.setAttrs({
      resultCount: e.count,
      resultStart: e.start
    });

    this._search.search(e.query, {
      count: e.count,
      start: e.start
    });
  },

  /**
   * Handles history change events.
   *
   * @method _onHistoryChange
   * @protected
   */
  _onHistoryChange: function (e) {
    var changed   = e.changed,
        newParsed = e.newParsed,
        removed   = e.removed;

    if (changed.q || changed.count || changed.start || removed.count ||
        removed.start) {

      this.setAttrs({
        resultCount: newParsed.count || 10,
        resultStart: newParsed.start || 1
      });

      if (changed.q) {
        DOM.removeClass(doc.documentElement, 'entry');
        this.set(PENDING_QUERY, changed.q);
      }

      this.fire(EVT_SEARCH, {
        count: this.get(RESULT_COUNT),
        query: newParsed.q,
        start: this.get(RESULT_START)
      });
    } else if (removed.q) {
      DOM.addClass(doc.documentElement, 'entry');
      this.set(PENDING_QUERY, '');
      doc.title = 'Jetpants Search';
      this.get(QUERY_NODES).item(0).focus();
    }
  },

  /**
   * @method _onSearchStart
   * @protected
   */
  _onSearchStart: function (e) {
    doc.title = e.query + ' - Jetpants Search';
  },

  /**
   * Handles a successful search request.
   *
   * @method _onSearchSuccess
   * @protected
   */
  _onSearchSuccess: function (e) {
    var search = this._search;

    win.scroll(0, 0);

    search.renderInfo(Y.one('#bd .info'));
    search.renderResults(Y.one('#results .web'));
    search.renderPagination(Y.one('#bd .pg'));

    Y.one('#results .web a').focus();
  },

  /**
   * Handles search form submission.
   *
   * @method _onSubmit
   * @protected
   */
  _onSubmit: function (e) {
    e.preventDefault();
    this.set(QUERY, this.get(PENDING_QUERY));
  }
});

Y.Jetpants = new Jetpants();

}, '1.0.0', {
    requires: [
      'base', 'event', 'event-custom', 'gallery-history-lite',
      'jetpants-search', 'node'
    ]
});
