import express from "express";
import cors from "cors";
import runpodSdk from "runpod-sdk";
import dotenv from "dotenv";
import say from "say";
import fs from "fs/promises";
import { promisify } from "util";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Configure RunPod
const RUNPOD_API_KEY = "";
const ENDPOINT_ID = "";
const runpod = runpodSdk(RUNPOD_API_KEY);
const endpoint = runpod.endpoint(ENDPOINT_ID);

const exportSpeech = promisify(say.export.bind(say));
async function convertTextToAudio(text) {
  const outputFile = "output.wav";
  try {
    await exportSpeech(text, null, 1.0, outputFile);
    const audioData = await fs.readFile(outputFile);
    const base64Audio = audioData.toString("base64");
    await fs.unlink(outputFile);
    return base64Audio;
  } catch (error) {
    console.error("Error in text-to-speech conversion:", error);
    throw error;
  }
}
app.post("/process", async (req, res) => {
  try {
    const { text, image } = req.body;
    // Convert text to audio
    const audio = await convertTextToAudio(text);
    // Prepare input for lipsync API
    const input = {
      face: image,
      audio: audio,
    };
    // Call lipsync API
    const result = await endpoint.run({ input });
    //console.log("Run response:", result);
    const { id } = result;
    if (!id) {
      throw new Error("No ID returned from endpoint.run");
    }
    // Stream the results
    res.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "Transfer-Encoding": "chunked",
    });
    console.log("Streaming started");

    for await (const output of endpoint.stream(id)) {
      res.write(Buffer.from(JSON.parse(output.output).video, "base64"));
    }
    console.log("Streaming finished");
    res.end();
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred during processing" });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
