import com.github.davidmc24.gradle.plugin.avro.GenerateAvroJavaTask

plugins {
  kotlin("jvm") version "2.0.21"
  /**
   * kotlinx.serialization compiler plugin. It generates the (de)serializer for
   * any class you mark @Serializable at COMPILE time — that's why it's a plugin,
   * not just a library. Ktor's JSON content-negotiation uses those generated
   * serializers to turn our response data classes into JSON. Version MUST match
   * the kotlin("jvm") version above (2.0.21) — they ship together.
   */
  kotlin("plugin.serialization") version "2.0.21"
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

  /**
   * Ktor server, all pinned to the 2.3.12
   * Keep these four versions identical — mixing Ktor versions is a classpath
   * hazard on the JVM.
   *  - ktor-server-core   : the engine-agnostic server (routing, ApplicationCall).
   *  - ktor-server-netty  : the Netty engine that actually binds the socket.
   *  - content-negotiation: the plugin that picks a body (de)serializer by Content-Type / Accept headers.
   *  - serialization-kotlinx-json: wires kotlinx.serialization in as that serializer.
   */
  implementation("io.ktor:ktor-server-core:2.3.12")
  implementation("io.ktor:ktor-server-netty:2.3.12")
  implementation("io.ktor:ktor-server-content-negotiation:2.3.12")
  implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.12")

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
