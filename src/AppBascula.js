import logo from "./logo.svg";
import "./App.css";
import SerialPort from "./components/SerialPort";

function App() {
	return (
		<div className='App'>
			<header className='App-header'>
				<img src={logo} className='App-logo' alt='logo' />
				<p>Prueba de API Web Serial</p>
				<SerialPort />
			</header>
		</div>
	);
}

export default App;
