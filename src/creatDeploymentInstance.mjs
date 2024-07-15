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
// We need to define service names
const __CONST_SERVICE_NAME_PREFIX =
  parsedArgsObject?.["stackPrefix"] ?? generatedId;
const __CONST_SERVICE_NAME_HASURA = `${__CONST_SERVICE_NAME_PREFIX}-hasura`;
const __CONST_SERVICE_NAME_HLAMBDA = `${__CONST_SERVICE_NAME_PREFIX}-hlambda`;
const __CONST_SERVICE_NAME_POSTGRES = `${__CONST_SERVICE_NAME_PREFIX}-postgres`;

// ---
// Postgres
const __CONST_POSTGRES_USER = "postgres";
const __CONST_POSTGRES_DATABASE_NAME = "postgres";
const __CONST_POSTGRES_PASSWORD = `PG_${crypto
  .randomBytes(16)
  .toString("hex")}`;
const __CONST_POSTGRES_HOST =
  parsedArgsObject?.["postgresHost"] ?? __CONST_SERVICE_NAME_POSTGRES; // Hostname should be the name of service by default
const __CONST_POSTGRES_PORT = parsedArgsObject?.["postgresPort"] ?? "5432";
// ---
// Hasura
const __CONST_HASURA_ADMIN_SECRET = `HASURA_${crypto
  .randomBytes(16)
  .toString("hex")}`;
const __CONST_HOOK_SECRET = `HOOK_SECRET_${crypto
  .randomBytes(16)
  .toString("hex")}`;
const __CONST_HOOK_SECRET_HEADER_NAME =
  parsedArgsObject?.["hookSecretHeaderName"] ?? "x-hook-secret";
// ---
// Hlambda
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
const __CONST_HLAMBDA_ADMIN_SECRET = `HLAMBDA_${crypto
  .randomBytes(16)
  .toString("hex")}`;
// ---

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
HASURA_GRAPHQL_METADATA_DATABASE_URL="postgres://${__CONST_POSTGRES_USER}:${__CONST_POSTGRES_PASSWORD}@${__CONST_POSTGRES_HOST}:${__CONST_POSTGRES_PORT}/${__CONST_POSTGRES_DATABASE_NAME}"
HASURA_GRAPHQL_DATABASE_URL="postgres://${__CONST_POSTGRES_USER}:${__CONST_POSTGRES_PASSWORD}@${__CONST_POSTGRES_HOST}:${__CONST_POSTGRES_PORT}/${__CONST_POSTGRES_DATABASE_NAME}"
HASURA_GRAPHQL_ADMIN_SECRET="${__CONST_HASURA_ADMIN_SECRET}"
HASURA_GRAPHQL_JWT_SECRET='{"claims_namespace_path":"$", "type":"RS256", "key": "${__CONST_PUBLIC_KEY}"}'
ACTION_BASE_URL="http://${__CONST_SERVICE_NAME_HLAMBDA}:1331"
HOOK_SECRET="${__CONST_HOOK_SECRET}"
HOOK_SECRET_HEADER_NAME="${__CONST_HOOK_SECRET_HEADER_NAME}"

# Hlambda service
HLAMBDA_ADMIN_SECRET="${__CONST_HLAMBDA_ADMIN_SECRET}"
HASURA_GRAPHQL_API_ENDPOINT="http://${__CONST_SERVICE_NAME_HASURA}:8080/v1/graphql"
HLAMBDA_JWT_PRIVATE_KEY="${__CONST_PRIVATE_KEY}"

`;

// Read the docker compose file
const dockerComposeFile = await readFile("./src/docker-compose.yaml", "utf8");

// Do the preprocessing
const dockerComposeFileProcessed = dockerComposeFile
  .replace(
    new RegExp("__CONST_SERVICE_NAME_POSTGRES", "g"),
    __CONST_SERVICE_NAME_POSTGRES
  )
  .replace(
    new RegExp("__CONST_SERVICE_NAME_HASURA", "g"),
    __CONST_SERVICE_NAME_HASURA
  )
  .replace(
    new RegExp("__CONST_SERVICE_NAME_HLAMBDA", "g"),
    __CONST_SERVICE_NAME_HLAMBDA
  );

// Replace all the instances in docker-compose.yaml

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
  `${header}${dockerComposeFileProcessed}`,
  {
    encoding: "utf8",
  }
);
