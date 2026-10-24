import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "i.ytimg.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "img.youtube.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "encrypted-tbn0.gstatic.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "encrypted-tbn1.gstatic.com",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;