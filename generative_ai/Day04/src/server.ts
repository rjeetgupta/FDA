import app from "./app.ts";

const port: number = Number(process.env.PORT) || 3000;

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
