export const SUPPLIER_DATABASE = {
  reagents: [
    { name: "Thermo Fisher Scientific", url: "thermofisher.com", specialties: ["molecular biology", "cell culture", "antibodies", "PCR"] },
    { name: "Sigma-Aldrich (Merck)", url: "sigmaaldrich.com", specialties: ["chemicals", "reagents", "solvents", "buffers"] },
    { name: "Promega", url: "promega.com", specialties: ["molecular biology", "cell-based assays", "protein analysis"] },
    { name: "Qiagen", url: "qiagen.com", specialties: ["nucleic acid purification", "PCR", "NGS"] },
    { name: "Bio-Rad", url: "bio-rad.com", specialties: ["electrophoresis", "western blot", "qPCR"] },
    { name: "New England Biolabs", url: "neb.com", specialties: ["restriction enzymes", "cloning", "epigenetics"] },
    { name: "Abcam", url: "abcam.com", specialties: ["antibodies", "proteins", "assay kits"] },
    { name: "IDT (Integrated DNA Technologies)", url: "idtdna.com", specialties: ["primers", "oligos", "gene synthesis"] },
    { name: "ATCC", url: "atcc.org", specialties: ["cell lines", "microorganisms", "biological materials"] },
    { name: "Addgene", url: "addgene.org", specialties: ["plasmids", "viral vectors", "CRISPR tools"] },
    { name: "Corning", url: "corning.com", specialties: ["labware", "cell culture vessels", "filtration"] },
    { name: "Eppendorf", url: "eppendorf.com", specialties: ["pipettes", "centrifuges", "consumables"] },
    { name: "Fisher Scientific", url: "fishersci.com", specialties: ["lab chemicals", "equipment", "safety"] },
    { name: "VWR", url: "vwr.com", specialties: ["lab supplies", "chemicals", "equipment"] },
    { name: "Takara Bio", url: "takarabio.com", specialties: ["cloning", "gene expression", "stem cell research"] },
  ],
  equipment: [
    { name: "Agilent Technologies", url: "agilent.com", specialties: ["chromatography", "mass spectrometry", "genomics"] },
    { name: "Beckman Coulter", url: "beckmancoulter.com", specialties: ["centrifuges", "flow cytometry", "particle characterization"] },
    { name: "PerkinElmer", url: "perkinelmer.com", specialties: ["imaging", "detection", "informatics"] },
    { name: "Bruker", url: "bruker.com", specialties: ["NMR", "mass spectrometry", "microscopy"] },
    { name: "Zeiss", url: "zeiss.com", specialties: ["microscopy", "imaging", "optical systems"] },
  ]
};

export const PROTOCOL_REPOSITORIES = [
  { name: "protocols.io", url: "https://www.protocols.io", description: "Largest active protocol repository with structured format" },
  { name: "Bio-protocol", url: "https://bio-protocol.org", description: "Peer-reviewed protocols linked to published papers" },
  { name: "Nature Protocols", url: "https://www.nature.com/nprot", description: "Premium detailed protocols from Nature" },
  { name: "JoVE", url: "https://www.jove.com", description: "Video protocols with written transcripts" },
  { name: "OpenWetWare", url: "https://openwetware.org", description: "Community-contributed lab protocols" },
  { name: "JOVE Science Education", url: "https://www.jove.com/science-education-library", description: "Instructional scientific protocols" },
];

export const SAMPLE_HYPOTHESES = [
  {
    id: "diagnostics",
    domain: "Diagnostics",
    hypothesis: "A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.",
    plain_english: "Can we build a cheap, fast blood test for inflammation that works without lab equipment?"
  },
  {
    id: "gut-health",
    domain: "Gut Health",
    hypothesis: "Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and occludin.",
    plain_english: "Does a specific probiotic measurably strengthen the gut lining in mice?"
  },
  {
    id: "cell-biology",
    domain: "Cell Biology",
    hypothesis: "Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol, due to trehalose's superior membrane stabilization at low temperatures.",
    plain_english: "Can we keep more cells alive when freezing them by swapping one preservative for another?"
  },
  {
    id: "climate",
    domain: "Climate / Biotech",
    hypothesis: "Introducing Sporomusa ovata into a bioelectrochemical system at a cathode potential of −400mV vs SHE will fix CO₂ into acetate at a rate of at least 150 mmol/L/day, outperforming current biocatalytic carbon capture benchmarks by at least 20%.",
    plain_english: "Can a specific microbe convert CO₂ into a useful chemical more efficiently than current methods?"
  },
  {
    id: "neuroscience",
    domain: "Neuroscience",
    hypothesis: "Optogenetic activation of parvalbumin-positive interneurons in the prefrontal cortex at 40Hz gamma frequency for 1 hour daily over 2 weeks will reduce amyloid-beta plaque burden by at least 25% in 5xFAD transgenic mice compared to unstimulated controls.",
    plain_english: "Can targeted brain stimulation at a specific frequency reduce Alzheimer's-related brain plaques in mice?"
  }
];
