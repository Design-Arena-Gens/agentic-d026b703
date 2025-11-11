/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["https://agentic-d026b703.vercel.app", "http://localhost:3000"]
    }
  }
};

export default nextConfig;
