# Dockerfile - Frontend
FROM node:20 AS builder

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copia só os arquivos necessários para cache mais eficiente
COPY package.json package-lock.json ./

# Instala dependências (dev incluídas via NODE_ENV)
ENV NODE_ENV=development
RUN npm install

COPY . ./

# Força instalação de devDependencies como @types/node

RUN npm install --include=dev && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
