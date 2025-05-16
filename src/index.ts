import app from "./server";
import { PORT } from "./lib/db";

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
