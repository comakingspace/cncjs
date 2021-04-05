FROM --platform=linux/arm/v7 node:10

ADD package.json package.json

RUN npm install --build-from-source

ADD . .
EXPOSE 8000
CMD bin/cnc
