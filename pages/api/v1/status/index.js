function status(request, response) {
  response.status(200).send("Hello World\n")
}

export default status