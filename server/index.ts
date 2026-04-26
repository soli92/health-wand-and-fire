import "dotenv/config";
import { createApp } from "./app";

const app = createApp();
const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`🧙 Health, Wand and Fire — server running on port ${PORT}`);
});

export default app;
