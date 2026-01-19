FROM docker.elastic.co/beats/filebeat:8.17.0

USER root

COPY filebeat.yml /usr/share/filebeat/filebeat.yml

RUN mkdir -p /usr/share/filebeat/logs && \
    chown root:root /usr/share/filebeat/filebeat.yml && \
    chmod 644 /usr/share/filebeat/filebeat.yml && \
    chown -R root:root /usr/share/filebeat/logs && \
    chmod 755 /usr/share/filebeat/logs

CMD ["filebeat", "-e", "--strict.perms=false"]

