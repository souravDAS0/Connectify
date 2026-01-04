/**
 * Config class to handle environment-specific URL retrieval.
 *
 * Note: Vite only exposes environment variables prefixed with VITE_ by default.
 * If you are using PROD_API_URL and ENVIRONMENT without VITE_ prefix,
 * you might need to add them to vite.config.ts define or rename them to VITE_PROD_API_URL etc.
 */
class Config {
  private static getEnvironment(): string {
    // Check for VITE_ENVIRONMENT first, then ENVIRONMENT, then default to development
    // import.meta.env.MODE is also a logical fallback for Vite
    return (
      // import.meta.env.VITE_ENVIRONMENT ||
      import.meta.env.ENVIRONMENT || import.meta.env.MODE || "development"
    );
  }

  static get apiUrl(): string {
    const env = this.getEnvironment();
    if (env === "production") {
      return (
        import.meta.env.PROD_API_URL || import.meta.env.VITE_PROD_API_URL || ""
      );
    }
    return import.meta.env.VITE_API_URL || "";
  }

  static get wsUrl(): string {
    const env = this.getEnvironment();
    if (env === "production") {
      return (
        import.meta.env.PROD_WS_URL || import.meta.env.VITE_PROD_WS_URL || ""
      );
    }
    return import.meta.env.VITE_WS_URL || "";
  }

  static get clerkKey(): string {
    return import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "";
  }
}

export default Config;
