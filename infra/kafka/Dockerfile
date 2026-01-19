FROM apache/kafka:latest

USER root

# Install wget and download JMX Prometheus exporter
RUN apk add --no-cache wget && \
    wget -O /usr/share/jmx_prometheus_javaagent.jar \
    https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.20.0/jmx_prometheus_javaagent-0.20.0.jar

# Copy JMX exporter configuration
COPY config.yml /etc/jmx-exporter/config.yml

USER appuser

EXPOSE 9092 9093 7071 9999
