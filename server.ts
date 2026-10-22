/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { validateMaterialAnalysis, generateSpecimenId } from './src/utils/material-schema.ts';
import { SAMPLE_MATERIALS } from './src/data/sample-materials.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '40mb' }));

// Set up persistent data and scans directories
const dataDir = path.resolve(__dirname, 'data');
const scansDir = path.resolve(__dirname, 'public', 'scans');
const archiveFile = path.resolve(dataDir, 'archive.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(scansDir)) {
  fs.mkdirSync(scansDir, { recursive: true });
}

// Helper to read persistent archive
function readArchive(): any[] {
  try {
    if (fs.existsSync(archiveFile)) {
      const content = fs.readFileSync(archiveFile, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Read archive error:', err);
  }
  // Initialize with curated reference specimens
  const initial = SAMPLE_MATERIALS.map((sample) => sample.analysis);
  writeArchive(initial);
  return initial;
}

// Helper to write persistent archive
function writeArchive(items: any[]): void {
  try {
    fs.writeFileSync(archiveFile, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Write archive error:', err);
  }
}

// Helper to convert base64 image data to local disk file in /public/scans
function persistImageToDisk(base64DataOrUrl: string, specimenId: string): string {
  if (!base64DataOrUrl || !base64DataOrUrl.startsWith('data:image/')) {
    return base64DataOrUrl;
  }

  try {
    const mimeMatch = base64DataOrUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,/);
    const subType = mimeMatch ? mimeMatch[1].toLowerCase() : 'jpg';
    const ext = subType.includes('png') ? 'png' : 'jpg';
    const cleanBase64 = base64DataOrUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const fileName = `${specimenId}.${ext}`;
    const filePath = path.resolve(scansDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));

    return `/scans/${fileName}`;
  } catch (err) {
    console.warn('Persist image error:', err);
    return base64DataOrUrl;
  }
}

// Initialize archive if empty
readArchive();

// Initialize GoogleGenAI SDK with server-side API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// GET /api/archive - Retrieve all persisted scans & specimens
app.get('/api/archive', (req, res) => {
  try {
    const archive = readArchive();
    res.json({ success: true, archive });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to read archive' });
  }
});

// POST /api/archive - Save or sync a specimen to persistent archive
app.post('/api/archive', (req, res) => {
  try {
    const { specimen } = req.body;
    if (!specimen || !specimen.specimenId) {
      return res.status(400).json({ error: 'Missing specimen data' });
    }

    // Persist image to disk if base64 to avoid localStorage/memory limits
    if (specimen.imageUrl && specimen.imageUrl.startsWith('data:image/')) {
      specimen.imageUrl = persistImageToDisk(specimen.imageUrl, specimen.specimenId);
    }

    const current = readArchive();
    const updated = [specimen, ...current.filter((item) => item.specimenId !== specimen.specimenId)];
    writeArchive(updated);

    res.json({ success: true, specimen });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save specimen' });
  }
});

// DELETE /api/archive/:id - Delete a single specimen
app.delete('/api/archive/:id', (req, res) => {
  try {
    const { id } = req.params;
    const current = readArchive();
    const updated = current.filter((item) => item.specimenId !== id);
    writeArchive(updated);

    // Clean up file if present
    ['jpg', 'png'].forEach((ext) => {
      const p = path.resolve(scansDir, `${id}.${ext}`);
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch (_) {}
      }
    });

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete specimen' });
  }
});

// POST /api/archive/clear - Reset archive to standard reference set
app.post('/api/archive/clear', (req, res) => {
  try {
    const initial = SAMPLE_MATERIALS.map((sample) => sample.analysis);
    writeArchive(initial);
    res.json({ success: true, archive: initial });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to clear archive' });
  }
});

// POST /api/analyze - Execute multimodal material analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        error: 'Missing imageBase64 data in request body.',
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please set it in Settings > Secrets.',
      });
    }

    // Clean base64 string if it contains data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const promptText = `You are MATTER, an elite material intelligence engine, industrial design engineer, and circular economy specialist.

Analyze this actual photograph of an object, surface, product, or furniture item.

Identify its primary material and any secondary components. Provide deep, technically grounded, and accessible insights formatted strictly according to the requested JSON schema.

RULES & ACCURACY REQUIREMENTS:
1. Ground your identification strictly in visible characteristics (grain structure, specular highlights, reflections, parting lines, seam details, texture, fastener types, wear patterns).
2. Never claim absolute certainty or microscopic alloy composition from appearance alone; state honest qualitative confidence (HIGH, MODERATE, or LOW).
3. Do not invent municipal recycling claims; distinguish materials that are widely recycled curbside from those requiring specialized industrial recycling.
4. Provide 3 specific, actionable reuse/redesign recommendations: REPAIR (restoration steps), REUSE (practical repurposing), and REIMAGINE (innovative circular redesign).
5. Provide an industrial design insight explaining the engineering or aesthetic rationale behind using this material for this type of object, plus a non-destructive verification test (e.g. thermal touch, acoustic resonance tap, magnetic test).`;

    const modelConfig = {
      systemInstruction:
        'You are MATTER, a world-class material scientist, industrial design researcher, and circular economy architect. Return strictly validated JSON adhering to the specified schema.',
      responseMimeType: 'application/json',
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          identification: {
            type: Type.OBJECT,
            properties: {
              materialName: { type: Type.STRING, description: 'Primary material name, e.g. Cast Anodized Aluminum 6061' },
              secondaryMaterials: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Secondary materials, coatings, or fasteners',
              },
              classification: { type: Type.STRING, description: 'Broad class: Wood, Metal, Polymer, Ceramic, Textile, Composite' },
              confidence: { type: Type.STRING, description: 'Strictly "HIGH", "MODERATE", or "LOW"' },
              visibleCharacteristics: {
                type: Type.STRING,
                description: 'Explanation of visible surface grain, reflection, seams, or texture supporting identification',
              },
            },
            required: ['materialName', 'secondaryMaterials', 'classification', 'confidence', 'visibleCharacteristics'],
          },
          properties: {
            type: Type.OBJECT,
            properties: {
              durability: { type: Type.STRING, description: 'Wear resistance, structural resilience' },
              structuralBehavior: { type: Type.STRING, description: 'Load-bearing, tensile/compressive behavior' },
              rigidityOrFlexibility: { type: Type.STRING, description: 'Flexibility vs stiffness profile' },
              surfaceTextureAndFinish: { type: Type.STRING, description: 'Tactile and cosmetic surface finish' },
              environmentalResistance: { type: Type.STRING, description: 'Water, UV, temperature resistance' },
              manufacturingProcesses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Common manufacturing methods (e.g. Die Casting, Extrusion, CNC)',
              },
              typicalApplications: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Industrial and architectural applications',
              },
            },
            required: [
              'durability',
              'structuralBehavior',
              'rigidityOrFlexibility',
              'surfaceTextureAndFinish',
              'environmentalResistance',
              'manufacturingProcesses',
              'typicalApplications',
            ],
          },
          sustainability: {
            type: Type.OBJECT,
            properties: {
              recyclability: { type: Type.STRING, description: 'Municipal vs specialized recycling facility' },
              reusability: { type: Type.STRING, description: 'Potential for secondary reuse without reprocessing' },
              repairability: { type: Type.STRING, description: 'Feasibility of repair, refinishing, or patching' },
              longevity: { type: Type.STRING, description: 'Expected operational lifespan' },
              environmentalConcerns: { type: Type.STRING, description: 'Embodied energy, toxicity, or extraction footprint' },
              endOfLifeAndSeparation: { type: Type.STRING, description: 'Ease of separating from fasteners or composites' },
            },
            required: [
              'recyclability',
              'reusability',
              'repairability',
              'longevity',
              'environmentalConcerns',
              'endOfLifeAndSeparation',
            ],
          },
          redesign: {
            type: Type.OBJECT,
            properties: {
              repair: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  toolsOrMethods: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['title', 'description', 'toolsOrMethods'],
              },
              reuse: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  suitability: { type: Type.STRING },
                },
                required: ['title', 'description', 'suitability'],
              },
              reimagine: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  circularConcept: { type: Type.STRING },
                },
                required: ['title', 'description', 'circularConcept'],
              },
            },
            required: ['repair', 'reuse', 'reimagine'],
          },
          designInsight: {
            type: Type.OBJECT,
            properties: {
              industrialDesignContext: {
                type: Type.STRING,
                description: 'Why designers/engineers select this material and manufacturing method',
              },
              verificationGuidance: {
                type: Type.STRING,
                description: 'Simple non-destructive physical tests to verify material type',
              },
            },
            required: ['industrialDesignContext', 'verificationGuidance'],
          },
        },
        required: ['identification', 'properties', 'sustainability', 'redesign', 'designInsight'],
      },
    };

    const contents = [
      {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: promptText,
          },
        ],
      },
    ];

    // Primary model: gemini-3.8-flash (with low thinkingLevel for speed), fallback: gemini-3.1-flash-lite
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let rawText = '';
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: modelConfig,
        });

        if (response && response.text && response.text.trim().length > 0) {
          rawText = response.text.trim();
          break; // successfully got response
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!rawText) {
      const errMsg = lastError?.message || '';
      if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Analysis quota is temporarily reached on this model. Please retry in a few moments or explore the reference specimens in the archive.');
      }
      if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
        throw new Error('Gemini vision models are temporarily experiencing high demand. Please tap "Retry Analysis" in a few moments.');
      }
      throw lastError || new Error('Empty response received from Gemini vision model.');
    }

    // Strip markdown code fences if present (e.g. ```json ... ```)
    const sanitizedJson = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsedData = JSON.parse(sanitizedJson);
    const specimenId = generateSpecimenId();
    const validatedAnalysis = validateMaterialAnalysis(parsedData, specimenId);

    // Save image permanently to /public/scans disk file
    try {
      const ext = mimeType.includes('png') ? 'png' : 'jpg';
      const fileName = `${specimenId}.${ext}`;
      const filePath = path.resolve(scansDir, fileName);
      fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));
      validatedAnalysis.imageUrl = `/scans/${fileName}`;
    } catch (saveImgErr) {
      console.warn('Failed to save scan image to disk:', saveImgErr);
      validatedAnalysis.imageUrl = imageBase64;
    }

    // Automatically persist to server archive so it never disappears on refresh
    try {
      const current = readArchive();
      const updated = [validatedAnalysis, ...current.filter((item) => item.specimenId !== specimenId)];
      writeArchive(updated);
    } catch (e) {
      console.warn('Failed to update server archive:', e);
    }

    res.json({
      success: true,
      analysis: validatedAnalysis,
    });
  } catch (error: any) {
    let friendlyMessage = error?.message || 'Failed to analyze material photograph. Please try another angle or lighting.';
    try {
      const parsedErr = JSON.parse(friendlyMessage);
      if (parsedErr?.error?.message) {
        friendlyMessage = parsedErr.error.message;
        if (parsedErr.error.code === 429 || friendlyMessage.includes('quota')) {
          friendlyMessage = 'Daily free-tier analysis limit reached. Please explore the specimen archive or retry in a little while.';
        } else if (parsedErr.error.code === 503 || friendlyMessage.includes('high demand')) {
          friendlyMessage = 'Gemini vision models are currently experiencing high demand. Please tap "Retry Analysis".';
        }
      }
    } catch (_) {
      // Keep friendlyMessage
    }

    res.status(500).json({
      error: friendlyMessage,
    });
  }
});

// Setup Vite middleware in development or static serve in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true' ? true : false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`MATTER server running at http://0.0.0.0:${port}`);
  });
}

startServer();
