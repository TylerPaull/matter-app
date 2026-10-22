/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MaterialIdentification {
  materialName: string;
  secondaryMaterials: string[];
  classification: string;
  confidence: 'HIGH' | 'MODERATE' | 'LOW';
  visibleCharacteristics: string;
}

export interface MaterialProperties {
  durability: string;
  structuralBehavior: string;
  rigidityOrFlexibility: string;
  surfaceTextureAndFinish: string;
  environmentalResistance: string;
  manufacturingProcesses: string[];
  typicalApplications: string[];
}

export interface MaterialSustainability {
  recyclability: string;
  reusability: string;
  repairability: string;
  longevity: string;
  environmentalConcerns: string;
  endOfLifeAndSeparation: string;
}

export interface ReuseRedesignRecommendation {
  repair: {
    title: string;
    description: string;
    toolsOrMethods: string[];
  };
  reuse: {
    title: string;
    description: string;
    suitability: string;
  };
  reimagine: {
    title: string;
    description: string;
    circularConcept: string;
  };
}

export interface MaterialDesignInsight {
  industrialDesignContext: string;
  verificationGuidance: string;
}

export interface MaterialAnalysis {
  specimenId: string;
  timestamp: string;
  identification: MaterialIdentification;
  properties: MaterialProperties;
  sustainability: MaterialSustainability;
  redesign: ReuseRedesignRecommendation;
  designInsight: MaterialDesignInsight;
  imageUrl?: string;
}

/**
 * Normalizes confidence to strictly HIGH, MODERATE, or LOW (qualitative only)
 */
export function normalizeConfidence(val: unknown): 'HIGH' | 'MODERATE' | 'LOW' {
  if (typeof val !== 'string') return 'MODERATE';
  const upper = val.toUpperCase().trim();
  if (upper.includes('HIGH')) return 'HIGH';
  if (upper.includes('LOW')) return 'LOW';
  return 'MODERATE';
}

/**
 * Validates and deeply normalizes parsed LLM output to guarantee type safety and no missing fields
 */
export function validateMaterialAnalysis(raw: any, fallbackSpecimenId?: string): MaterialAnalysis {
  const data = typeof raw === 'object' && raw !== null ? raw : {};

  const idSection = data.identification || {};
  const propSection = data.properties || {};
  const sustSection = data.sustainability || {};
  const redesignSection = data.redesign || data.reuseRedesign || {};
  const insightSection = data.designInsight || data.insight || {};

  const safeArray = (arr: unknown): string[] => {
    if (Array.isArray(arr)) {
      return arr.map(item => String(item).trim()).filter(Boolean);
    }
    if (typeof arr === 'string' && arr.trim()) {
      return [arr.trim()];
    }
    return [];
  };

  const safeStr = (val: unknown, fallback: string): string => {
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
    return fallback;
  };

  const specimenId = safeStr(data.specimenId, fallbackSpecimenId || generateSpecimenId());
  const timestamp = safeStr(data.timestamp, new Date().toISOString());

  const identification: MaterialIdentification = {
    materialName: safeStr(idSection.materialName || data.materialName, 'Unidentified Material Specimen'),
    secondaryMaterials: safeArray(idSection.secondaryMaterials || data.secondaryMaterials),
    classification: safeStr(idSection.classification || data.classification, 'Composite / General Assembly'),
    confidence: normalizeConfidence(idSection.confidence || data.confidence),
    visibleCharacteristics: safeStr(
      idSection.visibleCharacteristics || data.visibleCharacteristics,
      'Visual evaluation based on visible grain, surface reflectance, texture, and structural geometry.'
    ),
  };

  const properties: MaterialProperties = {
    durability: safeStr(propSection.durability, 'Moderate structural durability under standard indoor conditions.'),
    structuralBehavior: safeStr(propSection.structuralBehavior, 'Resistant to compressive forces with standard shear threshold.'),
    rigidityOrFlexibility: safeStr(propSection.rigidityOrFlexibility, 'Predominantly rigid substrate with minimal flex under load.'),
    surfaceTextureAndFinish: safeStr(propSection.surfaceTextureAndFinish, 'Consistent surface texture observed on primary face.'),
    environmentalResistance: safeStr(propSection.environmentalResistance, 'Sensitive to prolonged moisture or direct UV exposure without protective coating.'),
    manufacturingProcesses: safeArray(propSection.manufacturingProcesses).length > 0
      ? safeArray(propSection.manufacturingProcesses)
      : ['Molding', 'Machining', 'Surface Finishing'],
    typicalApplications: safeArray(propSection.typicalApplications).length > 0
      ? safeArray(propSection.typicalApplications)
      : ['Product enclosures', 'Furniture', 'Architectural surfaces'],
  };

  const sustainability: MaterialSustainability = {
    recyclability: safeStr(
      sustSection.recyclability,
      'Recyclable depending on municipal sorting facilities or specialized industrial scrap handling.'
    ),
    reusability: safeStr(sustSection.reusability, 'High potential for secondary structural or decorative repurposing.'),
    repairability: safeStr(sustSection.repairability, 'Modular restoration possible using standard mechanical fastening or refinishing.'),
    longevity: safeStr(sustSection.longevity, 'Expected operational lifecycle: 10–25+ years if maintained.'),
    environmentalConcerns: safeStr(sustSection.environmentalConcerns, 'Energy-intensive upstream extraction; minimal off-gassing in service life.'),
    endOfLifeAndSeparation: safeStr(
      sustSection.endOfLifeAndSeparation,
      'Requires mechanical separation from sub-assemblies before standard recycling stream entry.'
    ),
  };

  const repairObj = redesignSection.repair || {};
  const reuseObj = redesignSection.reuse || {};
  const reimagineObj = redesignSection.reimagine || {};

  const redesign: ReuseRedesignRecommendation = {
    repair: {
      title: safeStr(repairObj.title, 'Surface Remediation & Joint Tightening'),
      description: safeStr(
        repairObj.description,
        'Inspect mechanical fasteners, buff surface abrasions, and apply protective sealant to preserve material integrity.'
      ),
      toolsOrMethods: safeArray(repairObj.toolsOrMethods).length > 0
        ? safeArray(repairObj.toolsOrMethods)
        : ['Fine abrasive pad', 'Fastener driver', 'Appropriate sealant'],
    },
    reuse: {
      title: safeStr(reuseObj.title, 'Secondary Component Repurposing'),
      description: safeStr(
        reuseObj.description,
        'Disassemble unblemished structural elements for use as custom shelving brackets, planar panels, or acoustic cladding.'
      ),
      suitability: safeStr(reuseObj.suitability, 'Ideal for low-load secondary assemblies or architectural detailing.'),
    },
    reimagine: {
      title: safeStr(reimagineObj.title, 'Modular Circular Redesign'),
      description: safeStr(
        reimagineObj.description,
        'Re-engineer component joinery to replace permanent adhesives with reversible dry-joints for closed-loop lifecycle.'
      ),
      circularConcept: safeStr(
        reimagineObj.circularConcept,
        'Design for disassembly (DfD) enabling 100% reclamation of pure mono-material feedstock.'
      ),
    },
  };

  const designInsight: MaterialDesignInsight = {
    industrialDesignContext: safeStr(
      insightSection.industrialDesignContext || data.designInsight,
      'In industrial design, material selection balances structural stiffness-to-weight ratio against manufacturing cycle time and tooling investment.'
    ),
    verificationGuidance: safeStr(
      insightSection.verificationGuidance,
      'Conduct non-destructive verification: check thermal conductivity (cool to touch indicates metal/stone), tap acoustic resonance (dull thud indicates polymer/wood), and test magnetic attraction.'
    ),
  };

  return {
    specimenId,
    timestamp,
    identification,
    properties,
    sustainability,
    redesign,
    designInsight,
    imageUrl: data.imageUrl,
  };
}

/**
 * Generates formatted plain text technical material specification sheet
 */
export function formatAnalysisAsText(analysis: MaterialAnalysis): string {
  const { identification, properties, sustainability, redesign, designInsight, specimenId, timestamp } = analysis;

  const dateStr = new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `===========================================================
MATTER. / AI MATERIAL INTELLIGENCE SPECIFICATION SHEET
SPECIMEN ID: ${specimenId}
DATE: ${dateStr}
===========================================================

01 / IDENTIFICATION
-----------------------------------------------------------
PRIMARY MATERIAL:    ${identification.materialName.toUpperCase()}
CLASSIFICATION:      ${identification.classification.toUpperCase()}
CONFIDENCE:          ${identification.confidence}
SECONDARY MATERIALS: ${identification.secondaryMaterials.length > 0 ? identification.secondaryMaterials.join(', ') : 'None detected'}

VISIBLE CHARACTERISTICS:
${identification.visibleCharacteristics}

02 / MATERIAL PROPERTIES
-----------------------------------------------------------
DURABILITY:               ${properties.durability}
STRUCTURAL BEHAVIOR:      ${properties.structuralBehavior}
RIGIDITY / FLEXIBILITY:   ${properties.rigidityOrFlexibility}
SURFACE TEXTURE & FINISH: ${properties.surfaceTextureAndFinish}
ENVIRONMENTAL RESISTANCE: ${properties.environmentalResistance}
MANUFACTURING PROCESSES:  ${properties.manufacturingProcesses.join(', ')}
TYPICAL APPLICATIONS:     ${properties.typicalApplications.join(', ')}

03 / CIRCULARITY & SUSTAINABILITY
-----------------------------------------------------------
RECYCLABILITY:            ${sustainability.recyclability}
REUSABILITY:              ${sustainability.reusability}
REPAIRABILITY:            ${sustainability.repairability}
LONGEVITY:                ${sustainability.longevity}
ENVIRONMENTAL CONCERNS:   ${sustainability.environmentalConcerns}
END-OF-LIFE SEPARATION:   ${sustainability.endOfLifeAndSeparation}

04 / REUSE + REDESIGN RECOMMENDATIONS
-----------------------------------------------------------
[REPAIR] ${redesign.repair.title}
- Details: ${redesign.repair.description}
- Methods: ${redesign.repair.toolsOrMethods.join(', ')}

[REUSE] ${redesign.reuse.title}
- Details: ${redesign.reuse.description}
- Suitability: ${redesign.reuse.suitability}

[REIMAGINE] ${redesign.reimagine.title}
- Concept: ${redesign.reimagine.description}
- Circular Insight: ${redesign.reimagine.circularConcept}

05 / INDUSTRIAL DESIGN INSIGHT
-----------------------------------------------------------
DESIGN CONTEXT:
${designInsight.industrialDesignContext}

VERIFICATION GUIDANCE:
${designInsight.verificationGuidance}

===========================================================
GENERATED BY MATTER. — Understand what things are made of.
===========================================================`;
}

/**
 * Generates unique Specimen ID
 */
export function generateSpecimenId(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `MAT-${year}-${rand}`;
}
