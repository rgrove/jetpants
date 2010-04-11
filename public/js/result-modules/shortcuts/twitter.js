/*global YUI */
/*jslint bitwise: true, browser: true, eqeqeq: true, laxbreak: true, newcap: true, nomen: false, onevar: true, plusplus: false, white: false */

/**
 * @module jetpants-shortcut-module-twitter
 * @namespace Jetpants.ShortcutModule
 */
YUI.add('jetpants-shortcut-module-twitter', function (Y) {

/**
 * @class Twitter
 * @constructor
 */
function Twitter(config) {
  Twitter.superclass.constructor.apply(this, arguments);
}

Twitter.NAME = 'twitter';

Y.extend(Twitter, Y.Jetpants.ShortcutModule);
Y.Jetpants.Search.addShortcutModule(Twitter.NAME, Y.Jetpants.ShortcutModule.Twitter = Twitter);

}, '1.0.0', {
  requires: ['jetpants-shortcut-module']
});
