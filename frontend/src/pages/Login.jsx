import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const login = async () => {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCred.user.getIdToken();
    console.log("Login token:", token);

    await fetch("http://localhost:3000/protected", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };

  return (
    <div className="flex flex-col border justify-center h-screen items-center gap-6">
      <input
        type="email"
        placeholder="email"
        className="p-3 text-xl border"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="password"
        className="p-3 text-xl border"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="bg-blue-600 text-white p-4" onClick={login}>
        Login
      </button>
    </div>
  );
}

export default Login;
