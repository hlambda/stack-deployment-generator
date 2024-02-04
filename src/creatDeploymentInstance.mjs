/*
  Author: Gordan Nekić
  This is a script that generates secrets for the deployment instance.
  It generates .env file and makes a copy of docker-compose.yaml file.
  ---
  Version: 0.0.1
  Date: 2024-01-04
*/
import crypto from "crypto";
import { readFile, writeFile, mkdir } from "fs/promises";
// import { DateTime } from "luxon"; // Unnecessary dependency

import parseArgs from "./utils/getArgs.mjs";

// Better than uuidv4 from package uuid
// const generatedId = crypto.randomUUID();
const generatedId = crypto.randomBytes(5).toString("hex");

// const timeOfGeneration = DateTime.now({
//   zone: "UTC",
// }).toFormat("yyyy-MM-dd HH:mm:ss");

const date = new Date();
const timeOfGeneration = date.toISOString().replace("T", " ").substring(0, 19);

const parsedArgsObject = parseArgs();

// This is the secret generator part...
const __PROJECT_NAME = parsedArgsObject?.["name"] ?? ""; // "Example Project"; // Choose your project name here
const __PROJECT_STACK_NAME = parsedArgsObject?.["stackName"] ?? ""; // "Hasura + Hlambda + Postgres"; // Choose your project stack name here
// ---
const __CONST_POSTGRES_USER = "postgres";
const __CONST_POSTGRES_DATABASE_NAME = "postgres";
const __CONST_POSTGRES_PASSWORD = crypto.randomBytes(16).toString("hex");
const __CONST_HASURA_ADMIN_SECRET = `hasura-${crypto
  .randomBytes(16)
  .toString("hex")}`;
const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});
const __CONST_PRIVATE_KEY = privateKey.replace(/\n/g, "\\n");
const __CONST_PUBLIC_KEY = publicKey.replace(/\n/g, "\\n");
const __CONST_HLAMBDA_ADMIN_SECRET = `hlambda-${crypto
  .randomBytes(16)
  .toString("hex")}`;

const header = `# Auto Generated on ${timeOfGeneration} | ID: ${generatedId}\n${
  typeof __PROJECT_NAME === "string" && __PROJECT_NAME !== ""
    ? `# Project name: "${__PROJECT_NAME}"\n`
    : ""
}${
  typeof __PROJECT_STACK_NAME === "string" && __PROJECT_STACK_NAME !== ""
    ? `# Project stack: "${__PROJECT_STACK_NAME}"\n`
    : ""
}# ${"-".repeat(80 - 2)}\n`;

const envFileTemplate =
  header +
  /* .env */ `
# Postgres service
POSTGRES_PASSWORD="${__CONST_POSTGRES_PASSWORD}"

# Hasura service
HASURA_GRAPHQL_METADATA_DATABASE_URL="postgres://${__CONST_POSTGRES_USER}:${__CONST_POSTGRES_PASSWORD}@postgres:5432/${__CONST_POSTGRES_DATABASE_NAME}"
HASURA_GRAPHQL_ADMIN_SECRET="${__CONST_HASURA_ADMIN_SECRET}"
HASURA_GRAPHQL_JWT_SECRET='{"claims_namespace_path":"$", "type":"RS256", "key": "${__CONST_PUBLIC_KEY}"}'

# Hlambda service
HLAMBDA_ADMIN_SECRET="${__CONST_HLAMBDA_ADMIN_SECRET}"
HLAMBDA_JWT_PRIVATE_KEY="${__CONST_PRIVATE_KEY}"
`;

// Read the docker compose file
const dockerComposeFile = await readFile("./src/docker-compose.yaml", "utf8");

// Info: It is better to read docker-compose file as is than to encode it in js as a template string.
// because it can contain ${} as part of yaml syntax, and it will be interpreted as a template string in js.
// and this is why we only generate .env file and copy docker-compose.yaml file as is.

const deploymentInstanceName =
  typeof __PROJECT_NAME === "string" && __PROJECT_NAME !== ""
    ? `di-${generatedId}-${__PROJECT_NAME}`
    : `di-${generatedId}`;

console.log(`Creating deployment instance "${deploymentInstanceName}"`);

await mkdir(`./deployments/${deploymentInstanceName}/`, {
  recursive: true,
});
await writeFile(
  `./deployments/${deploymentInstanceName}/stack.env`,
  envFileTemplate,
  {
    encoding: "utf8",
  }
);
await writeFile(
  `./deployments/${deploymentInstanceName}/docker-compose.yaml`,
  `${header}${dockerComposeFile}`,
  {
    encoding: "utf8",
  }
);
