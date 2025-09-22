const socket = io(window.location.origin);
let username = prompt("Enter username:");
let messagesDiv = document.getElementById("messages");

let rsaKeyPair;
let aesKey = null;

// RSA helpers
async function genRSA() {
    rsaKeyPair = await crypto.subtle.generateKey(
        { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: "SHA-256" },
        true, ["encrypt","decrypt"]
    );
    let pubKey = await crypto.subtle.exportKey("spki", rsaKeyPair.publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(pubKey)));
}

async function importRSA(spki_b64) {
    let binary = Uint8Array.from(atob(spki_b64), c => c.charCodeAt(0));
    return crypto.subtle.importKey("spki", binary, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
}

// AES helpers
async function genAESKey() {
    return crypto.subtle.generateKey({ name:"AES-GCM", length:256 }, true, ["encrypt","decrypt"]);
}

async function encryptAES(msg) {
    const enc = new TextEncoder().encode(msg);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name:"AES-GCM", iv }, aesKey, enc);
    return { iv:Array.from(iv), data:Array.from(new Uint8Array(ct)) };
}

async function decryptAES(payload) {
    const iv = new Uint8Array(payload.iv);
    const data = new Uint8Array(payload.data);
    const pt = await crypto.subtle.decrypt({ name:"AES-GCM", iv }, aesKey, data);
    return new TextDecoder().decode(pt);
}

// RSA encrypt/decrypt for AES key exchange
async function encryptRSA(pubKey, rawAES) { return crypto.subtle.encrypt({ name:"RSA-OAEP" }, pubKey, rawAES); }
async function decryptRSA(cipher) { return crypto.subtle.decrypt({ name:"RSA-OAEP" }, rsaKeyPair.privateKey, cipher); }

// Socket events
socket.on("connect", async () => {
    console.log("Connected");
    let pubKeyB64 = await genRSA();
    socket.emit("register", { user: username, pubkey: pubKeyB64 });
});

socket.on("pubkey", async (data) => {
    if (data.error) return console.error(data.error);
    let friendPub = await importRSA(data.pubkey);
    aesKey = await genAESKey();
    let rawAES = await crypto.subtle.exportKey("raw", aesKey);
    let encAES = await encryptRSA(friendPub, rawAES);
    socket.emit("send_message", { from: username, msg: Array.from(new Uint8Array(encAES)), keyexchange:true });
    console.log("[*] AES key sent");
});

socket.on("receive_message", async (data) => {
    if (data.from === username) return;
    if (data.keyexchange) {
        let encKey = new Uint8Array(data.msg);
        let rawAES = await decryptRSA(encKey.buffer);
        aesKey = await crypto.subtle.importKey("raw", rawAES, { name:"AES-GCM" }, true, ["encrypt","decrypt"]);
        console.log("[*] AES key received!");
    } else if (aesKey) {
        let msg = await decryptAES(data.msg);
        let div = document.createElement("div");
        div.textContent = `${data.from}: ${msg}`;
        messagesDiv.appendChild(div);
    }
});

document.getElementById("sendBtn").onclick = async () => {
    let input = document.getElementById("msgInput");
    let msg = input.value;
    if (!msg) return;
    if (!aesKey) { alert("No AES session key yet!"); return; }
    let cipher = await encryptAES(msg);
    socket.emit("send_message", { from: username, msg: cipher });
    let div = document.createElement("div");
    div.textContent = `Me: ${msg}`;
    messagesDiv.appendChild(div);
    input.value = "";
};

// auto-request all other pubkeys after 3 sec
setTimeout(() => {
    socket.emit("get_pubkey", { friend: prompt("Enter friend username to start chat:") });
}, 3000);
