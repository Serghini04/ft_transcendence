FROM docker.elastic.co/logstash/logstash:8.11.0

# Copy pipeline configuration
COPY pipeline/logstash.conf /usr/share/logstash/pipeline/logstash.conf

# Copy custom patterns if any
COPY patterns/ /usr/share/logstash/patterns/

# Install additional plugins if needed
RUN logstash-plugin install logstash-filter-json_encode

USER logstash

EXPOSE 5000 5044 9600

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=5 \
  CMD curl -f http://localhost:9600/?pretty || exit 1
