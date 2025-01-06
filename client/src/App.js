import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from "react";
// Componenta principală
function App() {
  const [user, setUser] = useState(null);
  // user = { id: number, role: "student" | "profesor" }

  // Funcție apelată după "login"
  const handleLogin = async (role, id) => {
    try {
      const endpoint = role === "student" ? `/api/students/${id}` : `/api/professors/${id}`;
      const res = await fetch(endpoint);
      if (!res.ok) {
        alert("ID invalid! Nu există acest utilizator.");
        return;
      }
      setUser({ role, id: Number(id) });
    } catch (err) {
      console.error(err);
      alert("Eroare la validarea ID-ului.");
    }
  };
  

  // Funcție de "logout" simplu
  const handleLogout = () => {
    setUser(null);
  };

  // Dacă încă nu avem user logat, arătăm formularul
  if (!user) {
    return (
      <div style={{ margin: "2rem" }}>
        <h2>Fake Login</h2>
        <LoginForm onLogin={handleLogin} />
      </div>
    );
  }

  // Dacă avem user logat, afișăm UI diferit pentru student / profesor
  return (
    <div style={{ margin: "2rem" }}>
      <button onClick={handleLogout}>Logout</button>
      {user.role === "student" ? (
        <StudentView user={user} />
      ) : (
        <ProfesorView user={user} />
      )}
    </div>
  );
}

// --------------------------------------------------
// Formularul de login: alege rol + ID
function LoginForm({ onLogin }) {
  const [role, setRole] = useState("student");
  const [id, setId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!id) {
      alert("Te rog introdu un ID numeric!");
      return;
    }
    onLogin(role, id);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", width: "250px" }}>
      <label>
        Rol:
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="profesor">Profesor</option>
        </select>
      </label>

      <label>
        ID:
        <input
          type="number"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="Ex: 1, 2..."
        />
      </label>

      <button type="submit">Login</button>
    </form>
  );
}

// --------------------------------------------------
// Componeta StudentView: acțiunile pe care le face studentul


function StudentView({ user }) {
  const [cereri, setCereri] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [professorsFetched, setProfessorsFetched] = useState(false);

  // 1. Încarcă cererile imediat
  useEffect(() => {
    loadCererileStudentului();
    // eslint-disable-next-line
  }, []);

  // --- Fetch cereri
  const loadCererileStudentului = async () => {
    try {
      const res = await fetch(`/api/cereri?studentId=${user.id}`);
      const data = await res.json();
      setCereri(data);
    } catch (err) {
      console.error(err);
      alert("Eroare la încărcarea cererilor studentului.");
    }
  };

  // Verific dacă e deja aprobat
  const cerereApproved = cereri.find(c => c.status === "approved");
  const isApproved = !!cerereApproved; // true dacă avem cerereApproved

  // 2. Daca e aprobat => Afișez direct alt ecran
  if (isApproved) {
    return <ApprovedScreen cerere={cerereApproved} onRefresh={loadCererileStudentului} />;
  }

  // 3. Altfel, ecran normal (nu e aprobat)
  return (
    <div>
      <h2>Bun venit, Student #{user.id}</h2>

      {/* Buton "Cererile Mele" */}
      <button onClick={loadCererileStudentului}>Cererile Mele</button>
      <CererileMele cereri={cereri} />

      <hr />

      {/* Listare Profesori */}
      <button onClick={handleListProfessors}>Listare Profesori</button>
      {professorsFetched && professors.length === 0 && (
        <p>Niciun profesor disponibil sau nu a fost găsit!</p>
      )}
      <ul>
        {professors.map((prof) => {
          // Vezi dacă există deja o cerere pt acest prof
          const existing = cereri.find(c => c.profesorId === prof.id && c.status !== 'invalid');
          if (existing) {
            // Avem deja cerere (pending, respinsa, approved -> deși approved n-ar ajunge aici)
            return (
              <li key={prof.id}>
                {prof.firstName} {prof.lastName} (ID={prof.id}) - 
                <button disabled>Deja există o cerere</button>
              </li>
            );
          } else {
            // Nu există cerere la acest profesor => putem trimite
            return (
              <li key={prof.id}>
                {prof.firstName} {prof.lastName} (ID={prof.id})
                <button onClick={() => handleSendCerere(prof.id)}>Trimite Cerere</button>
              </li>
            );
          }
        })}
      </ul>
    </div>
  );

  // ---- Funcții interne: handleListProfessors, handleSendCerere, etc.
  async function handleListProfessors() {
    try {
      const res = await fetch("/api/professors");
      if (!res.ok) {
        alert("Eroare la listare profesori!");
        return;
      }
      const data = await res.json();
      setProfessors(data);
      setProfessorsFetched(true);
    } catch (err) {
      console.error(err);
      alert("Eroare la conexiune.");
    }
  }

  async function handleSendCerere(profId) {
    try {
      const res = await fetch("/api/cereri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          profesorId: profId,
          status: "pending"
        })
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error) alert(data.error);
        else alert("Eroare necunoscuta la trimitere cerere");
        return;
      }

      alert("Cererea a fost trimisă cu succes.");
      loadCererileStudentului();
    } catch (err) {
      console.error(err);
      alert("Eroare la trimiterea cererii.");
    }
  }
}

// === Sub-componenta: Afișăm cererile studentului (altele decât "approved")
function CererileMele({ cereri }) {
  const relevantC = cereri.filter(c => c.status !== "invalid" && c.status !== "approved");

  if (relevantC.length === 0) {
    return <p>Nu există cereri (sau toate sunt invalide / aprobare finală).</p>;
  }

  return (
    <ul>
      {relevantC.map((c) => (
        <li key={c.id}>
          Cerere #{c.id}, status: {c.status}, profesorId: {c.profesorId} 
          {c.status === 'rejected' && (
            <span style={{ color: 'red' }}>
              {` (Justificare respins: ${c.justificareRespins || 'N/A'})`}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}


// === Sub-componenta: Ecran "Approved"
function ApprovedScreen({ cerere, onRefresh }) {
  // Upload fisier
  const handleUploadFile = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("file", e.target.file.files[0]);
    try {
      const res = await fetch(`/api/cereri/${cerere.id}/upload`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error) alert(data.error);
        else alert("Eroare la upload fisier");
        return;
      }
      alert("Fișier trimis cu succes!");
      onRefresh && onRefresh(); 
    } catch (err) {
      console.error(err);
      alert("Eroare la upload fisier");
    }
  };

  return (
    <div>
      <h2>Felicitări! Ai fost aprobat</h2>
      <p>CerereId: {cerere.id}, ProfesorId: {cerere.profesorId}</p>

      {cerere.filePath ? (
        <p>Fișier trimis: <strong>{cerere.originalFileName || "???"}</strong></p>
      ) : (
        <p>Nu ai încărcat încă niciun fișier.</p>
      )}

      <form onSubmit={handleUploadFile}>
        <input type="file" name="file" />
        <button type="submit">
          {cerere.filePath ? "Înlocuiește fișierul" : "Încarcă fișier"}
        </button>
      </form>
    </div>
  );
}


// --------------------------------------------------
// Componenta ProfesorView: acțiunile profesorului
function ProfesorView({ user }) {
  const [cereri, setCereri] = useState([]);
  const [limitReached, setLimitReached] = useState(false); // optional, să știm local

  const loadCereri = async () => {
    try {
      const res = await fetch(`/api/cereri?profesorId=${user.id}`);
      const data = await res.json();
      setCereri(data);
    } catch (err) {
      console.error(err);
      alert("Eroare la listare cereri");
    }
  };

  // la mount
  useEffect(() => {
    loadCereri();
  }, []);

  // Aprobare
  const handleAproba = async (cerereId) => {
    try {
      const res = await fetch(`/api/cereri/${cerereId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error) {
          alert(data.error);
          // ex: "Profesorul a atins deja limita"
          if (data.error.includes("limita")) {
            setLimitReached(true);
          }
        } else alert("Eroare necunoscuta la aprobare");
        return;
      }
      alert("Cerere aprobată!");
      loadCereri();
    } catch (err) {
      console.error(err);
      alert("Eroare la aprobarea cererii");
    }
  };

  // Respingere cu prompt la motiv
  const handleRespinge = async (cerereId) => {
    const justificare = prompt("Introdu un motiv de respingere:", "Document incomplet");
    if (!justificare) return; // a apasat Cancel

    try {
      const res = await fetch(`/api/cereri/${cerereId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          justificareRespins: justificare
        })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error) alert(data.error);
        else alert("Eroare necunoscuta la respingere");
        return;
      }
      alert("Cerere respinsă!");
      loadCereri();
    } catch (err) {
      console.error(err);
      alert("Eroare la respingerea cererii");
    }
  };

  // Filtrare / Randare
  return (
    <div>
      <h2>Bun venit, Profesor #{user.id}</h2>
      <button onClick={loadCereri}>Reîmprospătare cereri</button>
      {limitReached && <p style={{color:'red'}}>Ați atins limita de studenți aprobați!</p>}
      <ul>
      {cereri.map(c => {
        // ...
        const downloadLink = c.filePath
          ? `http://localhost:3000/${c.filePath.replace('\\','/')}`
          : null;
  
        return ( 
          <li key={c.id}>
            Cerere #{c.id}, Student: {c.studentId}, status: {c.status}, 
            Justificare: {c.justificareRespins || '-'}
      
            {/* Daca studentul a trimis fisier => apare un buton/link de descarcare */}
            {c.filePath && (
              <a
              href={`http://localhost:3000/${c.filePath}`} 
              download={c.originalFileName || "fisier"}
               >
                Descarcă fișier student
              </a>
            )}
      
            {/* Butoane DOAR daca e pending/resubmit */}
            {["pending","resubmit"].includes(c.status) && (
              <>
                <button onClick={() => handleAproba(c.id)}>Aprobă</button>
                <button onClick={() => handleRespinge(c.id)}>Respinge</button>
              </>
            )}
          </li>
         )
      })}
      </ul>
    </div>
  );
}


// --------------------------------------------------
export default App;