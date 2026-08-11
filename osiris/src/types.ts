export type OsirisDomain =
  | "geopolitics"
  | "economics"
  | "finance"
  | "commodities"
  | "agriculture"
  | "trade"
  | "climate"
  | "health"
  | "infrastructure"
  | "security"
  | "technology"
  | "social"
  | "other";

export type SourceKind = "official" | "institutional" | "news" | "market" | "community" | "derived";

export interface SourceRef {
  readonly id: string;
  readonly name: string;
  readonly uri?: string;
  readonly kind: SourceKind;
  /** Baseline reliability in [0, 1]. This is a prior, not proof of truth. */
  readonly reliability: number;
  readonly collectedAt: string;
}

export interface Observation {
  readonly id: string;
  readonly domain: OsirisDomain;
  readonly title: string;
  readonly content: string;
  readonly observedAt: string;
  readonly ingestedAt: string;
  readonly source: SourceRef;
  readonly entities: readonly string[];
  readonly geography?: readonly string[];
  readonly tags: readonly string[];
  readonly rawHash?: string;
}

export interface EvidenceLink {
  readonly observationId: string;
  /** Strength of the link between evidence and claim in [0, 1]. */
  readonly relevance: number;
  readonly supports: boolean;
}

export interface Claim {
  readonly id: string;
  readonly statement: string;
  readonly createdAt: string;
  readonly evidence: readonly EvidenceLink[];
  /** Confidence in [0, 1], calculated from evidence rather than asserted by a model. */
  readonly confidence: number;
  readonly uncertainty: readonly string[];
  readonly alternatives: readonly string[];
}

export interface Signal {
  readonly id: string;
  readonly domain: OsirisDomain;
  readonly label: string;
  readonly severity: number;
  readonly confidence: number;
  readonly recency: number;
  readonly impact: number;
  readonly observationIds: readonly string[];
  readonly claimIds: readonly string[];
  readonly createdAt: string;
}

export interface Hypothesis {
  readonly id: string;
  readonly statement: string;
  readonly prior: number;
  readonly likelihood: number;
  readonly evidenceIds: readonly string[];
}

export interface DecisionPacket {
  readonly id: string;
  readonly question: string;
  readonly generatedAt: string;
  readonly observations: readonly Observation[];
  readonly claims: readonly Claim[];
  readonly signals: readonly Signal[];
  readonly hypotheses: readonly Hypothesis[];
  readonly keyUncertainties: readonly string[];
  readonly recommendedActions: readonly string[];
}

export interface SignalWeights {
  readonly severity: number;
  readonly confidence: number;
  readonly recency: number;
  readonly impact: number;
}
