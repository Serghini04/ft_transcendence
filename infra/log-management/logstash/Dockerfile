FROM docker.elastic.co/logstash/logstash:8.11.0

# Copy pipeline configuration
COPY pipeline/logstash.conf /usr/share/logstash/pipeline/logstash.conf

USER logstash

EXPOSE 5044

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=5 \
  CMD curl -f http://localhost:9600/?pretty || exit 1
