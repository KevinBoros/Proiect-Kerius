// client/src/components/ProfesorDashboard.js
import React, { useState, useEffect } from "react";
import "./ProfesorDashboard.css"; // Importă fișierul CSS izolat

const ProfesorDashboard = () => {
  const [cereri, setCereri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [mesajEroare, setMesajEroare] = useState("");
  const [mesajSucces, setMesajSucces] = useState("");

  useEffect(() => {
    const fetchCereri = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const profesorId = localStorage.getItem("profesorId");

        const response = await fetch(
          `http://localhost:3001/api/cereri?profesorId=${profesorId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error("Eroare la preluarea cererilor");
        }
        const data = await response.json();
        setCereri(data);
      } catch (err) {
        setMesajEroare(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCereri();
  }, []);

  const handleApprove = async (id) => {
    setMesajEroare("");
    setMesajSucces("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001/api/cereri/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "approved" }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Eroare la aprobarea cererii");
      }

      setCereri((prev) => prev.filter((c) => c.id !== id));
      setMesajSucces("Cererea a fost aprobată.");
    } catch (error) {
      setMesajEroare(error.message);
    }
  };

  const handleReject = async (id) => {
    const justificare = prompt(
      "Introduceți motivul respingerii (sau lăsați gol dacă nu e cazul):",
      ""
    );

    setMesajEroare("");
    setMesajSucces("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001/api/cereri/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "rejected",
          justificareRespins: justificare,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Eroare la respingerea cererii");
      }

      setCereri((prev) => prev.filter((c) => c.id !== id));
      setMesajSucces("Cererea a fost respinsă.");
    } catch (error) {
      setMesajEroare(error.message);
    }
  };

  const handleUploadProfesor = async (cerereId) => {
    setMesajEroare("");
    setMesajSucces("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `http://localhost:3001/api/cereri/${cerereId}/upload-profesor`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Eroare la upload-ul fișierului final.");
      }

      setCereri((prev) => prev.filter((c) => c.id !== cerereId));
      setMesajSucces("Fișier final trimis către student.");
    } catch (error) {
      setMesajEroare(error.message);
    }
  };

  if (loading) {
    return <p className="profesor-loading">Se încarcă...</p>;
  }

  return (
    <div className="profesor-dashboard-container">
      <h1>Profesor Dashboard</h1>

      {mesajEroare && <p className="profesor-error-message">{mesajEroare}</p>}
      {mesajSucces && <p className="profesor-success-message">{mesajSucces}</p>}

      {cereri.length === 0 ? (
        <p className="profesor-no-requests">Nu există cereri pentru dumneavoastră.</p>
      ) : (
        <div className="profesor-cereri-container">
          {cereri.map((c) => (
            <div key={c.id} className="profesor-cerere-card">
            <p><strong>Student:</strong> {c.Student && `${c.Student.firstName} ${c.Student.lastName}`}</p>
            <p><strong>Status:</strong> {c.status}</p>

              {c.status === "pending" && (
                <div className="profesor-buttons-container">
                  <button
                    className="profesor-approve-button"
                    onClick={() => handleApprove(c.id)}
                  >
                    Aprobă
                  </button>
                  <button
                    className="profesor-reject-button"
                    onClick={() => handleReject(c.id)}
                  >
                    Respinge
                  </button>
                </div>
              )}

              {c.status === "approved" && c.filePath && (
                <div className="profesor-file-container">
                  <p>
                    <strong>Fișier trimis de student:</strong>{" "}
                    <a className ="link"
                      href={`http://localhost:3001/${c.filePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Descarcă
                    </a>
                  </p>
                  <input
                    type="file"
                    className="profesor-file-input"
                    onChange={(e) => setFile(e.target.files[0])}
                    accept=".pdf,.docx"
                  />
                  <button
                    className="profesor-upload-button"
                    onClick={() => handleUploadProfesor(c.id)}
                  >
                    Trimite fișier final
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfesorDashboard;
