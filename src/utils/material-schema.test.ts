import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeConfidence,
  validateMaterialAnalysis,
  formatAnalysisAsText,
  generateSpecimenId,
} from './material-schema.ts';

test('normalizeConfidence returns qualitative labels only', () => {
  assert.equal(normalizeConfidence('high'), 'HIGH');
  assert.equal(normalizeConfidence('VERY HIGH'), 'HIGH');
  assert.equal(normalizeConfidence('low confidence'), 'LOW');
  assert.equal(normalizeConfidence('95%'), 'MODERATE');
  assert.equal(normalizeConfidence(undefined), 'MODERATE');
});

test('generateSpecimenId generates MAT-YYYY-XXXX format', () => {
  const id = generateSpecimenId();
  assert.match(id, /^MAT-\d{4}-\d{4}$/);
});

test('validateMaterialAnalysis handles empty raw input with robust defaults', () => {
  const result = validateMaterialAnalysis(null, 'MAT-2026-TEST');
  assert.equal(result.specimenId, 'MAT-2026-TEST');
  assert.equal(result.identification.materialName, 'Unidentified Material Specimen');
  assert.equal(result.identification.confidence, 'MODERATE');
  assert.ok(result.properties.manufacturingProcesses.length > 0);
  assert.ok(result.sustainability.recyclability.length > 0);
  assert.ok(result.redesign.repair.title.length > 0);
  assert.ok(result.redesign.reuse.title.length > 0);
  assert.ok(result.redesign.reimagine.title.length > 0);
});

test('validateMaterialAnalysis parses valid structured payload properly', () => {
  const payload = {
    specimenId: 'MAT-2026-1234',
    identification: {
      materialName: 'Cast Anodized Aluminum 6061-T6',
      secondaryMaterials: ['Silicone gasket', 'Stainless steel M4 bolt'],
      classification: 'Metal / Non-Ferrous Light Alloy',
      confidence: 'HIGH',
      visibleCharacteristics: 'Micro-bead blasted matte surface with clear anodized finish and visible CNC tool paths.',
    },
    properties: {
      durability: 'High resistance to atmospheric corrosion.',
      structuralBehavior: 'High strength-to-weight ratio with ductile yield.',
      rigidityOrFlexibility: 'Rigid structural casing.',
      surfaceTextureAndFinish: 'Velvety matte anodized tactile finish.',
      environmentalResistance: 'Excellent oxidation resistance.',
      manufacturingProcesses: ['High-pressure die casting', 'CNC machining', 'Type II Anodizing'],
      typicalApplications: ['Consumer electronics', 'Architectural hardware', 'Aerospace components'],
    },
    sustainability: {
      recyclability: 'Infinitely recyclable with 95% energy savings over virgin bauxite processing.',
      reusability: 'Highly reusable in modular sub-assemblies.',
      repairability: 'Parts can be unbolted, re-machined, or re-anodized.',
      longevity: '50+ years under typical indoor exposure.',
      environmentalConcerns: 'High initial smelting energy consumption.',
      endOfLifeAndSeparation: 'Easily separated via magnetic eddy-current sorting.',
    },
    redesign: {
      repair: {
        title: 'Surface Re-finishing & Anodize Seal',
        description: 'Remove scuffs with 800-grit scotchbrite and apply protective ceramic seal.',
        toolsOrMethods: ['Abrasive pad', 'Hex key'],
      },
      reuse: {
        title: 'Thermal Dissipation Plate',
        description: 'Repurpose the thick aluminum chassis as a passive heatsink for custom LED lighting.',
        suitability: 'High thermal conductivity makes it ideal for electronics thermal management.',
      },
      reimagine: {
        title: 'Dry-Join Architectural Tile',
        description: 'Melt down scrap offcuts into interlocking dry-joint acoustic facade tiles.',
        circularConcept: 'Mono-material closed loop reclamation.',
      },
    },
    designInsight: {
      industrialDesignContext: '6061 alloy provides the optimum balance between structural stiffness and surface cosmetic finish.',
      verificationGuidance: 'Touch feels distinctly cold to the palm due to rapid thermal dissipation; zero magnetic attraction to neodymium magnet.',
    },
  };

  const validated = validateMaterialAnalysis(payload);
  assert.equal(validated.identification.materialName, 'Cast Anodized Aluminum 6061-T6');
  assert.equal(validated.identification.confidence, 'HIGH');
  assert.equal(validated.identification.secondaryMaterials.length, 2);
  assert.equal(validated.properties.manufacturingProcesses[0], 'High-pressure die casting');

  const textReport = formatAnalysisAsText(validated);
  assert.ok(textReport.includes('MATTER. / AI MATERIAL INTELLIGENCE'));
  assert.ok(textReport.includes('CAST ANODIZED ALUMINUM 6061-T6'));
  assert.ok(textReport.includes('01 / IDENTIFICATION'));
  assert.ok(textReport.includes('05 / INDUSTRIAL DESIGN INSIGHT'));
});
