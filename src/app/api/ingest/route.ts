import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const body = await req.json();

  const { files } = body;

  const res = await fetch(process.env.SUPERRAG_API_URL + "/ingest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      index_name: process.env.SUPERRAG_INDEX_NAME,
      files,
      vector_database: {
        type: process.env.VECTOR_DB_PROVIDER,
        config: {
          host: process.env.VECTOR_DB_HOST,
          api_key: process.env.VECTOR_DB_API_KEY,
        },
      },
    }),
  });

  if (res.ok) {
    return NextResponse.json("OK", { status: res.status });
  }

  return NextResponse.json(
    { error: { message: "Error ingesting files into SuperRag" } },
    { status: 500 }
  );
};
