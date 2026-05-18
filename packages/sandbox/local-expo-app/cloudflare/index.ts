// Cloudflare Workers entry point for serving Expo web build
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Get the asset from the static site binding
    const asset = await env.ASSETS.fetch(request);

    if (asset.status === 404) {
      // For Expo Router / SPA, return index.html for client-side routing
      const indexRequest = new Request(
        new URL('/index.html', request.url),
        request
      );
      return env.ASSETS.fetch(indexRequest);
    }

    return asset;
  },
};

interface Env {
  ASSETS: Fetcher;
}
