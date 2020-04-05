FROM nginx:1.13.12-alpine
COPY nginx/prod/prod.conf /etc/nginx/nginx.conf
EXPOSE 80
RUN mkdir /app/
WORKDIR /app/
ADD frontend/dist dist/
CMD ["nginx", "-g", "daemon off;"]
