# Multi-stage Dockerfile for Enterprise Deployment
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend with Embedded Frontend
FROM maven:3.9.9-eclipse-temurin-25 AS backend-builder
WORKDIR /app
COPY backend/pom.xml backend/
COPY backend/src backend/src/
# Copy frontend dist to backend static resources
COPY --from=frontend-builder /app/frontend/dist backend/src/main/resources/static/
WORKDIR /app/backend
RUN mvn clean package -DskipTests

# Stage 3: Lightweight Production Runtime
FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=backend-builder /app/backend/target/daily-task-manager-1.0.0.jar app.jar

EXPOSE 8080
ENV JAVA_OPTS="-Xms256m -Xmx512m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
