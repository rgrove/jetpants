/*global YUI */
/*jslint bitwise: true, browser: true, eqeqeq: true, laxbreak: true, newcap: true, nomen: false, onevar: true, plusplus: false, white: false */

/**
 * @module jetpants-shortcut-module
 * @namespace Jetpants
 */
YUI.add('jetpants-shortcut-module', function (Y) {

/**
 * @class ShortcutModule
 * @constructor
 */
function ShortcutModule(config) {
  ShortcutModule.superclass.constructor.apply(this, arguments);
}

// -- Static Properties and Attributes -----------------------------------------
ShortcutModule.NAME  = 'shortcutModule';
ShortcutModule.ATTRS = {
  /**
   * Node to which rendered results should be appended.
   *
   * @attribute contentBox
   * @type Y.Node
   */
  contentBox: {
    setter : Y.one,
    valueFn: function () {
      return Y.Node.create('<div class="sc ' + this.name + '" role="complementary"></div>');
    }
  }
};

Y.extend(ShortcutModule, Y.Jetpants.ResultModule, {
  render: function () {
    var results = this.get('results');

    if (!results || !results.results || !results.results.length) {
      return;
    }

    this.get('parentNode').prepend(this.get('contentBox').append(
        this.get('templates').expand(results)));
  }
});

Y.namespace('Jetpants').ShortcutModule = ShortcutModule;

}, '1.0.0', {
  requires: ['jetpants-result-module']
});
