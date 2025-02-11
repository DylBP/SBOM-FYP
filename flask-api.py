from flask import Flask, send_from_directory

app = Flask(__name__)
FILE_DIRECTORY = "/home/ec2-user"

@app.route("/files/<filename>")
def serve_file(filename):
    return send_from_directory(FILE_DIRECTORY, filename)

@app.route("/")
def serve_hello_world():
    return "<h1>Hello, world!</h1>"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)