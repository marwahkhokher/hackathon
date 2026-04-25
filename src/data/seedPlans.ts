import type { ExperimentPlan } from "@/lib/schemas";

// ===========================================================
// Expert-curated example plans — used as
//   (a) few-shot priors for plan generation, and
//   (b) demo seed data so the app is interactive on first run.
// Numbers are realistic, not invented at runtime by an LLM.
// ===========================================================

export const SEED_PLANS: ExperimentPlan[] = [
  {
    title:
      "Trehalose vs. sucrose cryoprotectant comparison in HeLa cells (3-arm)",
    summary:
      "Compare post-thaw viability of HeLa cells frozen with 10% DMSO (control), 0.3 M sucrose + 5% DMSO, and 0.3 M trehalose + 5% DMSO. Primary endpoint: ≥15 percentage-point improvement in 24h post-thaw viability over DMSO-only control.",
    intent: {
      domain: "cell_biology",
      hypothesis_restated:
        "Substituting trehalose for sucrose as the non-DMSO cryoprotectant component improves HeLa post-thaw viability by ≥15 pp.",
      intervention: "0.3 M trehalose in freezing medium with 5% DMSO",
      comparator: "Standard 10% DMSO freezing medium",
      outcome: {
        name: "Post-thaw cell viability at 24h",
        metric: "Trypan blue exclusion (% viable)",
        threshold: "≥15 percentage-point improvement over control",
        direction: "increase",
      },
      variables: {
        independent: ["Cryoprotectant formulation"],
        dependent: ["24h viability", "membrane integrity", "recovery doubling time"],
        controlled: [
          "Passage number (P12–P15)",
          "Seeding density",
          "Freeze rate (-1 °C/min)",
          "Thaw protocol",
        ],
      },
      model_system: "HeLa (ATCC CCL-2) adherent monolayer",
      constraints: [
        "BSL-2 facility",
        "Standard tissue culture hood",
        "Liquid nitrogen storage",
      ],
      ethics_flags: [],
      keywords: ["hela", "cryoprotectant", "trehalose", "viability"],
    },
    controls: [
      { type: "negative", description: "10% DMSO in DMEM+10% FBS — community standard." },
      { type: "baseline", description: "Fresh (non-frozen) cells assayed in parallel as 100% viability anchor." },
      { type: "vehicle", description: "Sucrose-matched osmotic control (0.3 M sucrose + 5% DMSO)." },
    ],
    protocol: [
      {
        id: "S1",
        phase: "Preparation",
        title: "Cell expansion & QC",
        duration: "5 days",
        description:
          "Thaw HeLa stock at P10. Expand in DMEM/GlutaMAX + 10% FBS + 1% Pen-Strep at 37 °C / 5% CO₂. Subculture at 80% confluence using 0.25% trypsin-EDTA. Verify mycoplasma-negative by PCR (e.g., MycoAlert) before freezing.",
        critical_parameters: ["Confluence 70–80% at harvest", "Mycoplasma-negative", "Passage P12–P15"],
        safety_notes: ["BSL-2", "Use class II BSC"],
        references: ["ATCC CCL-2 datasheet"],
      },
      {
        id: "S2",
        phase: "Freezing media prep",
        title: "Prepare three freezing media",
        duration: "1 day",
        description:
          "Prepare: (A) 10% DMSO in 90% complete DMEM; (B) 5% DMSO + 0.3 M sucrose in DMEM; (C) 5% DMSO + 0.3 M trehalose in DMEM. Sterile-filter (0.22 µm). Pre-chill all media to 4 °C. Verify osmolality (target 800–1100 mOsm/kg).",
        critical_parameters: ["Osmolality verified", "Sterile-filtered", "Pre-chilled to 4 °C"],
        safety_notes: ["DMSO is a skin penetrant — wear nitrile gloves"],
        references: ["protocols.io: Cryopreservation of mammalian cells"],
      },
      {
        id: "S3",
        phase: "Cryopreservation",
        title: "Harvest, count, and freeze",
        duration: "1 day",
        description:
          "Trypsinize, neutralize with serum, pellet at 200×g for 5 min, resuspend at 1×10⁶ cells/mL in each freezing medium. Aliquot 1 mL into pre-labeled cryovials (n=18 per arm; 3 arms × 6 timepoints × 3 replicates). Place in Mr. Frosty isopropanol container at −80 °C overnight, then transfer to LN₂ vapor phase.",
        critical_parameters: ["Cell density 1×10⁶/mL", "Cooling rate −1 °C/min", "≤30 min total handling time"],
        safety_notes: ["Cryogenic gloves", "Face shield when handling LN₂"],
        references: ["Pegg DE, Methods Mol Biol 2007"],
      },
      {
        id: "S4",
        phase: "Storage",
        title: "LN₂ storage hold",
        duration: "7 days",
        description:
          "Hold all vials in LN₂ vapor phase for a minimum of 7 days to capture short-term storage effects. Maintain temperature log.",
        critical_parameters: ["Temp log < −150 °C"],
        safety_notes: [],
        references: [],
      },
      {
        id: "S5",
        phase: "Thaw & viability",
        title: "Rapid thaw + Trypan blue + recovery",
        duration: "3 days (per timepoint)",
        description:
          "Thaw vials in 37 °C water bath for 60–90 s. Dilute 1:9 dropwise into pre-warmed complete medium. Pellet, resuspend, count viable cells by Trypan blue exclusion (Countess II). Plate 2×10⁵ cells/well in 6-well plates. Re-assay viability and confluence at 24 h.",
        critical_parameters: ["Thaw time ≤90 s", "Drop-wise dilution to limit osmotic shock"],
        safety_notes: ["BSL-2"],
        references: ["protocols.io: Trypan blue exclusion assay"],
      },
      {
        id: "S6",
        phase: "Functional recovery",
        title: "72h growth curve",
        duration: "3 days",
        description:
          "Track confluence by IncuCyte or daily manual counts. Compute population doubling time. Compare to fresh-cell baseline.",
        critical_parameters: ["Imaging interval ≤4 h"],
        safety_notes: [],
        references: [],
      },
      {
        id: "S7",
        phase: "Analysis",
        title: "Statistics & reporting",
        duration: "5 days",
        description:
          "Two-way ANOVA (cryoprotectant × timepoint) with Tukey post-hoc. n=3 biological × 3 technical replicates per arm per timepoint. Power: ≥80% to detect 15 pp difference at α=0.05 (computed n≥4 vials/arm).",
        critical_parameters: ["Pre-registered analysis plan", "Blinded counting"],
        safety_notes: [],
        references: ["MIQE-style reporting standards"],
      },
    ],
    materials: [
      { name: "HeLa cell line", category: "biological", supplier: "ATCC", catalog_number: "CCL-2", url: "https://www.atcc.org/products/ccl-2", quantity: "1 vial", unit_cost_usd: 605, total_cost_usd: 605 },
      { name: "DMEM, high glucose, GlutaMAX", category: "reagent", supplier: "Thermo Fisher", catalog_number: "10566016", quantity: "4 × 500 mL", unit_cost_usd: 38, total_cost_usd: 152 },
      { name: "FBS, qualified", category: "reagent", supplier: "Thermo Fisher", catalog_number: "26140079", quantity: "1 × 500 mL", unit_cost_usd: 540, total_cost_usd: 540 },
      { name: "Penicillin-Streptomycin", category: "reagent", supplier: "Thermo Fisher", catalog_number: "15140122", quantity: "1 × 100 mL", unit_cost_usd: 36, total_cost_usd: 36 },
      { name: "DMSO BioReagent", category: "reagent", supplier: "Sigma-Aldrich", catalog_number: "D2650", quantity: "1 × 100 mL", unit_cost_usd: 95, total_cost_usd: 95 },
      { name: "Trehalose dihydrate ≥99%", category: "reagent", supplier: "Sigma-Aldrich", catalog_number: "T9531", quantity: "1 × 25 g", unit_cost_usd: 142, total_cost_usd: 142 },
      { name: "Sucrose BioXtra", category: "reagent", supplier: "Sigma-Aldrich", catalog_number: "S7903", quantity: "1 × 500 g", unit_cost_usd: 64, total_cost_usd: 64 },
      { name: "Trypan Blue 0.4%", category: "reagent", supplier: "Thermo Fisher", catalog_number: "15250061", quantity: "1 × 100 mL", unit_cost_usd: 47, total_cost_usd: 47 },
      { name: "Cryogenic vials, 2 mL", category: "consumable", supplier: "Thermo Fisher Nunc", catalog_number: "375418", quantity: "1 case", unit_cost_usd: 215, total_cost_usd: 215 },
      { name: "Mr. Frosty Freezing Container", category: "equipment", supplier: "Thermo Fisher Nalgene", catalog_number: "5100-0001", quantity: "2 units", unit_cost_usd: 110, total_cost_usd: 220 },
      { name: "Pipette tips (filtered set)", category: "consumable", supplier: "Eppendorf", catalog_number: "0030073-401", quantity: "1 case", unit_cost_usd: 220, total_cost_usd: 220 },
      { name: "MycoAlert detection kit", category: "kit", supplier: "Lonza", catalog_number: "LT07-318", quantity: "1 kit (50 tests)", unit_cost_usd: 480, total_cost_usd: 480 },
    ],
    timeline: {
      total_weeks: 6,
      phases: [
        { name: "Setup & QC", duration: "1 week", start_week: 1, end_week: 1, deliverables: ["Mycoplasma-negative HeLa stock at P12"], depends_on: [] },
        { name: "Freezing media prep", duration: "0.5 weeks", start_week: 2, end_week: 2, deliverables: ["3 freezing media + osmolality QC"], depends_on: ["Setup & QC"] },
        { name: "Freezing run", duration: "0.5 weeks", start_week: 2, end_week: 2, deliverables: ["54 vials archived in LN₂"], depends_on: ["Freezing media prep"] },
        { name: "LN₂ hold", duration: "1 week", start_week: 3, end_week: 3, deliverables: ["Storage temp log"], depends_on: ["Freezing run"] },
        { name: "Thaw + viability + recovery", duration: "2 weeks", start_week: 4, end_week: 5, deliverables: ["Viability + 72h growth data"], depends_on: ["LN₂ hold"] },
        { name: "Analysis & report", duration: "1 week", start_week: 6, end_week: 6, deliverables: ["Final ANOVA, figures, written report"], depends_on: ["Thaw + viability + recovery"] },
      ],
    },
    personnel: [
      { role: "Lead scientist (Ph.D.)", fte: 0.5, weeks: 6, responsibilities: ["Protocol oversight", "Statistics", "Reporting"] },
      { role: "Research associate", fte: 1.0, weeks: 6, responsibilities: ["Cell culture", "Freezing/thawing", "Viability assays"] },
    ],
    budget: {
      total_usd: 9420,
      currency: "USD",
      lines: [
        { category: "Reagents & media", description: "DMEM, FBS, P/S, DMSO, trehalose, sucrose, Trypan blue", cost_usd: 1076 },
        { category: "Biologicals", description: "HeLa CCL-2 vial", cost_usd: 605 },
        { category: "Consumables", description: "Cryovials, pipette tips", cost_usd: 435 },
        { category: "Equipment (capitalized)", description: "Mr. Frosty containers", cost_usd: 220 },
        { category: "QC", description: "MycoAlert mycoplasma detection", cost_usd: 480 },
        { category: "Personnel", description: "0.5 FTE PhD + 1.0 FTE RA × 6 weeks (loaded)", cost_usd: 5800 },
        { category: "Contingency (10%)", description: "Reagent/run failure buffer", cost_usd: 804 },
      ],
      contingency_pct: 10,
    },
    validation: [
      { name: "Primary viability endpoint", measurement: "Trypan blue exclusion at 24h post-thaw", success_threshold: "≥15 pp improvement vs DMSO control", failure_mode: "Δ < 5 pp or non-significant ANOVA", statistical_test: "Two-way ANOVA + Tukey", sample_size: "n=3 vials × 3 technical reps × 3 arms" },
      { name: "Functional recovery", measurement: "Population doubling time over 72h", success_threshold: "Doubling time within 10% of fresh-cell baseline", failure_mode: ">25% slowdown" },
      { name: "Membrane integrity", measurement: "LDH release", success_threshold: "≤fresh-cell + 20%", failure_mode: ">2× baseline LDH" },
    ],
    risks: [
      { risk: "Mycoplasma contamination skews viability", likelihood: "low", impact: "high", mitigation: "Pre-freeze MycoAlert; quarantine new vials" },
      { risk: "Freezer temperature excursion", likelihood: "low", impact: "high", mitigation: "Continuous LN₂ level + temperature logger with alarm" },
      { risk: "Osmotic shock at thaw masks treatment effect", likelihood: "medium", impact: "medium", mitigation: "Standardized drop-wise dilution; blinded counting" },
    ],
    assumptions: [
      "HeLa is an acceptable surrogate; results may not generalize to primary cells.",
      "Linear-cooling Mr. Frosty approximates -1 °C/min.",
      "0.3 M trehalose is below cytotoxic threshold reported in Crowe et al. 1990.",
    ],
    why_this_plan: [
      "3-arm design isolates the trehalose effect from generic disaccharide osmolyte effect (sucrose control).",
      "Sample size powered to detect the pre-specified 15 pp threshold at α=0.05, β=0.2.",
      "Mycoplasma QC pre-registered to avoid the most common confounder in published cryopreservation studies.",
    ],
    citations: [],
  },
];

export const SEED_DEMO_HYPOTHESIS =
  "Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol, due to trehalose's superior membrane stabilization at low temperatures.";
