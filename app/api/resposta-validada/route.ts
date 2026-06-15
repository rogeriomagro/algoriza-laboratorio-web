export async function POST(request: Request) {
  const webhookUrl = process.env.N8N_RESPOSTA_VALIDADA_WEBHOOK_URL;

  if (!webhookUrl) {
    return Response.json(
      { skipped: true, reason: "N8N_RESPOSTA_VALIDADA_WEBHOOK_URL não configurada" },
      { status: 200 }
    );
  }

  const payload = await request.json();

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return Response.json(
      {
        error: "Falha ao chamar webhook Resposta Validada",
        status: response.status,
        detail: text
      },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
