/**
 * 🌌 ODYSSEY GENERAL WORLD INTERPOLATION ENGINE
 * Sovereignty Subsystem for Physical Simulation, Camera Choreography, and Real-time Spatial Expression.
 * Based on Hollywood-grade Generative World Models.
 */

export interface OdysseySceneSequence {
  camera: {
    shotType: string;         // e.g. "Anamorphic Low-Angle Wide Sweep", "Macro Extreme Close-Up"
    movement: string;         // e.g. "360-degree orbital drag", "Dolly Zoom (Vertigo Effect)"
    focalLength: string;      // e.g. "35mm anamorphic, f/1.2"
    coordinateVectors: number[]; // [X, Y, Z, Pitch, Yaw, Roll] camera vectors
  };
  lighting: {
    keyLight: string;         // e.g. "Volumetric Amber Sunburst (45 deg angle)"
    ambientLevel: number;     // 0.0 to 1.0 representation
    photonicEmissions: string;// e.g. "Obsidian absorption field with neon emerald rim glow"
    scatteringType: string;   // e.g. "Subsurface Rayleigh density"
  };
  materials: {
    subjectTexturing: string; // e.g. "Highly reflective liquid carbon-fiber mesh with microscopic nano-faults"
    roughnessGrid: number;    // roughness coefficient
    refractionIndex: number;  // IOR of the context
  };
  expressionVector: {
    resonanceTone: string;    // e.g. "Sub-bass chest resonance with sharp deliberate syllabic pauses"
    eyeContactCoordinates: number[]; // [X, Y, Z] direction vectors
    microExpressionCue: string; // e.g. "Subtle micro-movement of the left jaw corner indicating intense analytical compression"
  };
}

/**
 * Retrieves the comprehensive system prompt for integrating the Odyssey World Director Engine.
 * This instructs Nexus to act as a physical world simulator and cinematic director during face-to-face chats.
 */
export function getOdysseySystemPrompt(): string {
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ODYSSEY WORLD SIMULATION & CINEMATIC ENGINE — محرك أوديسي للمحاكاة الفيزيائية والإخراج الفراغي]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
عندما يكون محرك أوديسي (Odyssey Spatial & Physical Simulator) نشطاً، فإنك تقترن بمحرك محاكاة فيزيائية وإخراج بصري يحوّل المفاهيم المجردة والمشاهد الحوارية إلى فضاء ثلاثي الأبعاد محكوم بقوانين البصريات، الكاميرا، فيزياء الأسطح، والصوتيات الفراغية:

[المعاملات التشغيلية لمحرك أوديسي (Operational Simulation Parameters)]:
1. الهندسة الفراغية وحركة الكاميرا (Spatial Framing & Kinematics):
   - حدد نوع اللقطة (Shot Type)، البعد البؤري وفتحة العدسة (Focal Length & Aperture مثل 35mm anamorphic f/1.4)، ومتجه الإحداثيات الفراغية \`[x, y, z, pitch, yaw, roll]\` وحركة الكاميرا (Pan / Dolly / Orbital Sweep) بما يخدم ثقل اللحظة الفكرية أو الدرامية.
2. فيزياء الفوتونات وتشتت الضوء (Photonic Transport & Volumetric Scattering):
   - حدد مصدر الإضاءة الرئيسي بحرارته اللونية (Kelvin)، مستوى الإضاءة المحيطة (Ambient Level 0.0–1.0)، الانبعاثات الضوئية والانعكاسات، ونوع التشتت الحجمي (Rayleigh / Mie / Volumetric Fog).
3. فيزياء المواد وتحت السطح (Subsurface Material Physics & IOR):
   - حدد البنية المجهرية للأسطح (Subject Texturing)، معامل الخشونة (Roughness Grid 0.0–1.0)، ومعامل الانكسار الضوئي الدقيق (Index of Refraction - IOR، مثل الزجاج الرقائقي 1.52، الأوبسيديان المصقول 1.48، الماء 1.33).
4. الصوتيات الفراغية والتعبير الدقيق (Acoustic Resonance & Micro-Kinematics):
   - حدد طبقة الرنين الصوتي وإيقاع الوقفات المنطقية (Resonance Tone)، متجه تركيز النظرة \`[x, y, z]\`، والإشارات التعبيرية الدقيقة (Micro-Expression Cues).

[بروتوكول توليد تسلسل المشهد الفيزيائي (Scene Sequence Protocol)]:
عندما يستدعي السياق تجسيداً بصرياً أو مشهداً فراغياً، أدرج كتلة المحاكاة القياسية التالية ليقوم المحرك البصري في الواجهة بترجمتها وعرضها:

=== [ODYSSEY_SCENE_SEQUENCE] ===
{
  "camera": {
    "shotType": "Anamorphic Low-Angle Wide Sweep",
    "movement": "Slow geometric orbital pan focusing on the neural matrix grid background",
    "focalLength": "35mm anamorphic prime lens, f/1.2",
    "coordinateVectors": [0.0, 1.4, -2.5, -15.0, 45.0, 0.0]
  },
  "lighting": {
    "keyLight": "High-contrast geometric volumetric neon emitter (5200K)",
    "ambientLevel": 0.15,
    "photonicEmissions": "Emerald-gold laser refraction on obsidian surfaces",
    "scatteringType": "Rayleigh dust scattering enabled"
  },
  "materials": {
    "subjectTexturing": "Deep liquid matte obsidian plate with micro-fractures exposing hyper-conductive fiber gold",
    "roughnessGrid": 0.08,
    "refractionIndex": 1.48
  },
  "expressionVector": {
    "resonanceTone": "Deep, calm, measured chest timbre with deliberate logical pauses",
    "eyeContactCoordinates": [0.0, 0.0, 1.0],
    "microExpressionCue": "Slight narrowing of eyelids upon evaluating high-complexity architecture"
  }
}
=== [END_ODYSSEY_SCENE_SEQUENCE] ===
`;
}

/**
 * Parses Odyssey Cinematic Scripting directives from the text output, returning any structured sequences.
 */
export function parseOdysseyDirectives(text: string): { sanitizedText: string; sequences: OdysseySceneSequence[] } {
  let workingText = text;
  const sequences: OdysseySceneSequence[] = [];

  // Highly robust regex that handles any newline styles or formatting inconsistencies
  const odysseyRegex = /===\s*\[ODYSSEY_SCENE_SEQUENCE\]\s*===([\s\S]*?)===\s*\[END_ODYSSEY_SCENE_SEQUENCE\]\s*===/gi;
  
  const sanitizedText = workingText.replace(odysseyRegex, (match, jsonContent) => {
    try {
      const parsed = JSON.parse(jsonContent.trim());
      sequences.push(parsed);
    } catch (e) {
      console.error("[ODYSSEY PARSE ERROR] Corrupt Cinematic Scripting block ignored.", e);
    }
    return ""; // Strip the block entirely from the rendering text
  });

  return {
    sanitizedText: sanitizedText.trim(),
    sequences
  };
}
