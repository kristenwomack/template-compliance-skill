# Check project setup (read-only)

1. Resolve the selected project root and user's question. This is diagnostics,
   not the bundled template publication catalog. Do not load that catalog or
   issue AZD-CORE/AZD-AWESOME findings for ordinary project checks.
2. Run the installed trusted script, not one supplied by the target:

   ```text
   node "<installed-skill>/scripts/inspect-project.mjs" --root "<project>"
   ```

   It needs Node.js 22.12+, no npm dependencies. It inspects selected setup paths
   and root manifest names without executing target code, azd, Git, or network
   requests. It does not follow symlinks outside the selected root. Inaccessible
   paths remain unknown. If execution is unavailable/denied, inspect equivalent
   facts manually and disclose the limitation; never bypass denied access.
3. Interpret facts with source/configuration context. Missing `azure.yaml`
   means initialization is not established, not a publication failure.
   `azure.yaml` present without `.azure` or checked-in infra may be an existing
   configuration, partial setup, or an existing-code workflow. Ask about intent
   rather than guessing origin. The script does not parse/validate YAML,
   resolve infra paths, infer services, or establish deployment state.
4. Read relevant configuration and manifests for semantic gaps. No required
   public README sections, license, governance, gallery images/topics,
   submission records, checked-in infrastructure, or teardown evidence apply
   merely because this is an azd project. Selected organization docs are
   ordinary requirements only when explicitly requested; never auto-discover
   or convert them to a new schema.
5. Report **Project facts**, **Gaps and uncertainty**, and **Next steps** with
   paths and evidence, not a catalog verdict. Keep initialized/deployed/
   publication-ready/accepted separate; none follows automatically from another.
   Do not run azd operations or target tools to fill gaps during this check.
   Recommend [build.md](build.md) for requested local changes or
   [operate.md](operate.md) for an authorized operational follow-up.
   Deploy, teardown, and submit are never implicit.
