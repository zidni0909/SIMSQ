import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const projectPath = process.cwd();
const projectName = path.basename(projectPath);

const mcpConfigPath = path.join(projectPath, ".mcp.json");
if (!fs.existsSync(mcpConfigPath)) {
  throw new Error(`Missing MCP config: ${mcpConfigPath}`);
}

const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));
const testSprite = mcpConfig.TestSprite;
if (!testSprite?.command || !Array.isArray(testSprite.args)) {
  throw new Error(`Invalid .mcp.json TestSprite configuration`);
}

// API key is injected into the spawned MCP server env; do not log it.
const apiKey = testSprite?.env?.API_KEY;
if (!apiKey) {
  throw new Error(`API_KEY not found in .mcp.json TestSprite.env.API_KEY`);
}

const transport = new StdioClientTransport({
  command: testSprite.command,
  args: testSprite.args,
  env: { API_KEY: apiKey },
  cwd: projectPath,
});

const client = new Client({
  name: "testsprite-runner",
  version: "0.1.0",
});

function logContent(result) {
  const contents = result?.content ?? [];
  const texts = contents
    .map((c) => (c && typeof c === "object" && "text" in c ? c.text : null))
    .filter(Boolean);
  if (texts.length) console.log(texts.join("\n"));
}

console.log("Connecting to TestSprite MCP server...");
await client.connect(transport);
console.log("Connected.");

// Just to make sure server is alive and tools are discoverable.
const tools = await client.listTools();
const toolNames = new Set((tools?.tools ?? []).map((t) => t.name));
for (const needed of [
  "testsprite_generate_code_summary",
  "testsprite_generate_standardized_prd",
  "testsprite_generate_frontend_test_plan",
  "testsprite_generate_code_and_execute",
]) {
  if (!toolNames.has(needed)) {
    throw new Error(`Required tool not found: ${needed}`);
  }
}

console.log("Generating code summary...");
await client.callTool({
  name: "testsprite_generate_code_summary",
  arguments: { projectRootPath: projectPath },
});

console.log("Generating standardized PRD...");
await client.callTool({
  name: "testsprite_generate_standardized_prd",
  arguments: { projectPath },
});

console.log("Generating frontend test plan...");
await client.callTool({
  name: "testsprite_generate_frontend_test_plan",
  arguments: { projectPath, needLogin: true },
});

console.log("Setting execution args (MCP step)...");
await client.callTool({
  name: "testsprite_generate_code_and_execute",
  arguments: {
    projectName,
    projectPath,
    testIds: [],
    additionalInstruction: "",
    serverMode: "development",
  },
});

// We intentionally stop here; actual execution is done by the CLI command afterwards.
await transport.close();
console.log("MCP prerequisite steps done.");

