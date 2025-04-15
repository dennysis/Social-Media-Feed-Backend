import express from 'express';
import { startServer } from './server';
import routes from './routes';
import cors from 'cors';

// First, initialize the Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Then, apply middleware
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true // Enable if you're using cookies/sessions
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up routes
app.use('/', routes);


async function main() {
  const { httpServer } = await startServer();
  
  httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`GraphQL endpoint at http://localhost:${PORT}/graphql`);
  });
}

main().catch(err => {
  console.error('Error starting server:', err);
});
