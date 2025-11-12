FROM grafana/grafana:10.1.5

USER root

COPY grafana.ini /etc/grafana/grafana.ini
COPY provisioning /etc/grafana/provisioning
COPY dashboards /var/lib/grafana/dashboards

RUN chown -R grafana:root /etc/grafana/grafana.ini && \
    chown -R grafana:root /etc/grafana/provisioning && \
    chown -R grafana:root /var/lib/grafana/dashboards && \
    chmod -R 755 /var/lib/grafana/dashboards && \
    chmod -R 644 /var/lib/grafana/dashboards/*.json

USER grafana

EXPOSE 3000
