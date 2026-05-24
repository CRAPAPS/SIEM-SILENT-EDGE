FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm install typescript @types/node @types/express @types/dockerode
COPY index.ts tsconfig.json ./
RUN npx tsc
EXPOSE 9100
CMD ["node", "dist/index.js"]
