# OSIRIS

OSIRIS is the intelligence and decision-support system being developed in the `KingRwaz` stack.

The first implementation is deliberately separated under `osiris/` so the intelligence kernel can evolve independently from the World Monitor presentation layer while reusing proven data, mapping, finance, and monitoring capabilities later.

## v0.1 kernel

The kernel establishes five primitives:

1. **Sources** — explicit provenance and source reliability metadata.
2. **Observations** — normalized facts/events with timestamps and provenance.
3. **Claims** — statements inferred from observations, with confidence and supporting evidence.
4. **Signals** — scored observations/claims that can be correlated across domains.
5. **Decision packets** — auditable outputs containing evidence, uncertainty, alternatives, and recommended next actions.

OSIRIS does not treat an LLM response as evidence. Model-generated reasoning is an analysis layer; source-backed observations remain the evidence layer.

## Design rules

- Evidence before inference.
- Preserve provenance and timestamps.
- Never silently convert uncertainty into certainty.
- Keep raw observations separate from derived assessments.
- Permit competing hypotheses and alternative interpretations.
- Make every material assessment reproducible from stored inputs.
- Prefer graceful degradation when a data source is unavailable.

## Initial integration path

The kernel is intentionally dependency-light. The next integration layers can connect it to the existing `worldmonitor` feeds/maps, `agentmemory`, `OpenViking`, code-graph/context systems, model routers, and the user's wider agent stack without coupling the intelligence model to any single provider.

## Status

`osiris/core-v0.1` contains the initial domain model and deterministic kernel. It is a development branch and is not yet a production intelligence platform.
