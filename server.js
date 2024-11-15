import express from 'express';
import { WebSocket } from 'ws';

const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const wsUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";

// Endpoint base
app.get('/', (req, res) => {
  res.send('OpenAI Realtime API service is running');
});

// Endpoint chat
app.post('/chat', async (req, res) => {
  const ws = new WebSocket(wsUrl, {
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "OpenAI-Beta": "realtime=v1"
    }
  });

  ws.on('open', () => {
    console.log('WebSocket connected');
    
    // Configurazione iniziale
    ws.send(JSON.stringify({
      type: 'session.update',
      session: {
        voice: 'alloy',
        instructions: "Sei un assistente AI amichevole che parla in italiano"
      }
    }));

    // Invia il messaggio dell'utente
    ws.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: req.body.message
        }]
      }
    }));
  });

  ws.on('message', data => {
    const event = JSON.parse(data);
    console.log('Evento ricevuto:', event);

    if (event.type === 'error') {
      res.status(500).json(event.error);
      ws.close();
    }

    if (event.type === 'conversation.item.created' && 
        event.item.role === 'assistant') {
      res.json(event.item);
      ws.close();
    }
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error);
    res.status(500).json({ error: error.message });
  });
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
