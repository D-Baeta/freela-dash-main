import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ensureAuthPersistence } from "./services/firebase-config";

// Ensure auth persistence is configured before mounting the app to avoid
// race conditions where Firebase hasn't restored the session yet.
(async () => {
	try {
		await ensureAuthPersistence();
	} catch (err) {
		// If persistence can't be set it's non-fatal; continue mounting the app.
		console.warn("Error ensuring auth persistence:", err);
	}

	createRoot(document.getElementById("root")!).render(<App />);
})();
