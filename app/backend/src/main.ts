import { Logger } from "@nestjs/common";
import { createApplication } from "./application";

const PORT = Number(process.env.PORT ?? 3001);

async function bootstrap(): Promise<void> {
  const app = await createApplication();
  await app.listen(PORT, "0.0.0.0");
  new Logger("bootstrap").log(`listening on ${PORT}`);
}

void bootstrap();
