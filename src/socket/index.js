export default function registerSocketHandlers(io) {
    io.on("connection", (socket) => {
        console.log("Socket connesso:", socket.id);

        socket.on("disconnect", () => {
            console.log("Socket disconnesso:", socket.id);
        });
    });
}
