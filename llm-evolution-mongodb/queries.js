// LLM Evolution (2020-2026) - MongoDB queries
// Run with: mongosh "<your Atlas connection string>" --file queries.js
// (or paste each query into an interactive mongosh session after `use IA_Progress`)

db = db.getSiblingDB("IA_Progress");

// ---------------------------------------------------------------------------
// Query 1 - Comparison + logical operators ($gte, $and)
// Models scoring at least 70% on SWE-Bench Verified (fixing real bugs in code).
// SWE-Bench is used instead of MMLU because recent models all score very high
// on MMLU, so it no longer separates them.
// ---------------------------------------------------------------------------
print("\n=== Query 1: models with >= 70% on SWE-Bench Verified ===");
printjson(
  db.benchmark_scores.find(
    { $and: [ { benchmark: "SWE-Bench Verified" }, { score_pct: { $gte: 70 } } ] },
    { _id: 0, model_name: 1, organization: 1, release_date: 1, score_pct: 1 }
  ).toArray()
);

// ---------------------------------------------------------------------------
// Query 2 - Comparing two fields of the same document ($expr, $lt)
// Models that only activate part of their parameters per token
// (active parameters < total parameters, e.g. Mixture-of-Experts models).
// ---------------------------------------------------------------------------
print("\n=== Query 2: models with fewer active than total parameters ===");
printjson(
  db.models_catalog.find(
    { $expr: { $lt: [ "$active_params_billions", "$params_billions" ] } },
    { _id: 0, model_name: 1, organization: 1, release_year: 1, params_billions: 1, active_params_billions: 1 }
  ).toArray()
);

// ---------------------------------------------------------------------------
// Query 3 - Sorting and limiting
// The 5 cheapest models in April 2026 (latest month in the dataset).
// ---------------------------------------------------------------------------
print("\n=== Query 3: 5 cheapest models in April 2026 ===");
printjson(
  db.pricing_history.find(
    { year_month: "2026-04" },
    { _id: 0, model_name: 1, input_usd_per_1m_tokens: 1, output_usd_per_1m_tokens: 1, blended_usd_per_1m_tokens: 1 }
  ).sort({ blended_usd_per_1m_tokens: 1 }).limit(5).toArray()
);

// ---------------------------------------------------------------------------
// Query 4 - Computed average ($expr + $avg) in the filter and the projection
// Models whose average of input and output price is at least $40
// per million tokens in April 2026.
// ---------------------------------------------------------------------------
print("\n=== Query 4: models with an average price >= $40 / 1M tokens (April 2026) ===");
printjson(
  db.pricing_history.find(
    {
      year_month: "2026-04",
      $expr: { $gte: [ { $avg: [ "$input_usd_per_1m_tokens", "$output_usd_per_1m_tokens" ] }, 40 ] }
    },
    {
      _id: 0,
      model_name: 1,
      input_usd_per_1m_tokens: 1,
      output_usd_per_1m_tokens: 1,
      prix_moyen: { $avg: [ "$input_usd_per_1m_tokens", "$output_usd_per_1m_tokens" ] }
    }
  ).toArray()
);
