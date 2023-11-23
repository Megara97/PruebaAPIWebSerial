import React, { useEffect, useState } from "react";

const SerialPort = () => {
	/*if ("serial" in navigator) {
		console.log("Serial");
	} else {
		console.log("No Serial");
	}*/

	const [values, setValues] = useState(0);
	//let values = 0;
	const [port, setPort] = useState();
	const [portAvailable, setPortAvailable] = useState(false);
	let reader;
	let readableStreamClosed;
	let keepReading = true;

	useEffect(() => {
		checkAvailablePorts();
	}, []);
	useEffect(() => {
		port && connectSerialPort();
	}, [port]);

	class LineBreakTransformer {
		constructor() {
			// A container for holding stream data until a new line.
			this.chunks = "";
		}

		transform(chunk, controller) {
			// Append new chunks to existing chunks.
			this.chunks += chunk;
			// For each line breaks in chunks, send the parsed lines out.
			const lines = this.chunks.split("\r\n");
			this.chunks = lines.pop();
			lines.forEach((line) => controller.enqueue(line));
		}

		flush(controller) {
			// When the stream is closed, flush any remaining chunks out.
			controller.enqueue(this.chunks);
		}
	}

	navigator.serial.addEventListener("connect", (e) => {
		console.log("Connected to", e.target);
	});

	navigator.serial.addEventListener("disconnect", (e) => {
		console.log("Disconnected from", e.target);
	});

	const checkAvailablePorts = async () => {
		try {
			const ports = await navigator.serial.getPorts();
			console.log(ports);
			if (typeof ports[0] !== "undefined") {
				setPortAvailable(true);
				console.log("Available ports:", ports[0]);
				setPort(ports[0]);
			}
		} catch (error) {
			console.error("Error al abrir el puerto serie:", error.message);
		}
	};

	const checkStatus = async () => {
		console.log("Reader:", reader);
		//console.log("Reader (closed):", reader.closed);
		setPortAvailable(true);
		console.log("Port:", port);
		console.log("Readable/Writable Port:", port.readable);
	};

	const closeSerialPort = async () => {
		console.log("Reader (close):", reader);
		//console.log("Reader (closed):", reader.closed);
		keepReading = false;
		//await readData();
		await reader.cancel();
		//reader = undefined;
		//reader.releaseLock();
		await readableStreamClosed.catch(() => {});
		await port.close();
	};

	const connectSerialPort = async () => {
		setPortAvailable(true);
		console.log("Port:", port);
		try {
			if (!port?.readable) {
				await port.open({ baudRate: 9600 });
				keepReading = true;
				readData();
			}
		} catch (error) {
			console.error("Error al abrir el puerto serie:", error.message);
		}
	};

	const readData = async () => {
		//console.log("keepReading", keepReading);
		while (port?.readable && keepReading) {
			/*const decoder = new TextDecoder();
			reader = port.readable.getReader();*/
			const textDecoder = new TextDecoderStream();
			readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
			//reader = textDecoder.readable.getReader();
			reader = textDecoder.readable
				.pipeThrough(new TransformStream(new LineBreakTransformer()))
				.getReader();
			console.log("Reader:", reader);
			console.log("Reader (closed):", reader.closed);
			try {
				while (true) {
					const { value, done } = await reader.read();
					if (done) {
						reader.releaseLock();
						break;
					}
					if (value) {
						console.log("Recibido:", value); //decoder.decode
						const weight = value.substring(2, 10);
						console.log(weight);
						//values = weight;
						//setValues(weight);
					}
				}
				reader.releaseLock();
			} catch (error) {
				console.error("Error al escuchar el puerto serie:", error.message);
			} finally {
				reader.releaseLock();
			}
		}
		//await reader.cancel();
		//reader.releaseLock();
		//await readableStreamClosed.catch(() => {});
		//await port.close();
	};

	const handleButtonClick = async () => {
		const usbVendorId = 0x2341;
		try {
			const portSelected = await navigator.serial.requestPort({
				filters: [{ usbVendorId }],
			});
			setPort(portSelected);
			/*const { usbProductId, usbVendorId } = port1.getInfo();
			console.log(usbVendorId);
			console.log(usbProductId);*/
			//await port.open({ baudRate: 9600 });
			connectSerialPort();
		} catch (error) {
			console.error("Error al abrir el puerto serie:", error.message);
		}
	};

	const writeData = async () => {
		if (typeof port !== "undefined" && port.writable) {
			const textEncoder = new TextEncoderStream();
			const writableStreamClosed = textEncoder.readable.pipeTo(
				port.writable
			);
			const writer = textEncoder.writable.getWriter();
			await writer.write("R");
			writer.close();
			await writableStreamClosed;
		}
	};

	const forgetSerialPort = async () => {
		await port.forget();
		setPortAvailable(false);
	};

	return (
		<div>
			<button onClick={handleButtonClick}>Seleccionar puerto serial</button>
			<p>{portAvailable ? "Puerto vinculado" : "Puerto no vinculado"}</p>
			{portAvailable && (
				<>
					<button onClick={forgetSerialPort}>Desvincular puerto</button>
				</>
			)}
			<p>{values} kg</p>
			{portAvailable && (
				<>
					<button onClick={connectSerialPort}>Abrir puerto</button>

					<button onClick={writeData}>Escribir valor</button>
					<button onClick={readData}>Leer valor</button>
					<button onClick={checkStatus}>Checar puerto</button>
					<button onClick={closeSerialPort}>Cerrar puerto</button>
				</>
			)}
		</div>
	);
};

export default SerialPort;
