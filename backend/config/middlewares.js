module.exports = [
  'strapi::logger',
  'strapi::errors',

  // 🔒 Security settings: allow images/media from your domains
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'admin.stonecera.co.uk',
            'stonecera.co.uk',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'admin.stonecera.co.uk',
            'stonecera.co.uk',
          ],
        },
      },
    },
  },

  // 🌍 CORS configuration
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: [
        'https://stonecera.co.uk',
        'https://www.stonecera.co.uk',
        'https://admin.stonecera.co.uk',
        'http://localhost:3000',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },

  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];