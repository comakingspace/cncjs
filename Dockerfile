FROM --platform=linux/arm/v7 debian:stable-slim

RUN apt-get update && \
    apt-get install -y npm git

#RUN npm install -g npm@5.6.0

RUN git clone https://github.com/comakingspace/cncjs
WORKDIR cncjs
RUN npm install --build-from-source

EXPOSE 8000
CMD bin/cnc
