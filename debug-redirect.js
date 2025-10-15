// Debug script to check what redirect URL is being used
console.log('=== OAuth Redirect Debug ===');
console.log('window.location.origin:', window.location.origin);
console.log('process.env.NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);
console.log('Expected redirect URL:', `${window.location.origin}/auth/callback`);

// Test the redirect logic
const getRedirectURL = () => {
  // Check if we're in the browser
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }

  // Fallback for server-side
  const siteURL = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelURL = process.env.NEXT_PUBLIC_VERCEL_URL;

  if (siteURL) {
    return `${siteURL}/auth/callback`;
  } else if (vercelURL) {
    return `https://${vercelURL}/auth/callback`;
  } else {
    return "http://localhost:3000/auth/callback";
  }
};

console.log('Calculated redirect URL:', getRedirectURL());
console.log('========================');