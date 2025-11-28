FROM confluentinc/cp-kafka:7.5.0

USER root
RUN wget -O /usr/share/jmx_prometheus_javaagent.jar \
    https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.20.0/jmx_prometheus_javaagent-0.20.0.jar

COPY config.yml /etc/jmx-exporter/config.yml

USER appuser

EXPOSE 9092 7071 9999
