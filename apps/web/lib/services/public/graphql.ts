// lib/graphql.ts

export async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/graphql`, {
    method: "POST",
    credentials: "include", // 🔥 cookies (auth)
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!res.ok) {
    throw new Error("GraphQL request failed");
  }

  const json = await res.json();

  if (json.errors) {
    console.error(json.errors);
    throw new Error(json.errors[0]?.message ?? "GraphQL error");
  }

  return json.data;
}
