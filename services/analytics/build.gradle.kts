plugins {
  kotlin("jvm") version "2.0.21"
  application
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
}

application {
  mainClass = "pulse.analytics.MainKt"
}

kotlin {
  jvmToolchain(21)
}
