/*global YUI */
/*jslint bitwise: true, browser: true, eqeqeq: true, laxbreak: true, newcap: true, nomen: false, onevar: true, plusplus: false, white: false */

/**
 * @module jetpants-result-module
 * @namespace Jetpants
 */
YUI.add('jetpants-result-module', function (Y) {

/**
 * @class ResultModule
 * @constructor
 */
function ResultModule(config) {
  ResultModule.superclass.constructor.apply(this, arguments);
}

// -- Shorthand ----------------------------------------------------------------
var ATTRS = {},

// Attribute names.
CONTENT_BOX = 'contentBox',
PARENT_NODE = 'parentNode',
RESULTS     = 'results',
TEMPLATES   = 'templates';

// -- Static Properties and Attributes -----------------------------------------
ResultModule.NAME  = 'resultModule';
ResultModule.ATTRS = ATTRS;

/**
 * Node to which rendered results should be appended.
 *
 * @attribute contentBox
 * @type Y.Node
 */
ATTRS[CONTENT_BOX] = {
  setter : Y.one,
  valueFn: function () {
    return Y.Node.create('<div class="' + this.name + '"></div>');
  }
};

/**
 * Parent node to which the content box should be appended.
 *
 * @attribute parentNode
 * @type Y.Node
 */
ATTRS[PARENT_NODE] = {
  setter: Y.one
};

/**
 * Search results for this module.
 *
 * @attribute results
 * @type Object
 */
ATTRS[RESULTS] = {
  value: {}
};

/**
 * Rendered JSON templates for this module. Depending on the module, this may be
 * either a single template itself or an object hash of templates.
 *
 * @attribute templates
 * @type {}
 */
ATTRS[TEMPLATES] = {
  value: {}
};

Y.extend(ResultModule, Y.Base, {
  // -- Public Instance Methods ------------------------------------------------
  destructor: function () {
    this.get(CONTENT_BOX).purge(true).remove();
  },

  render: function () {
    var results = this.get(RESULTS);

    if (!results || !results.results || !results.results.length) {
      return;
    }

    this.get(PARENT_NODE).append(this.get(CONTENT_BOX).append(
        this.get(TEMPLATES).expand(results)));
  }
});

Y.namespace('Jetpants').ResultModule = ResultModule;

}, '1.0.0', {
  requires: ['base', 'node', 'jetpants-search']
});
