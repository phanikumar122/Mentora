# ── Build Stage ──
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# ── Runtime Stage ──
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create persistent uploads directory for study materials
RUN mkdir -p /app/uploads

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8081

# Standard Java 21 container flags for container memory awareness
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
