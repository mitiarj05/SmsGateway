import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.4.0/24', '192.168.56.1', '10.0.2.2'],
};

export default nextConfig;
