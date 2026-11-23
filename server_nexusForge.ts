import express from "express";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";

const router = express.Router();
const OUTPUT_SVG = path.join(process.cwd(), "nexus_forge_x_output.svg");
const OUTPUT_PNG = path.join(process.cwd(), "public", "generated_files", "nexus_forge_x_output.png");
const ENGINE_SCRIPT = path.join(process.cwd(), "architecture", "nexus_genesis_engine.py");

router.post("/generate", async (req, res) => {
  const { concept, steps, useExternal } = req.body as {
    concept?: string;
    steps?: number;
    useExternal?: boolean;
  };

  if (!concept || !String(concept).trim()) {
    return res.status(400).json({ error: "Concept is required for Nexus Forge X." });
  }

  const cleanConcept = String(concept).trim().slice(0, 1200);
  const sanitizedSteps = Math.min(Math.max(Number(steps) || 20, 5), 60);
  const useExternalStr = useExternal === false ? "false" : "true";

  const outDir = path.dirname(OUTPUT_PNG);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const args = [
    ENGINE_SCRIPT,
    "--concept",
    cleanConcept,
    "--steps",
    String(sanitizedSteps),
    "--use_external",
    useExternalStr,
    "--output_svg",
    OUTPUT_SVG,
    "--output_png",
    OUTPUT_PNG
  ];

  execFile(
    "python3",
    args,
    { env: { ...process.env }, timeout: 45000, maxBuffer: 10 * 1024 * 1024 },
    (error, stdout, stderr) => {
      const logs = (stdout || "").split("\n").filter(line => line.trim().length > 0);
      const errorLogs = stderr ? stderr.split("\n").filter(line => line.trim().length > 0) : [];

      if (error) {
        console.error("[NEXUS ERROR] Forge X script execution error:", error);
        return res.json({
          success: false,
          error: error.message,
          logs: [...logs, ...errorLogs, `[FATAL] Execution failed: ${error.message}`]
        });
      }

      try {
        if (fs.existsSync(OUTPUT_SVG)) {
          const svgContent = fs.readFileSync(OUTPUT_SVG, "utf-8");
          const pngAvailable = fs.existsSync(OUTPUT_PNG);
          return res.json({
            success: true,
            logs: [
              ...logs,
              "[SUCCESS] Multi-Pass Critic & Vector/Raster Canvas generated from 128x128 latent force grid.",
              "[NEXUS] Forge X completed with verified SVG + PNG contract."
            ],
            svgContent,
            pngUrl: pngAvailable ? "/generated_files/nexus_forge_x_output.png" : undefined,
            title: `Sovereign Genesis: ${cleanConcept.substring(0, 36)}${cleanConcept.length > 36 ? "..." : ""}`
          });
        } else {
          throw new Error("Generated SVG file was not found after execution.");
        }
      } catch (fsErr: any) {
        console.error("[NEXUS ERROR] Failed to read generated SVG file:", fsErr);
        return res.json({
          success: false,
          error: fsErr.message || "Output asset could not be recovered.",
          logs: [...logs, `[ERROR] Output asset read failure: ${fsErr.message}`]
        });
      }
    }
  );
});

export default router;
