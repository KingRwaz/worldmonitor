import type {
  Claim,
  DecisionPacket,
  EvidenceLink,
  Hypothesis,
  Observation,
  OsirisDomain,
  Signal,
  SignalWeights,
  SourceRef,
};

const DEFAULT_WEIGHTS: SignalWeights = {
  severity: 0.3,
  confidence: 0.3,
  recency: 0.15,
  impact: 0.25,
};

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

const normalizeWeights = (weights: SignalWeights): SignalWeights => {
  const total = weights.severity + weights.confidence + weights.recency + weights.impact;
  if (total <= 0) return DEFAULT_WEIGHTS;
  return {
    severity: weights.severity / total,
    confidence: weights.confidence / total,
    recency: weights.recency / total,
    impact: weights.impact / total,
  };
};

const now = (): string => new Date().toISOString();

const id = (prefix: string): string =>
  `${prefix}_${globalThis.crypto.randomUUID()}`;

export interface CreateObservationInput {
  readonly domain: OsirisDomain;
  readonly title: string;
  readonly content: string;
  readonly observedAt?: string;
  readonly source: SourceRef;
  readonly entities?: readonly string[];
  readonly geography?: readonly string[];
  readonly tags?: readonly string[];
  readonly rawHash?: string;
}

export interface CreateClaimInput {
  readonly statement: string;
  readonly evidence: readonly EvidenceLink[];
  readonly uncertainty?: readonly string[];
  readonly alternatives?: readonly string[];
}

export interface CreateSignalInput {
  readonly domain: OsirisDomain;
  readonly label: string;
  readonly severity: number;
  readonly confidence: number;
  readonly recency: number;
  readonly impact: number;
  readonly observationIds?: readonly string[];
  readonly claimIds?: readonly string[];
}

export class OsirisKernel {
  private readonly observations = new Map<string, Observation>();
  private readonly claims = new Map<string, Claim>();
  private readonly signals = new Map<string, Signal>();

  ingest(input: CreateObservationInput): Observation {
    const observation: Observation = {
      id: id("obs"),
      domain: input.domain,
      title: input.title.trim(),
      content: input.content.trim(),
      observedAt: input.observedAt ?? now(),
      ingestedAt: now(),
      source: input.source,
      entities: [...(input.entities ?? [])],
      geography: input.geography ? [...input.geography] : undefined,
      tags: [...(input.tags ?? [])],
      rawHash: input.rawHash,
    };

    this.observations.set(observation.id, observation);
    return observation;
  }

  assertClaim(input: CreateClaimInput): Claim {
    const evidence = input.evidence.filter((link) => this.observations.has(link.observationId));
    const confidence = this.calculateClaimConfidence(evidence);
    const claim: Claim = {
      id: id("clm"),
      statement: input.statement.trim(),
      createdAt: now(),
      evidence,
      confidence,
      uncertainty: [...(input.uncertainty ?? [])],
      alternatives: [...(input.alternatives ?? [])],
    };

    this.claims.set(claim.id, claim);
    return claim;
  }

  scoreSignal(input: CreateSignalInput, weights: SignalWeights = DEFAULT_WEIGHTS): Signal {
    const normalized = normalizeWeights(weights);
    const signal: Signal = {
      id: id("sig"),
      domain: input.domain,
      label: input.label.trim(),
      severity: clamp(input.severity),
      confidence: clamp(input.confidence),
      recency: clamp(input.recency),
      impact: clamp(input.impact),
      observationIds: [...(input.observationIds ?? [])].filter((value) => this.observations.has(value)),
      claimIds: [...(input.claimIds ?? [])].filter((value) => this.claims.has(value)),
      createdAt: now(),
    };

    // Keep the score derivable without persisting a second opaque number.
    // Consumers can use signalScore(signal, weights) whenever ranking is required.
    void normalized;
    this.signals.set(signal.id, signal);
    return signal;
  }

  getObservation(observationId: string): Observation | undefined {
    return this.observations.get(observationId);
  }

  getClaim(claimId: string): Claim | undefined {
    return this.claims.get(claimId);
  }

  getSignal(signalId: string): Signal | undefined {
    return this.signals.get(signalId);
  }

  listSignals(domain?: OsirisDomain): Signal[] {
    return [...this.signals.values()]
      .filter((signal) => domain === undefined || signal.domain === domain)
      .sort((a, b) => signalScore(b) - signalScore(a));
  }

  buildDecisionPacket(input: {
    readonly question: string;
    readonly observationIds?: readonly string[];
    readonly claimIds?: readonly string[];
    readonly signalIds?: readonly string[];
    readonly hypotheses?: readonly Hypothesis[];
    readonly keyUncertainties?: readonly string[];
    readonly recommendedActions?: readonly string[];
  }): DecisionPacket {
    const observations = this.resolve(this.observations, input.observationIds);
    const claims = this.resolve(this.claims, input.claimIds);
    const signals = this.resolve(this.signals, input.signalIds).sort((a, b) => signalScore(b) - signalScore(a));

    return {
      id: id("dpk"),
      question: input.question.trim(),
      generatedAt: now(),
      observations,
      claims,
      signals,
      hypotheses: [...(input.hypotheses ?? [])],
      keyUncertainties: [...(input.keyUncertainties ?? [])],
      recommendedActions: [...(input.recommendedActions ?? [])],
    };
  }

  private calculateClaimConfidence(evidence: readonly EvidenceLink[]): number {
    if (evidence.length === 0) return 0;

    let support = 0;
    let total = 0;
    for (const link of evidence) {
      const observation = this.observations.get(link.observationId);
      if (!observation) continue;
      const contribution = clamp(observation.source.reliability) * clamp(link.relevance);
      total += contribution;
      if (link.supports) support += contribution;
    }

    return total === 0 ? 0 : clamp(support / total);
  }

  private resolve<T extends { readonly id: string }>(
    store: ReadonlyMap<string, T>,
    ids?: readonly string[],
  ): T[] {
    if (!ids) return [...store.values()];
    return ids.flatMap((itemId) => {
      const item = store.get(itemId);
      return item ? [item] : [];
    });
  }
}

export const signalScore = (signal: Signal, weights: SignalWeights = DEFAULT_WEIGHTS): number => {
  const normalized = normalizeWeights(weights);
  return (
    signal.severity * normalized.severity +
    signal.confidence * normalized.confidence +
    signal.recency * normalized.recency +
    signal.impact * normalized.impact
  );
};
