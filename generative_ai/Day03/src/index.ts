import express from "express"
const app = express()


app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server is healthy",
  })
})

export default app;