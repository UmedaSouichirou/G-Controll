
import { useEffect, useState, useRef } from "react";

function StatusLamp({ on }) {
  return (
    <svg width="20" height="20" className="mr-2">
      <circle
        cx="10"
        cy="10"
        r="8"
        fill={on ? "#00ff66" : "#aa0000"}
        style={{
          filter: on ? "drop-shadow(0 0 6px #00ff66)" : "none",
          transition: "all 0.3s ease-in-out",
        }}
        className={on ? "animate-glow" : ""}
      />
    </svg>
  );
}

function UnitCard({ name, nodes, onToggle }) {
  return (
    <div className="w-full max-w-sm bg-black bg-opacity-80 text-white border border-cyan-500 rounded-xl shadow-xl p-6 backdrop-blur-md">
      <h2 className="text-xl font-bold text-center text-cyan-300 border-b border-cyan-500 pb-2 mb-4">
        {name}
      </h2>
      <div className="space-y-4">
        {Object.entries(nodes).map(([label, info]) => (
          <div key={label}>
            <div className="text-sm text-cyan-100 mb-1">{label}</div>
            <div className="flex justify-between items-center text-lg">
              {info.type === "bool" ? (
                <>
                  <div className="flex items-center">
                    <StatusLamp on={info.value} />
                    <span className="text-white font-mono">{info.value ? "ON" : "OFF"}</span>
                  </div>
                  <button
                    onClick={() => onToggle(name, label, !info.value)}
                    className="bg-cyan-700 hover:bg-cyan-500 text-white px-3 py-1 rounded-md text-xs"
                  >
                    {info.value ? "DEACTIVATE" : "ACTIVATE"}
                  </button>
                </>
              ) : (
                <span className="text-cyan-200 font-mono">{info.value}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [units, setUnits] = useState([]);
  const [data, setData] = useState({});
  const [seedMode, setSeedMode] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/units")
      .then((res) => res.json())
      .then(setUnits);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      units.forEach((unit) => {
        fetch(`http://127.0.0.1:5000/api/${unit}`)
          .then((res) => res.json())
          .then((unitData) => {
            setData((prev) => ({ ...prev, [unit]: unitData }));
          });
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [units]);

  const toggleBool = (unit, node, value) => {
    fetch(`http://127.0.0.1:5000/api/${unit}/${node}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    }).then(() => {
      setData((prev) => ({
        ...prev,
        [unit]: {
          ...prev[unit],
          [node]: { ...prev[unit][node], value },
        },
      }));
    });
  };

  const toggleSeedMode = () => {
    setSeedMode((prev) => {
      const next = !prev;
      setTimeout(() => {
        if (audioRef.current) {
          if (next) {
            audioRef.current.muted = false;
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((e) => {
              console.warn("BGM再生エラー:", e.message);
            });
          } else {
            audioRef.current.pause();
          }
        }
      }, 0);
      return next;
    });
  };

  return (
    <div
      style={{
        backgroundImage: `url(${seedMode ? "/bg_grid_on.png" : "/spaceship.png"})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="min-h-screen p-6 transition-all duration-1000"
    >
      <button
        onClick={toggleSeedMode}
        className="fixed top-4 right-4 bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-2 rounded-xl shadow-lg font-bold z-50 border-2 border-white"
      >
        {seedMode ? "SEED MODE OFF" : "SEED MODE ON"}
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center mt-24">
        {units.map((unit) => (
          <UnitCard key={unit} name={unit} nodes={data[unit] || {}} onToggle={toggleBool} />
        ))}
      </div>

      <audio ref={audioRef} src="/bgm.mp3" preload="auto" muted />
    </div>
  );
}
