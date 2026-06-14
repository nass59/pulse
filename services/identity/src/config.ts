const required = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
};

export const config = {
  port: Number(process.env.PORT ?? 3100),
  databaseUrl: required("DATABASE_URL"),
  kafkaBrokers: required("KAFKA_BROKERS"),
  schemaRegistryUrl: required("SCHEMA_REGISTRY_URL"),
  relayPollMs: Number(process.env.RELAY_POLL_MS ?? 500),
} as const;
