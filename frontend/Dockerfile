# Dockerfile - Frontend
FROM node:20 AS builder

WORKDIR /app
COPY . .
RUN npm install --include=dev && npm run build
# RUN npm install react react-dom
# RUN npm install -D typescript @types/react @types/react-dom

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]