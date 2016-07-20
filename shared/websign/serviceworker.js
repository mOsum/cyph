var files	= [
	'./',
	'websign/js/workerhelper.js',
	'websign/appcache.appcache',
	'websign/manifest.json',
	'serviceworker.js',
	'unsupportedbrowser',
	'favicon.ico',
	'img/favicon/favicon-192x192.png',
	'img/favicon/favicon-160x160.png',
	'img/favicon/favicon-96x96.png',
	'img/favicon/favicon-32x32.png',
	'img/favicon/favicon-16x16.png',
	'img/favicon/apple-touch-icon-180x180.png',
	'img/favicon/apple-touch-icon-152x152.png',
	'img/favicon/apple-touch-icon-144x144.png',
	'img/favicon/apple-touch-icon-120x120.png',
	'img/favicon/apple-touch-icon-114x114.png',
	'img/favicon/apple-touch-icon-76x76.png',
	'img/favicon/apple-touch-icon-72x72.png',
	'img/favicon/apple-touch-icon-60x60.png',
	'img/favicon/apple-touch-icon-57x57.png',
	'img/favicon/mstile-144x144.png'
].map(function (file) {
	return new Request(file);
});

var root	= files[0].url.replace(/(.*)\/$/, '$1');


self.addEventListener('install', function () {
	Promise.all([
		caches.open('cache'),
		Promise.all(files.map(function (file) {
			return fetch(file, {credentials: 'include'});
		}))
	]).then(function (results) {
		var cache		= results[0];
		var responses	= results[1];

		for (var i = 0 ; i < responses.length ; ++i) {
			cache.put(files[i], responses[i]);
		}
	});
});

self.addEventListener('fetch', function (e) {
	/* Let requests to other origins pass through */
	if (e.request.url.indexOf(root) !== 0) {
		return;
	}

	/* Block non-whitelisted paths in this origin */
	if (
		files.filter(function (file) {
			return e.request.url === file.url;
		}).length < 1
	) {
		return e.respondWith(new Response('', {status: 404}));
	}

	return e.respondWith(
		caches.match(e.request).then(function (cachedResponse) {
			if (cachedResponse) {
				return cachedResponse;
			}

			return Promise.all([
				caches.open('cache'),
				fetch(e.request.clone())
			]).then(function (results) {
				var cache		= results[0];
				var response	= results[1];

				cache.put(e.request, response.clone());

				return response;
			});
		})
	);
});

self.addEventListener('notificationclick', function (e) {
	try {
		e.notification.close();

		e.waitUntil(clients.matchAll({
			type: 'window'
		}).then(function (clientList) {
			for (var i = 0 ; i < clientList.length ; ++i) {
				var client	= clientList[i];

				try {
					return client.focus();
				}
				catch (_) {
					try {
						return clients.openWindow(client);
					}
					catch (_) {}
				}
			}
		}));
	}
	catch (_) {}
});
