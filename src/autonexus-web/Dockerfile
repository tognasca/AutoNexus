FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_DEMO_VIDEO_URL=
ARG VITE_PUBLIC_WHATSAPP_NUMBER=
ENV VITE_DEMO_VIDEO_URL=$VITE_DEMO_VIDEO_URL
ENV VITE_PUBLIC_WHATSAPP_NUMBER=$VITE_PUBLIC_WHATSAPP_NUMBER
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
