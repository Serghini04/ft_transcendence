FROM docker.elastic.co/elasticsearch/elasticsearch:8.11.0

# Install required plugins
RUN elasticsearch-plugin install --batch repository-s3

# Set proper permissions
USER elasticsearch

EXPOSE 9200 9300

# Health check with authentication
HEALTHCHECK --interval=30s --timeout=10s --retries=5 \
  CMD curl -f -u elastic:${ELASTIC_PASSWORD:-changeme} http://localhost:9200/_cluster/health || exit 1
