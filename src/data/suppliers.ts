// ===========================================================
// Suppliers dataset — a curated snapshot of common life-science
// & materials suppliers used to ground catalog references.
// Sources: thermofisher.com, sigmaaldrich.com, neb.com, etc.
// (Public catalog data, normalized for grounding.)
// ===========================================================

export interface SupplierEntry {
  name: string;
  category:
    | "reagent"
    | "consumable"
    | "equipment"
    | "biological"
    | "kit"
    | "service"
    | "other";
  supplier: string;
  catalog_number: string;
  url: string;
  unit: string;
  unit_cost_usd: number;
  keywords: string[];
}

export const SUPPLIER_CATALOG: SupplierEntry[] = [
  // ---------- Cell biology / cryopreservation ----------
  {
    name: "DMSO, sterile-filtered, BioReagent",
    category: "reagent",
    supplier: "Sigma-Aldrich",
    catalog_number: "D2650",
    url: "https://www.sigmaaldrich.com/US/en/product/sigma/d2650",
    unit: "100 mL",
    unit_cost_usd: 95,
    keywords: ["dmso", "cryoprotectant", "freezing", "cell"],
  },
  {
    name: "D-(+)-Trehalose dihydrate, ≥99%",
    category: "reagent",
    supplier: "Sigma-Aldrich",
    catalog_number: "T9531",
    url: "https://www.sigmaaldrich.com/US/en/product/sigma/t9531",
    unit: "25 g",
    unit_cost_usd: 142,
    keywords: ["trehalose", "cryoprotectant", "membrane"],
  },
  {
    name: "Sucrose, BioXtra ≥99.5%",
    category: "reagent",
    supplier: "Sigma-Aldrich",
    catalog_number: "S7903",
    url: "https://www.sigmaaldrich.com/US/en/product/sigma/s7903",
    unit: "500 g",
    unit_cost_usd: 64,
    keywords: ["sucrose", "cryoprotectant"],
  },
  {
    name: "DMEM, high glucose, GlutaMAX",
    category: "reagent",
    supplier: "Thermo Fisher",
    catalog_number: "10566016",
    url: "https://www.thermofisher.com/order/catalog/product/10566016",
    unit: "500 mL",
    unit_cost_usd: 38,
    keywords: ["dmem", "media", "hela", "cell culture"],
  },
  {
    name: "Fetal Bovine Serum, qualified",
    category: "reagent",
    supplier: "Thermo Fisher",
    catalog_number: "26140079",
    url: "https://www.thermofisher.com/order/catalog/product/26140079",
    unit: "500 mL",
    unit_cost_usd: 540,
    keywords: ["fbs", "serum", "media supplement"],
  },
  {
    name: "Penicillin-Streptomycin (10,000 U/mL)",
    category: "reagent",
    supplier: "Thermo Fisher",
    catalog_number: "15140122",
    url: "https://www.thermofisher.com/order/catalog/product/15140122",
    unit: "100 mL",
    unit_cost_usd: 36,
    keywords: ["pen-strep", "antibiotic", "media supplement"],
  },
  {
    name: "Trypan Blue Stain (0.4%)",
    category: "reagent",
    supplier: "Thermo Fisher",
    catalog_number: "15250061",
    url: "https://www.thermofisher.com/order/catalog/product/15250061",
    unit: "100 mL",
    unit_cost_usd: 47,
    keywords: ["trypan blue", "viability"],
  },
  {
    name: "HeLa cell line",
    category: "biological",
    supplier: "ATCC",
    catalog_number: "CCL-2",
    url: "https://www.atcc.org/products/ccl-2",
    unit: "vial",
    unit_cost_usd: 605,
    keywords: ["hela", "cell line"],
  },
  {
    name: "Cryogenic vials, 2 mL, externally threaded",
    category: "consumable",
    supplier: "Thermo Fisher (Nunc)",
    catalog_number: "375418",
    url: "https://www.thermofisher.com/order/catalog/product/375418",
    unit: "case 450",
    unit_cost_usd: 215,
    keywords: ["cryovial", "freezing"],
  },
  {
    name: "Mr. Frosty Freezing Container",
    category: "equipment",
    supplier: "Thermo Fisher (Nalgene)",
    catalog_number: "5100-0001",
    url: "https://www.thermofisher.com/order/catalog/product/5100-0001",
    unit: "1 unit",
    unit_cost_usd: 110,
    keywords: ["freezing", "cryopreservation", "controlled rate"],
  },

  // ---------- Diagnostics / electrochemistry ----------
  {
    name: "Anti-CRP monoclonal antibody (clone C5)",
    category: "biological",
    supplier: "Abcam",
    catalog_number: "ab8279",
    url: "https://www.abcam.com/ab8279",
    unit: "100 µg",
    unit_cost_usd: 415,
    keywords: ["anti-crp", "antibody", "biosensor"],
  },
  {
    name: "Recombinant human C-reactive protein",
    category: "biological",
    supplier: "Sigma-Aldrich",
    catalog_number: "C4063",
    url: "https://www.sigmaaldrich.com/US/en/product/sigma/c4063",
    unit: "1 mg",
    unit_cost_usd: 320,
    keywords: ["crp", "antigen", "calibrator"],
  },
  {
    name: "Whatman Grade 1 chromatography paper",
    category: "consumable",
    supplier: "Cytiva (Whatman)",
    catalog_number: "3001-861",
    url: "https://www.cytivalifesciences.com/en/us/shop/whatman-laboratory-filtration",
    unit: "100 sheets",
    unit_cost_usd: 88,
    keywords: ["paper", "lateral flow", "biosensor"],
  },
  {
    name: "Screen-printed carbon electrodes (DRP-110)",
    category: "consumable",
    supplier: "Metrohm DropSens",
    catalog_number: "DRP-110",
    url: "https://www.dropsens.com/en/screen_printed_electrodes_pag.html",
    unit: "pack of 50",
    unit_cost_usd: 285,
    keywords: ["spe", "electrode", "electrochemical biosensor"],
  },
  {
    name: "EDC / NHS coupling kit",
    category: "kit",
    supplier: "Thermo Fisher",
    catalog_number: "22980",
    url: "https://www.thermofisher.com/order/catalog/product/22980",
    unit: "kit",
    unit_cost_usd: 198,
    keywords: ["edc", "nhs", "antibody coupling"],
  },
  {
    name: "Potentiostat — Autolab PGSTAT204",
    category: "equipment",
    supplier: "Metrohm",
    catalog_number: "PGSTAT204",
    url: "https://www.metrohm.com/en/products/electrochemistry/autolab",
    unit: "1 unit",
    unit_cost_usd: 18500,
    keywords: ["potentiostat", "electrochemistry"],
  },

  // ---------- Mouse / probiotic ----------
  {
    name: "C57BL/6J mice, 8 weeks, female",
    category: "biological",
    supplier: "The Jackson Laboratory",
    catalog_number: "000664",
    url: "https://www.jax.org/strain/000664",
    unit: "per mouse",
    unit_cost_usd: 45,
    keywords: ["c57bl/6", "mouse"],
  },
  {
    name: "Lactobacillus rhamnosus GG (ATCC 53103)",
    category: "biological",
    supplier: "ATCC",
    catalog_number: "53103",
    url: "https://www.atcc.org/products/53103",
    unit: "vial",
    unit_cost_usd: 525,
    keywords: ["probiotic", "lgg", "lactobacillus"],
  },
  {
    name: "FITC-Dextran, 4 kDa",
    category: "reagent",
    supplier: "Sigma-Aldrich",
    catalog_number: "FD4",
    url: "https://www.sigmaaldrich.com/US/en/product/sigma/fd4",
    unit: "100 mg",
    unit_cost_usd: 165,
    keywords: ["fitc-dextran", "intestinal permeability"],
  },
  {
    name: "Anti-Claudin-1 antibody",
    category: "biological",
    supplier: "Thermo Fisher",
    catalog_number: "37-4900",
    url: "https://www.thermofisher.com/antibody/product/Claudin-1-Antibody-Polyclonal/37-4900",
    unit: "100 µg",
    unit_cost_usd: 365,
    keywords: ["claudin-1", "tight junction"],
  },
  {
    name: "Anti-Occludin antibody",
    category: "biological",
    supplier: "Thermo Fisher",
    catalog_number: "33-1500",
    url: "https://www.thermofisher.com/antibody/product/Occludin-Antibody-Polyclonal/33-1500",
    unit: "100 µg",
    unit_cost_usd: 380,
    keywords: ["occludin", "tight junction"],
  },

  // ---------- Climate / bioelectrochemical ----------
  {
    name: "Sporomusa ovata DSM 2662",
    category: "biological",
    supplier: "DSMZ",
    catalog_number: "DSM 2662",
    url: "https://www.dsmz.de/collection/catalogue/details/culture/DSM-2662",
    unit: "vial",
    unit_cost_usd: 95,
    keywords: ["sporomusa", "co2", "electroautotroph"],
  },
  {
    name: "Carbon felt electrode, 3 mm",
    category: "consumable",
    supplier: "Alfa Aesar",
    catalog_number: "43200",
    url: "https://www.thermofisher.com/order/catalog/product/043200",
    unit: "1 sheet 30x30 cm",
    unit_cost_usd: 165,
    keywords: ["carbon felt", "cathode", "bes"],
  },
  {
    name: "Ag/AgCl reference electrode",
    category: "equipment",
    supplier: "BASi",
    catalog_number: "MF-2052",
    url: "https://www.basinc.com/products/ec/refelectrodes",
    unit: "1 unit",
    unit_cost_usd: 240,
    keywords: ["reference electrode", "ag/agcl"],
  },

  // ---------- Generic ----------
  {
    name: "PBS, pH 7.4, 1×, sterile",
    category: "reagent",
    supplier: "Thermo Fisher",
    catalog_number: "10010023",
    url: "https://www.thermofisher.com/order/catalog/product/10010023",
    unit: "500 mL",
    unit_cost_usd: 28,
    keywords: ["pbs", "buffer"],
  },
  {
    name: "Pipette tips, sterile, filtered (10/200/1000 µL set)",
    category: "consumable",
    supplier: "Eppendorf",
    catalog_number: "0030073-401",
    url: "https://www.eppendorf.com/product/pipette-tips/",
    unit: "case",
    unit_cost_usd: 220,
    keywords: ["pipette tips"],
  },
];

export function searchSuppliers(keywords: string[]): SupplierEntry[] {
  const set = keywords.map((k) => k.toLowerCase());
  return SUPPLIER_CATALOG.filter((e) =>
    e.keywords.some((kw) => set.some((q) => kw.includes(q) || q.includes(kw)))
  );
}
