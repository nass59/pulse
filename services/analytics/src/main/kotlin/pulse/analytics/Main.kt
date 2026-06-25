package pulse.analytics

import io.confluent.kafka.serializers.AbstractKafkaSchemaSerDeConfig
import io.confluent.kafka.serializers.KafkaAvroDeserializerConfig
import io.confluent.kafka.streams.serdes.avro.SpecificAvroSerde
import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.streams.KafkaStreams
import org.apache.kafka.streams.StreamsBuilder
import org.apache.kafka.streams.StreamsConfig
import org.apache.kafka.streams.kstream.Consumed
import java.util.Properties
import pulse.events.v1.ViewerJoined

fun main() {
  val props = Properties().apply {
    put(StreamsConfig.APPLICATION_ID_CONFIG, "pulse-analytics")
    put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092")
    put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String()::class.java)
    put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String()::class.java)
  }

  val registryUrl = "http://localhost:8080/apis/ccompat/v7"
  val valueSerde = SpecificAvroSerde<ViewerJoined>().apply {
    configure(
      mapOf(
        AbstractKafkaSchemaSerDeConfig.SCHEMA_REGISTRY_URL_CONFIG to registryUrl,
        KafkaAvroDeserializerConfig.SPECIFIC_AVRO_READER_CONFIG to true,
      ),
      false, // isKey = false -> value serde
    )
  }

  val builder = StreamsBuilder()
  builder.stream(
    "chat.presence.joined.v1",
    Consumed.with(Serdes.String(), valueSerde)
  )
    .foreach { channelId, event ->
      println("viewer joined: stream=${event.streamId} user=${event.userId}")
    }

  val streams = KafkaStreams(builder.build(), props)

  Runtime.getRuntime().addShutdownHook(Thread {
    println("shutting down")
    streams.close()
  })

  streams.start()
}
