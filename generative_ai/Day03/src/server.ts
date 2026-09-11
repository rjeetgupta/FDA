import app from "./index.ts"

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`)
})
