import React from "react";
import { createRoot } from "react-dom/client";

function Popup() {
  return (
    <div className="font-sans text-sm text-gray-800">
      <h1 className="text-lg font-semibold mb-2 text-indigo-600">🧠 Smart Buy AI</h1>
      <p className="text-gray-600 mb-3">
        Analyze prices, reviews & competitors in real time.
      </p>
      <button
        id="analyze"
        className="bg-indigo-500 text-white px-3 py-1 rounded-md hover:bg-indigo-600"
      >
        Scan this Product
      </button>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Popup />);
