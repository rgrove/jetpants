/**
 * Jetpants search module.
 *
 * @module jetpants-search
 * @namespace Jetpants
 */
YUI.add('jetpants-search', function (Y) {

// -- Constructor --------------------------------------------------------------

/**
 * @class Search
 */
function Search(config) {
  Search.superclass.constructor.apply(this, arguments);
}

// -- Shorthand ----------------------------------------------------------------
var doc  = Y.config.doc,
    Lang = Y.Lang,
    Node = Y.Node,

QUERY   = 'query',
RESULTS = 'results',

// -- Public Events ------------------------------------------------------------

/**
 * @event searchEnd
 */
EVT_SEARCH_END = 'searchEnd',

/**
 * @event searchFailure
 */
EVT_SEARCH_FAILURE = 'searchFailure',

/**
 * @event searchStart
 */
EVT_SEARCH_START = 'searchStart',

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
   * Query from the most recent search request, if any.
   *
   * @attribute query
   * @type String
   * @final
   */
  query: {readOnly: true},

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
  }
};

Y.extend(Search, Y.Base, {
  // -- Public Instance Methods ------------------------------------------------
  // initializer: function (config) {},
  // destructor: function () {},

  encodeEntities: function (string) {
    var div = doc.createElement('div');
    div.appendChild(doc.createTextNode(string));
    return div.innerHTML;
  },

  formatNumber: function (number) {
    return Y.DataType.Number.format(number, {
      thousandsSeparator: ','
    });
  },

  renderInfo: function (parent) {
    var parentNode = Y.one(parent),
        results    = this.get(RESULTS);

    parentNode.get('children').remove();
    parentNode.append(
      '<p>' +
        'Results <strong>' + results.start + ' - ' + (results.start + results.count - 1) + '</strong> ' +
        'of about <strong>' + this.formatNumber(results.deephits) + '</strong> for ' +
        '<strong>' + this.encodeEntities(this.get(QUERY)) + '</strong>' +
      '</p>'
    );
  },

  renderPagination: function (parent) {
    var parentNode = Y.one(parent),
        results    = this.get(RESULTS),
        pagination = {},
        query      = this.get(QUERY),
        currentPage, i, li, pages, queryParams, queryString, ul;

    parentNode.get('children').remove();

    if (results.totalhits === 0) {
      currentPage = 1;
      pages       = 1;
    } else {
      pages       = Math.min(100, Math.ceil(results.totalhits / results.count));
      currentPage = Math.ceil(results.start / results.count);
    }

    if (pages === 1) {
      return;
    }

    pagination.start = Math.max(1, currentPage - 5);
    pagination.end   = Math.min(pagination.start + 9, pages);

    queryParams = {
      q    : query,
      count: results.count
    };

    ul = Node.create('<ul role="navigation"/>');

    if (currentPage > 1) {
      queryString = this._buildQueryString(Y.merge(queryParams, {
        start: ((currentPage - 2) * results.count) + 1
      }));

      ul.append(
        '<li class="prev">' +
          '<a href="#' + queryString + '" rel="prev">Prev</a>' +
        '</li>'
      );
    }

    for (i = pagination.start; i <= pagination.end; ++i) {
      queryString = this._buildQueryString(Y.merge(queryParams, {
        start: ((i - 1) * results.count) + 1
      }));

      li = Node.create('<li/>');

      if (i === currentPage) {
        li.append('<strong>' + i + '</strong>');
      } else {
        li.append('<a href="#' + queryString + '">' + i + '</a>');
      }

      ul.append(li);
    }

    if (pagination.end > currentPage) {
      queryString = this._buildQueryString(Y.merge(queryParams, {
        start: (currentPage * results.count) + 1
      }));

      ul.append(
        '<li class="next">' +
          '<a href="#' + queryString + '" rel="next">Next</a>' +
        '</li>'
      );
    }

    parentNode.append(ul);
  },

  renderResults: function (parent) {
    var parentNode = Y.one(parent),
        results    = this.get(RESULTS),
        ol         = Node.create('<ol start="' + results.start + '"/>');

    Y.Array.each(results.results, function (result) {
      ol.append(
        '<li>' +
          '<h3 class="title"><a href="' + result.url + '">' + result.title + '</a></h3>' +
          '<div class="abstract">' + result['abstract'] + '</div>' +
          '<cite>' + result.dispurl + '</cite>' +
        '</li>'
      );
    }, this);

    parentNode.get('children').remove();
    parentNode.append(ol);
  },

  search: function (query, config) {
    var params = {q: query},
        url    = this.get('apiUrl'),
        facade;

    config = Y.merge({
      count  : 10,
      start  : 1
    }, config || {});

    facade = Y.merge(config, {query: query});

    if (config.count !== 10) {
      params.count = config.count;
    }

    if (config.start !== 1) {
      params.start = config.start;
    }

    if (this._request && this._request.isInProgress()) {
      this._request.abort();
    }

    this._request = Y.io(url, {
      context: this,
      data   : this._buildQueryString(params),
      timeout: 15000,

      on: {
        end: function () {
          this.fire(EVT_SEARCH_END, facade);
        },

        failure: function (id, response) {
          var facade = Y.merge(facade, {response: response});

          try {
            facade.data = Y.JSON.parse(response.responseText);
          } catch (ex) {
            facade.exception = ex;
          }

          this.fire(EVT_SEARCH_FAILURE, facade);
        },

        start: function () {
          this._set(QUERY, query);
          this._set(RESULTS, {});

          this.fire(EVT_SEARCH_START, facade);
        },

        success: function (id, response) {
          var facade = Y.merge(facade, {response: response});

          try {
            facade.data = Y.JSON.parse(response.responseText);
          } catch (ex) {
            facade.exception = ex;
            this.fire(EVT_SEARCH_FAILURE, facade);
            return;
          }

          this._set(RESULTS, facade.data);
          this.fire(EVT_SEARCH_SUCCESS, facade);
        }
      }
    });
  },

  // -- Protected Methods ------------------------------------------------------
  _buildQueryString: function (params) {
    var _params = [],
        encode  = encodeURIComponent;

    Y.each(params, function (value, name) {
        _params.push(encode(name) + '=' + encode(value));
    });

    return _params.join('&');
  }

  // -- Protected Event Handlers -----------------------------------------------
});

Y.namespace('Jetpants').Search = Search;

}, '1.0.0', {
    requires: [
      'base', 'datatype-number', 'io-base', 'json-parse', 'node'
    ]
});
