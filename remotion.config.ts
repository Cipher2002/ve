import path from "path";
import type { WebpackOverrideFn } from "@remotion/bundler";

export const webpackOverride: WebpackOverrideFn = (config) => {
  console.log("✅ remotion.config.ts loaded!");

  return {
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias ?? {}),
        "@": path.resolve(__dirname, "src/app/versions/7.0.0"),
      },
    },
  };
};
