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

	define('rest/mime/type/application/hal-test', function (require) {

		var hal, mime;

		hal = require('rest/mime/type/application/hal');
		mime = require('rest/interceptor/mime');

		buster.testCase('rest/mime/type/application/hal', {
			'should stringify json': function () {
				assert.equals('{"foo":"bar"}', hal.write({ foo: 'bar' }));
			},
			'should read json': function () {
				assert.equals({ foo: 'bar' }, hal.read('{"foo":"bar"}'));
			},
			'should place embedded relationships on the host object': function () {
				var resource = hal.read(JSON.stringify({ _embedded: { prop: 'embed' } }));
				return resource.prop.then(function (prop) {
					assert.same(prop, 'embed');
				});
			},
			'should not overwrite a property on the host oject with an embedded relationship': function () {
				var resource = hal.read(JSON.stringify({ prop: 'host', _embedded: { prop: 'embed' } }));
				assert.same(resource.prop, 'host');
			},
			'should place linked relationships on the host object': function () {
				var resource = hal.read(JSON.stringify({ _links: { prop: { href: '/' } } }));
				assert.isFunction(resource.prop.then);
			},
			'should not overwrite a property on the host oject with a linked relationship': function () {
				var resource = hal.read(JSON.stringify({ prop: 'host', _links: { prop: { href: '/' } } }));
				assert.same(resource.prop, 'host');
			},
			'should fetch a linked resource': function () {
				var client = mime(function client(request) {
					return request.path === '/' ?
						{ request: request, entity: JSON.stringify({ _links: { self: { href: '/' }, child: { href: '/resource' } } }), headers: { 'Content-Type': 'application/hal+json' } } :
						{ request: request, entity: JSON.stringify({ _links: { self: { href: '/resource' }, parent: { href: '/' } } }), headers: { 'Content-Type': 'application/hal+json' } };
				});

				return client({ path: '/' }).then(function (response) {
					assert.same('/', response.request.path);
					return response.entity.child.then(function (response) {
						assert.same('/resource', response.request.path);
					});
				}).otherwise(fail);
			},
			'should get a client for an relationship': function () {
				function parent(request) {
					return { request: request };
				}

				var resource = hal.read(JSON.stringify({ _links: { prop: { href: '/' } } }), {}, parent);
				return resource.clientFor('prop')().then(function (response) {
					assert.same('/', response.request.path);
				}).otherwise(fail);
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
