class Config {
  static get apiUrl(): string {
    return import.meta.env.VITE_API_URL || "http://localhost:3000";
  }

  static get supabaseUrl(): string {
    return import.meta.env.VITE_SUPABASE_URL || "";
  }

  static get supabaseAnonKey(): string {
    return import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  }
}

export default Config;
