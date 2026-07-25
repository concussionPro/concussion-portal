import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      /**
       * WARN, not ERROR — deliberate, reviewed 2026-07-26.
       *
       * Every remaining occurrence in this repo is the same shape: read
       * BROWSER-ONLY state (localStorage, sessionStorage, document.cookie,
       * window.location.search, matchMedia) inside a mount effect and set it
       * into state.
       *
       * That is not an anti-pattern here — it is what App Router REQUIRES. The
       * server render and the client's first render must emit identical markup,
       * so browser-only values cannot be read during render or in a useState
       * initialiser without causing a hydration mismatch. Reading them in an
       * effect and setting state is the documented way, and this rule cannot
       * distinguish it from the cascading-render case it exists to catch.
       *
       * The genuine violations WERE fixed rather than muted:
       *   - admin/partnerships: a prop->state sync effect that rendered stale
       *     input content for a frame (now adjusts state during render);
       *   - CountdownTimer / ProgressRing: hand-rolled `mounted` flags, now the
       *     shared hooks/useMounted.
       *
       * Kept as a warning so a REAL cascading-render bug still surfaces in
       * review. Do not silence it per-file; if a new one appears, check whether
       * it is genuinely the hydration pattern before accepting it.
       */
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
