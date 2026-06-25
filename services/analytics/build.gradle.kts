import com.github.davidmc24.gradle.plugin.avro.GenerateAvroJavaTask

plugins {
  kotlin("jvm") version "2.0.21"
  application
  id("com.github.davidmc24.gradle.plugin.avro") version "1.9.1"
}

repositories {
  mavenCentral()
  maven("https://packages.confluent.io/maven")
}

dependencies {
  implementation("org.apache.kafka:kafka-streams:3.8.0")
  implementation("io.confluent:kafka-streams-avro-serde:7.8.0")
  implementation("io.ktor:ktor-server-netty:2.3.12")
  implementation("ch.qos.logback:logback-classic:1.5.13")
  implementation("org.apache.avro:avro:1.11.4")
}

tasks.named<GenerateAvroJavaTask>("generateAvroJava") {
  source("../../packages/schemas/avro")
}

application {
  mainClass = "pulse.analytics.MainKt"
}

kotlin {
  jvmToolchain(21)
}
