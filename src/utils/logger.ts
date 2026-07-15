import { ContainerBuilder, WebhookClient } from "discord.js";
import { ComponentsV2Flags } from "./main";

const wh = process.env.LOGGING_WEBHOOK ? new WebhookClient({ url: process.env.LOGGING_WEBHOOK }) : null;

// Queue system for sequential logging
const logQueue: any[] = [];
let isProcessing = false;

let loggingEnabled = false;

async function processLogQueue(): Promise<void> {
  if (isProcessing || logQueue.length === 0) return;

  isProcessing = true;

  while (logQueue.length > 0) {
    const data = logQueue.shift();
    await sendLogInternal(data);
  }

  isProcessing = false;
}

async function sendLogInternal(data: any): Promise<void> {
  if (!loggingEnabled) return;
  if (!wh) {
    console.warn("No logging webhook configured!");
    return;
  }

  let loggingContent = "";
  if (Array.isArray(data)) {
    loggingContent += data.map((i) => (typeof i === "object" ? JSON.stringify(i) : i)).join("\n");
  } else if (typeof data === "object") {
    loggingContent += JSON.stringify(data, null, 2);
  } else {
    loggingContent += data;
  }

  try {
    console.log("Sending Log", Date.now());
    await wh.send({
      flags: ComponentsV2Flags,
      components: [new ContainerBuilder().addTextDisplayComponents((t) => t.setContent("```\n" + loggingContent + "\n```"))],
      withComponents: true,
    });
  } catch (error) {
    console.error("Failed to send log:", error);
  }
}

export async function sendLog(data: any): Promise<void> {
  logQueue.push(data);
  processLogQueue();
}

export function setLogging(v: boolean) {
  loggingEnabled = v;
}
