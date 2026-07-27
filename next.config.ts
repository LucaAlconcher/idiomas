import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite acceder al servidor de desarrollo desde otros dispositivos de la
  // red local (ej. otra notebook usando la IP de red en vez de localhost).
  allowedDevOrigins: ["192.168.0.20"],
};

export default nextConfig;
