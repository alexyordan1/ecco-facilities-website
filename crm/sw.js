var CACHE_NAME = 'ecco-crm-v1';
var PRECACHE = ['/css/crm.css', '/js/crm-core.js'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(clients.claim());
});

/* Network-first strategy — always try network, fall back to cache */
self.addEventListener('fetch', function(e) {
  /* Skip non-GET and API requests */
  if (e.request.method !== 'GET' || e.request.url.indexOf('/api/') !== -1) return;

  e.respondWith(
    fetch(e.request).then(function(res) {
      return res;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});

/* Handle push notifications */
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch (err) { data = { title: 'Ecco CRM', body: e.data ? e.data.text() : 'New notification' }; }

  e.waitUntil(
    self.registration.showNotification(data.title || 'Ecco CRM', {
      body: data.body || '',
      icon: '/images/favicon-32.png',
      badge: '/images/favicon-32.png',
      tag: data.tag || 'ecco-crm',
      data: data.url || '/crm/leads'
    })
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = e.notification.data || '/crm/leads';
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf('/crm/') !== -1) {
          list[i].focus();
          list[i].navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
