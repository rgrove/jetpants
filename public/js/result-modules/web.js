/*global YUI */
/*jslint bitwise: true, browser: true, eqeqeq: true, laxbreak: true, newcap: true, nomen: false, onevar: true, plusplus: false, white: false */

/**
 * @module jetpants-result-module-web
 * @namespace Jetpants.ResultModule
 */
YUI.add('jetpants-result-module-web', function (Y) {

/**
 * @class Web
 * @constructor
 */
function Web(config) {
  Web.superclass.constructor.apply(this, arguments);
}

// -- Shorthand ----------------------------------------------------------------
var Search = Y.Jetpants.Search,

// Attribute names.
CONTENT_BOX = 'contentBox',
PARENT_NODE = 'parentNode',
RESULTS     = 'results',
TEMPLATES   = 'templates';

// -- Static Properties --------------------------------------------------------
Web.NAME = 'web';

Y.extend(Web, Y.Jetpants.ResultModule, {
  // -- Public Instance Methods ------------------------------------------------
  render: function () {
    var contentBox = this.get(CONTENT_BOX),
        results    = this.get(RESULTS);

    if (!results) {
      return;
    }

    this._renderResults(contentBox, results);
    this._renderPagination(contentBox, results);

    this.get(PARENT_NODE).append(contentBox);
  },

  // -- Protected Methods ------------------------------------------------------
  _renderPagination: function (contentBox, results) {
    var currentPage = 1,
        i,
        pagination,
        pages       = [],
        queryParams,
        resultCount = Search.get('resultCount'),
        resultStart = Search.get('resultStart'),
        template    = this.get(TEMPLATES + '.pagination'),
        totalPages  = 1,
        windowEnd,
        windowStart;

    if (results.totalhits) {
      totalPages  = Math.min(100, Math.ceil(results.totalhits / resultCount));
      currentPage = Math.ceil((resultStart + 1) / resultCount);
    }

    if (totalPages === 1) {
      return;
    }

    queryParams = {
      q: Search.get('query')
      // count: resultCount // No need to send count yet, since there's no way to customize it
    };

    windowStart = Math.max(1, currentPage - 5);
    windowEnd   = Math.min(windowStart + 9, totalPages);

    for (i = windowStart; i <= windowEnd; ++i) {
      pages.push({
        current    : i === currentPage,
        page       : i,
        queryString: Search.buildQueryString(Y.merge(queryParams, {
          start: (i - 1) * resultCount
        }))
      });
    }

    pagination = {
      next: (function () {
        if (windowEnd > currentPage) {
          return {
            queryString: Search.buildQueryString(Y.merge(queryParams, {
              start: currentPage * resultCount
            }))
          };
        }
      }()),

      pages: pages,

      prev: (function () {
        if (currentPage > 1) {
          return {
            queryString: Search.buildQueryString(Y.merge(queryParams, {
              start: ((currentPage - 2) * resultCount)
            }))
          };
        }
      }())
    };

    contentBox.append(template.expand(pagination));
  },

  _renderResults: function (contentBox, results) {
    contentBox.append(this.get(TEMPLATES + '.results').expand(Y.merge(results, {
      query: Search.get('query'),
      start: Search.get('resultStart') + 1
    })));
  }
});

Search.addResultModule(Web.NAME, Y.Jetpants.Web = Web);

}, '1.0.0', {
  requires: ['jetpants-result-module']
});
