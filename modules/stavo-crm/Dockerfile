FROM node:22-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev --ignore-scripts
COPY . .
RUN npm run build
ENV NODE_ENV=production
EXPOSE 8080
CMD ["npm", "start"]
