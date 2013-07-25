/*
 * Copyright 2013 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (buster, define) {
	'use strict';

	var assert, refute, fail;

	assert = buster.assertions.assert;
	refute = buster.assertions.refute;
	fail = buster.assertions.fail;

	define('rest/interceptor/hateoas/hal-test', function (require) {

		var hal, rest;

		hal = require('rest/interceptor/hateoas/hal');
		rest = require('rest');

		buster.testCase('rest/interceptor/hateoas/hal', {
			'should place embedded relationships on the host object': function () {
				var client = hal(function () { return { entity: { _embedded: { prop: 'embed' } } }; });
				return client().then(function (response) {
					return response.entity.prop.then(function (prop) {
						assert.same(prop, 'embed');
					});
				}).otherwise(fail);
			},
			'should not overwrite a property on the host oject with an embedded relationship': function () {
				var client = hal(function () { return { entity: { prop: 'host', _embedded: { prop: 'embed' } } }; });
				return client().then(function (response) {
					assert.same(response.entity.prop, 'host');
				}).otherwise(fail);
			},
			'should place linked relationships on the host object': function () {
				var client = hal(function () { return { entity: { _links: { prop: { href: '/' } } } }; });
				return client().then(function (response) {
					assert.isFunction(response.entity.prop.then);
				}).otherwise(fail);
			},
			'should not overwrite a property on the host oject with a linked relationship': function () {
				var client = hal(function () { return { entity: { prop: 'host', _links: { prop: { href: '/' } } } }; });
				return client().then(function (response) {
					assert.same(response.entity.prop, 'host');
				}).otherwise(fail);
			},
			'should fetch a linked resource': function () {
				var client, parentClient;

				parentClient = function (request) {
					return request.path === '/' ?
						{ request: request, entity: { _links: { self: { href: '/' }, child: { href: '/resource' } } } } :
						{ request: request, entity: { _links: { self: { href: '/resource' }, parent: { href: '/' } } } };
				};
				client = hal(parentClient);

				return client({ path: '/' }).then(function (response) {
					assert.same('/', response.request.path);
					return response.entity.child.then(function (response) {
						assert.same('/resource', response.request.path);
					});
				}).otherwise(fail);
			},
			'should have the default client as the parent by default': function () {
				assert.same(rest, hal().skip());
			},
			'should support interceptor chaining': function () {
				assert(typeof hal().chain === 'function');
			}
		});

	});

}(
	this.buster || require('buster'),
	typeof define === 'function' && define.amd ? define : function (id, factory) {
		var packageName = id.split(/[\/\-]/)[0], pathToRoot = id.replace(/[^\/]+/g, '..');
		pathToRoot = pathToRoot.length > 2 ? pathToRoot.substr(3) : pathToRoot;
		factory(function (moduleId) {
			return require(moduleId.indexOf(packageName) === 0 ? pathToRoot + moduleId.substr(packageName.length) : moduleId);
		});
	}
	// Boilerplate for AMD and Node
));
