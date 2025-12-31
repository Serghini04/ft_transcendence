FROM docker.elastic.co/beats/filebeat:8.17.0

USER root

# Copy configuration
COPY filebeat.yml /usr/share/filebeat/filebeat.yml

# Create logs directory and set proper permissions
RUN mkdir -p /usr/share/filebeat/logs && \
    chown root:root /usr/share/filebeat/filebeat.yml && \
    chmod 644 /usr/share/filebeat/filebeat.yml && \
    chown -R root:root /usr/share/filebeat/logs && \
    chmod 755 /usr/share/filebeat/logs

# Stay as root to access Docker socket
# USER filebeat

# Override CMD to run filebeat with proper arguments
CMD ["filebeat", "-e", "--strict.perms=false"]

