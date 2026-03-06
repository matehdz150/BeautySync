interface Props {
  client: any;
}

export default function RewardsSection({ client }: Props) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">
        Beneficios y recompensas
      </h2>

      <div className="border rounded-lg p-4 bg-white space-y-2">
        <p>
          Cliente: <span className="font-medium">{client.name}</span>
        </p>

        <p className="text-muted-foreground text-sm">
          Aquí puedes agregar sistema de puntos, nivel VIP, recompensas
          acumuladas, etc.
        </p>
      </div>
    </section>
  );
}