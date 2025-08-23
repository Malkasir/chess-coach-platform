#!/bin/bash

# Install OpenJDK 17
echo "Installing OpenJDK 17..."
curl -L https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.8.1%2B1/OpenJDK17U-jdk_x64_linux_hotspot_17.0.8.1_1.tar.gz -o openjdk17.tar.gz

# Extract Java
tar -xzf openjdk17.tar.gz
mv jdk-17.0.8.1+1 java17

# Set JAVA_HOME
export JAVA_HOME=$PWD/java17
export PATH=$JAVA_HOME/bin:$PATH

# Verify Java installation
java -version

echo "Java installation complete"