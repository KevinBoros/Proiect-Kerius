import React, { useState, useEffect } from "react";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const [profesori, setProfesori] = useState([]);
  const [cerere, setCerere] = useState(null);
  const [selectedProfesor, setSelectedProfesor] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mesajEroare, setMesajEroare] = useState("");
  const [mesajSucces, setMesajSucces] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const cerereResponse = await fetch(
          "http://localhost:3001/api/cereri/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        let cerereData = null;
        if (cerereResponse.ok) {
          cerereData = await cerereResponse.json();
        } else if (cerereResponse.status === 404) {
          cerereData = null;
        } else {
          throw new Error("Eroare la preluarea cererii studentului!");
        }

        let profesoriData = [];
        if (!cerereData || cerereData.status === "rejected") {
          const profResponse = await fetch(
            "http://localhost:3001/api/professors",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!profResponse.ok) {
            throw new Error("Eroare la preluarea profesorilor!");
          }
          profesoriData = await profResponse.json();
        }

        setCerere(cerereData);
        setProfesori(profesoriData);
      } catch (err) {
        setMesajEroare(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmitCerere = async () => {
    setMesajEroare("");
    setMesajSucces("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/api/cereri", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profesorId: selectedProfesor }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Eroare la trimiterea cererii.");
      }

      setCerere(data);
      setMesajSucces("Cerere trimisă. Așteptați aprobarea.");
    } catch (error) {
      setMesajEroare(error.message);
    }
  };

  const handleUploadFile = async () => {
    if (!cerere) return;

    setMesajEroare("");
    setMesajSucces("");

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `http://localhost:3001/api/cereri/${cerere.id}/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Eroare la încărcarea fișierului.");
      }

      setCerere(data.cerere);
      setMesajSucces("Fișier încărcat cu succes.");
    } catch (error) {
      setMesajEroare(error.message);
    }
  };

  if (loading) {
    return <p className="loading">Se încarcă...</p>;
  }

  return (
    <div className="dashboard-container">
      <h1>Student Dashboard</h1>

      {mesajEroare && <p className="error-message">{mesajEroare}</p>}
      {mesajSucces && <p className="success-message">{mesajSucces}</p>}

      {!cerere || cerere.status === "rejected" ? (
        <div className="cerere-container">
          {cerere && cerere.status === "rejected" && (
            <div className="rejected-message">
              Cererea anterioară a fost respinsă
              {cerere.justificareRespins
                ? ` (Motiv: ${cerere.justificareRespins}).`
                : "."}
            </div>
          )}

          <h2>Selectați un profesor:</h2>
          <select
            value={selectedProfesor}
            onChange={(e) => setSelectedProfesor(e.target.value)}
          >
            <option value="">--Selectați profesor--</option>
            {profesori.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.firstName} {prof.lastName} (Max: {prof.maxStudents})
              </option>
            ))}
          </select>
          <button
            className="submit-button"
            onClick={handleSubmitCerere}
            disabled={!selectedProfesor}
          >
            Trimite cererea
          </button>
        </div>
      ) : cerere.status === "approved" ? (
        <div className="approved-container">
          <h2>Cererea dvs. a fost aprobată!</h2>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            accept=".pdf,.docx"
          />
          <button className="upload-button" onClick={handleUploadFile}>
            Încărcați fișierul
          </button>
        </div>
      ) : cerere.status === "finalizat" ? (
        <div className="finalizat-container">
          <h2>Documentul final a fost încărcat de profesor.</h2>
          <p>Puteți descărca documentul final aici:</p>
          <a
            className="download-link"
            href={`http://localhost:3001/${cerere.profFilePath}`}
            download
          >
            Descarcă documentul final
          </a>
        </div>
      ) : (
        <div className="pending-container">
          <h2>Cerere trimisă</h2>
          <p>Se așteaptă răspunsul profesorului...</p>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
