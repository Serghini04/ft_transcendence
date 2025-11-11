FROM docker.elastic.co/logstash/logstash:8.11.0

USER root

RUN rm -rf /usr/share/logstash/pipeline/* && \
    mkdir -p /usr/share/logstash/pipeline

USER logstash

EXPOSE 5000 9600
