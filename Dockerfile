FROM node:18-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-slim
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_PATH=/data/database.db
RUN mkdir -p /data
VOLUME ["/data"]
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.* ./
COPY --from=build /app/lib ./lib
COPY --from=build /app/app ./app
COPY --from=build /app/constants ./constants
COPY --from=build /app/types ./types
COPY --from=build /app/scripts ./scripts
EXPOSE 3000
CMD ["npm","start"]