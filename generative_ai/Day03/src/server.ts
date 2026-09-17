import app from "./index.js"

const port: number = Number(process.env.PORT || 3006)

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`)
})
