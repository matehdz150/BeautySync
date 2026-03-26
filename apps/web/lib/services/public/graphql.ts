// lib/graphql.ts

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
  const isServer = typeof window === "undefined";

  const res = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    ...(isServer ? {} : { credentials: "include" }),
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
