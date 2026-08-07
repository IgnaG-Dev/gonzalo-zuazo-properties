import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: ["dist-worker/**", "node_modules/**", ".next/**"],
  },
];

export default eslintConfig;
