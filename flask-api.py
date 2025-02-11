from flask import Flask, send_from_directory

app = Flask(__name__)
FILE_DIRECTORY = "/home/ec2-user"

@app.route("/files/<filename>")
def serve_file(filename):
    return send_from_directory(FILE_DIRECTORY, filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)