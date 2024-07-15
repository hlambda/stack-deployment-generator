# Simple Stack Deployment Generator

I've been immersed in various projects and exciting endeavors using stacks like Hasura + Hlambda + Postgres. A common challenge is figuring out an efficient way to generate deployments and essential secrets without mistakenly using them across different projects. Manually creating secrets in a .env file for every project turned out to be more time-consuming and error-prone than expected, especially when dealing with public/private key pairs. To tackle this issue, I came up with a simple script(hopefully one day CLI tool). This tool does the job of generating a docker-compose.yml file and a .env file with the necessary secrets, streamlining the deployment process and minimizing the risk of accidental reuse. It's not flawless, but it's a starting point, and I have plans to introduce more features in the future. I hope you find it valuable. It works great with [Portainer](https://www.portainer.io/), you can just copy both files into the new stack.

# How to use

```bash
node ./src/creatDeploymentInstance.mjs
```

```bash
node ./src/creatDeploymentInstance.mjs --name MyProject
```

```bash
node ./src/creatDeploymentInstance.mjs --name "UnicornStartup" --stackPrefix "web-app-unicorn-startup"
```

# Portainer tips and tricks

When creating a new stack you can copy docket-compose.yaml contents into the editor, then under "Environment variables" ➤ "Advanced mode" ➤ Paste the contents of the .env file.

# Additional thoughts

I would really like if this script would have no dependencies other than the Node.js v20+
