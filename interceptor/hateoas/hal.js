/*
 * Copyright 2013 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (define) {
	'use strict';

	define(function (require) {

		var interceptor, pathPrefix, find, lazyPromise, when;

		interceptor = require('../../interceptor');
		pathPrefix = require('../pathPrefix');
		find = require('../../util/find');
		lazyPromise = require('../../util/lazyPromise');
		when = require('when');

		/**
		 * TBD
		 *
		 * @param {Client} [client] client to wrap
		 * @param {Client} [config.client=request.originator] the parent client to
		 *   use when creating clients for a linked resources. Defaults to the
		 *   request's originator if available, otherwise the current interceptor's
		 *   client
		 *
		 * @returns {Client}
		 */
		return interceptor({
			response: function (response, config, client) {
				client = config.client || (response.request && response.request.originator) || client;

				find.findProperties(response, '_embedded', function (embedded, resource, name) {
					Object.keys(embedded).forEach(function (relationship) {
						if (relationship in resource) { return; }
						resource[relationship] = when(embedded[relationship]);
					});
					Object.defineProperty(resource, name, { value: embedded, configurable: true, writeable: true });
				});
				find.findProperties(response, '_links', function (links, resource, name) {
					Object.keys(links).forEach(function (relationship) {
						if (relationship in resource) { return; }
						resource[relationship] = lazyPromise(function () {
							return client({ path: links[relationship].href });
						});
					});
					Object.defineProperty(resource, name, { value: links, configurable: true, writeable: true });
					Object.defineProperty(resource, 'clientFor', {
						value: function (relationship, clientOverride) {
							return pathPrefix(
								clientOverride || client,
								{ prefix: links[relationship].href }
							);
						},
						configurable: true,
						writeable: true
					});
				});

				return response;
			}
		});

	});

}(
	typeof define === 'function' && define.amd ? define : function (factory) { module.exports = factory(require); }
	// Boilerplate for AMD and Node
));
