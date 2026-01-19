FROM docker.elastic.co/kibana/kibana:8.11.0

# Copy custom configuration
COPY kibana.yml /usr/share/kibana/config/kibana.yml

# Copy saved objects (dashboards, visualizations)
COPY dashboards/ /usr/share/kibana/dashboards/

USER kibana

EXPOSE 5601

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=5 \
  CMD curl -f http://localhost:5601/api/status || exit 1
