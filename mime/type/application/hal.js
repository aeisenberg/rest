/*
 * Copyright 2013 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (define) {
	'use strict';

	define(function (require) {

		var json, pathPrefix, find, lazyPromise, when;

		json = require('./json');
		pathPrefix = require('../../../interceptor/pathPrefix');
		find = require('../../../util/find');
		lazyPromise = require('../../../util/lazyPromise');
		when = require('when');

		return {

			read: function (str, response, opts) {
				var root, client, console;

				opts = opts || {};
				client = opts.client;
				console = opts.console || console;
				root = json.read.apply(json, arguments);

				function deprecationWarning(relationship, deprecation) {
					if (deprecation && console && console.warn || console.log) {
						(console.warn || console.log).call(console, 'Relationship \'' + relationship + '\' is deprecated, see ' + deprecation);
					}
				}

				find.findProperties(root, '_embedded', function (embedded, resource, name) {
					Object.keys(embedded).forEach(function (relationship) {
						if (relationship in resource) { return; }
						resource[relationship] = when(embedded[relationship]);
					});
					Object.defineProperty(resource, name, { value: embedded, configurable: true, writeable: true });
				});
				find.findProperties(root, '_links', function (links, resource, name) {
					Object.keys(links).forEach(function (relationship) {
						if (relationship in resource) { return; }
						resource[relationship] = lazyPromise(function () {
							var link = links[relationship];
							if (link.deprecation) { deprecationWarning(relationship, link.deprecation); }
							return client({ path: link.href });
						});
					});
					Object.defineProperty(resource, name, { value: links, configurable: true, writeable: true });
					Object.defineProperty(resource, 'clientFor', {
						value: function (relationship, clientOverride) {
							var link = links[relationship];
							if (link.deprecation) { deprecationWarning(relationship, link.deprecation); }
							return pathPrefix(
								clientOverride || client,
								{ prefix: link.href }
							);
						},
						configurable: true,
						writeable: true
					});
				});

				return root;
			},

			write: function () {
				return json.write.apply(json, arguments);
			}

		};
	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
