import express from 'express';

const app = express();
app.use(express.json());

// Endpoint base per health check
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Esplicita configurazione della porta
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
