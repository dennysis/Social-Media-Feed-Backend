// @ts-nocheck
import express from "express";
import { startServer } from "./server";
import routes from "./routes";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

async function main() {
  const { httpServer } = await startServer();

  httpServer.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`GraphQL endpoint at http://localhost:${PORT}/graphql`);
  });
}

main().catch((err) => {
  console.error("Error starting server:", err);
});
