import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Mensajes inválidos' }, { status: 400 });
    }

    // Configuración del proxy hacia OpenClaw
    // OpenClaw suele escuchar en el puerto 18789 (o el que se haya configurado)
    // Su API es compatible con OpenAI, por lo que usamos el formato estándar
    const OPENCLAW_URL = 'http://127.0.0.1:18789/v1/chat/completions';
    
    const payload = {
      model: 'gemini-1.5-flash', // El modelo configurado en OpenClaw
      messages: [
        {
          role: 'system',
          content: 'Eres el Director de Inteligencia y Estrategia de la empresa Fim (una app de transporte tipo Uber). Eres un asesor brillante, directo y analítico. Tu trabajo es responder a las consultas del administrador con estrategias de negocio, análisis de métricas y recomendaciones tácticas. Sé conciso y profesional.'
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1024,
    };

    const response = await fetch(OPENCLAW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENCLAW_TOKEN || 'MISSING_TOKEN'}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error del Gateway de OpenClaw:', errorText);
      return NextResponse.json({ error: 'Error comunicándose con el agente de IA' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error en /api/agent:', error);
    return NextResponse.json({ error: 'Error interno del servidor proxy' }, { status: 500 });
  }
}
