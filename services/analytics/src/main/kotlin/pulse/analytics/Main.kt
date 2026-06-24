package pulse.analytics

import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.streams.KafkaStreams
import org.apache.kafka.streams.StreamsBuilder
import org.apache.kafka.streams.StreamsConfig
import java.util.Properties

fun main() {
  val props = Properties().apply {
    put(StreamsConfig.APPLICATION_ID_CONFIG, "pulse-analytics")
    put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092")
    put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String()::class.java)
    put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String()::class.java)
  }

  val builder = StreamsBuilder()
  builder.stream<String, String>("pulse.smoke.test")
    .foreach { key, value -> println("smoke <- key=$key value=$value") }

  val streams = KafkaStreams(builder.build(), props)

  Runtime.getRuntime().addShutdownHook(Thread {
    println("shutting down")
    streams.close()
  })

  streams.start()
}
