import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            titleProp: true,
            ref: true,
          },
        },
      ],
    });

    return config;
  },

  async rewrites() {
    return [
      // Proxy auth routes → NestJS API
      {
        source: "/auth/:path*",
        destination: "http://localhost:3000/auth/:path*",
      },
      // Proxy CVX wizard / engine routes → NestJS API
      {
        source: "/cvx/:path*",
        destination: "http://localhost:3000/cvx/:path*",
      },
    ];
  },
};

export default nextConfig;
