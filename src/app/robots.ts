import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const host = 'https://moya-parta.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/join', '/join/', '/register', '/login'],
        disallow: [
          '/desk',
          '/class',
          '/chat',
          '/learning',
          '/wins',
          '/backpack',
          '/board',
          '/events',
          '/notifications',
          '/profile',
          '/onboarding',
          '/teacher',
        ],
      },
    ],
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
