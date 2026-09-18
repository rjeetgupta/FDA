import app from "./app.js";


const port: number = Number(process.env.PORT) || 4444;

app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});
