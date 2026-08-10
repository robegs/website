# Hosting and Deployment Guidance

This site is a static HTML/CSS/JS website. The following guidance is designed to improve security, performance, and reliability after the baseline changes in this PR.

## Recommended security headers

Add the following response headers at the hosting/CDN layer whenever possible:

- Strict-Transport-Security
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- Content Security Policy
  - Example:
    `Content-Security-Policy: default-src 'self'; script-src 'self' https://plausible.io; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://plausible.io; object-src 'none'; base-uri 'self'; frame-ancestors 'self';`
- Referrer Policy
  - `Referrer-Policy: strict-origin-when-cross-origin`
- Permissions Policy
  - `Permissions-Policy: interest-cohort=()`
- X-Frame-Options
  - `X-Frame-Options: DENY`
- X-Content-Type-Options
  - `X-Content-Type-Options: nosniff`
- Cache-Control
  - For static assets: `Cache-Control: public, max-age=31536000, immutable`
  - For HTML pages: `Cache-Control: public, max-age=600, must-revalidate`

## Hosting and CDN recommendations

- Use HTTPS for the custom domain and enforce redirect from HTTP to HTTPS.
- If you deploy on GitHub Pages, consider fronting the site with Cloudflare or another CDN to apply response headers that GitHub Pages cannot set directly.
- If you have a CDN available, enable caching for static assets and set long cache lifetimes for versioned files.
- Use the `sitemap.xml` and `robots.txt` added in this PR to improve search engine discovery.

## Performance recommendations

- Serve modern image formats (WebP, AVIF) alongside JPEG/PNG fallbacks.
- Use `Link: <...>; rel=preload` for critical above-the-fold assets such as the hero image or important fonts.
- Keep fonts cached and reduce third-party dependencies where possible.

## Deployment workflow

- Push accepted changes to the `main` branch.
- Lighthouse CI is configured to run on pull requests and pushes to `main`.
- Review Lighthouse CI output and adjust thresholds or assertions as needed after the first successful run.

## Notes

- If you use GitHub Pages, note that some headers need a reverse proxy or Cloudflare page rules to be applied.
- The `Content-Security-Policy` above is an example; adjust it if you add additional external scripts, styles, or embedded content.
