FROM docker.elastic.co/kibana/kibana:8.11.0

# Copy custom configuration
COPY --chown=kibana:kibana kibana.yml /usr/share/kibana/config/kibana.yml

EXPOSE 5601
