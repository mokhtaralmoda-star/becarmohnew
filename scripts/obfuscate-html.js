/**
 * Post-build HTML obfuscation script
 * - Adds anti-bot/crawler detection that hides the page from bots
 * - Removes source maps, titles, logos, and any identifying info
 * - Adds noindex meta tags
 * - Does NOT touch CSS or JS asset loading (keeps them as normal tags)
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const distDir = join(process.cwd(), 'dist');

// Anti-bot script - hides page content from crawlers by replacing innerHTML
// Only triggers for known bot user agents - does NOT check browser features
const antiBotScript = `<script>(function(){var ua=navigator.userAgent.toLowerCase();var bl=['googlebot','google-safety','safebrowsing','crawler','spider','bot','crawl','slurp','mediapartners','adsbot','bingbot','yandex','baidu','duckduck','facebookexternalhit','twitterbot','rogerbot','linkedinbot','embedly','quora','pinterest','redditbot','slackbot','telegrambot','whatsapp','viber','seznambot','semrush','ahrefs','mj12bot','dotbot','petalbot','bytespider','phishing','malware','safe-browsing','google-inspectiontool','googleother'];var f=false;for(var i=0;i<bl.length;i++){if(ua.indexOf(bl[i])!==-1){f=true;break;}}if(f){document.documentElement.innerHTML='<head><title>Welcome</title></head><body style=\"text-align:center;padding:80px;font-family:sans-serif;background:#fff\"><p style=\"color:#999;font-size:14px\">This page is currently unavailable.</p></body>';window.stop&&window.stop();}})();</script>`;

function obfuscateHTML(filePath) {
  let html = readFileSync(filePath, 'utf-8');
  
  // Remove any source maps references
  html = html.replace(/\/\/# sourceMappingURL=.*$/gm, '');
  html = html.replace(/\/\*# sourceMappingURL=.*?\*\//g, '');
  
  // Remove favicon link tags (logo)
  html = html.replace(/<link[^>]*rel=["']icon["'][^>]*>/gi, '');
  html = html.replace(/<link[^>]*rel=["']shortcut icon["'][^>]*>/gi, '');
  html = html.replace(/<link[^>]*rel=["']apple-touch-icon["'][^>]*>/gi, '');
  
  // Remove any og:image or twitter:image meta tags
  html = html.replace(/<meta[^>]*property=["']og:image["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]*name=["']twitter:image["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]*property=["']og:title["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]*property=["']og:description["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]*name=["']description["'][^>]*>/gi, '');
  
  // Clear the title tag content
  html = html.replace(/<title>[^<]*<\/title>/i, '<title></title>');
  
  // Add meta robots noindex for crawlers
  if (!html.includes('name="robots"')) {
    html = html.replace('</head>', '    <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />\n  </head>');
  }
  
  // Add X-Robots-Tag equivalent
  if (!html.includes('X-Robots-Tag')) {
    html = html.replace('</head>', '    <meta http-equiv="X-Robots-Tag" content="noindex, nofollow" />\n  </head>');
  }
  
  // Inject anti-bot script right after <head> opening (before any other content)
  html = html.replace('<head>', '<head>' + antiBotScript);
  
  // Remove noscript content that might contain brand info
  html = html.replace(/<noscript>[\s\S]*?<\/noscript>/gi, '<noscript><p>Please enable JavaScript</p></noscript>');
  
  writeFileSync(filePath, html);
  console.log(`Obfuscated: ${filePath}`);
}

// Process all HTML files in dist
function processDir(dir) {
  const files = readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = join(dir, file.name);
    if (file.isDirectory()) {
      processDir(fullPath);
    } else if (file.name.endsWith('.html')) {
      obfuscateHTML(fullPath);
    }
  }
}

processDir(distDir);
console.log('HTML obfuscation complete!');
