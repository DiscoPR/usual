/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crawl from "../crawl.js";
import type * as crawls from "../crawls.js";
import type * as enrich from "../enrich.js";
import type * as http from "../http.js";
import type * as mail from "../mail.js";
import type * as match from "../match.js";
import type * as profile from "../profile.js";
import type * as seed from "../seed.js";
import type * as seedData from "../seedData.js";
import type * as sources from "../sources.js";
import type * as taste from "../taste.js";
import type * as taxonomy from "../taxonomy.js";
import type * as trips from "../trips.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crawl: typeof crawl;
  crawls: typeof crawls;
  enrich: typeof enrich;
  http: typeof http;
  mail: typeof mail;
  match: typeof match;
  profile: typeof profile;
  seed: typeof seed;
  seedData: typeof seedData;
  sources: typeof sources;
  taste: typeof taste;
  taxonomy: typeof taxonomy;
  trips: typeof trips;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
  firecrawl: import("@firecrawl/firecrawl-convex/_generated/component.js").ComponentApi<"firecrawl">;
  agentmail: import("@agentmail/convex/_generated/component.js").ComponentApi<"agentmail">;
};
