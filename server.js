import express from 'express';
import { WebSocket } from 'ws';

const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const wsUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";

// Endpoint di base per health check
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Endpoint chat
app.post('/chat', async (req, res) => {
  console.log('Ricevuta richiesta chat:', req.body);
  
  try {
    const ws = new WebSocket(wsUrl, {
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    });

    let timeoutId = setTimeout(() => {
      console.log('Timeout raggiunto - chiusura connessione');
      ws.close();
      res.status(504).json({ error: 'Timeout' });
    }, 30000);

    ws.on('open', () => {
      console.log('WebSocket connesso');
      
      // Prima inviamo session.update
      ws.send(JSON.stringify({
        type: 'session.update',
        session: {
          voice: 'alloy',
          instructions: "Sei un assistente AI amichevole che parla in italiano"
        }
      }));

      // Poi inviamo response.create
      ws.send(JSON.stringify({
        type: 'response.create',
        response: {
          modalities: ['text']
        }
      }));

      // Infine inviamo il messaggio
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
      console.log('Ricevuto evento:', event.type);

      if (event.type === 'error') {
        clearTimeout(timeoutId);
        console.error('Errore da OpenAI:', event.error);
        res.status(500).json(event.error);
        ws.close();
      }

      if (event.type === 'conversation.item.created' && 
          event.item.role === 'assistant' && 
          event.item.status === 'completed') {
        clearTimeout(timeoutId);
        console.log('Risposta completa ricevuta');
        res.json(event.item);
        ws.close();
      }
    });

    ws.on('error', error => {
      clearTimeout(timeoutId);
      console.error('Errore WebSocket:', error);
      res.status(500).json({ error: error.message });
      ws.close();
    });

  } catch (error) {
    console.error('Errore generale:', error);
    res.status(500).json({ error: error.message });
  }
});

// Avvio del server
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server in esecuzione sulla porta ${port}`);
});
