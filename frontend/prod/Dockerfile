FROM node:latest

WORKDIR /app/

RUN npm install -g @quasar/cli && \
    npm install -g @vue/cli && \
    npm install -g @vue/cli-init

CMD ["quasar", "build"]
