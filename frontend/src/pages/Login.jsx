import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCred.user.getIdToken();
      console.log("Login token:", token);

      await fetch("http://localhost:3000/protected", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate("/"); // redirect to homepage or dashboard
    } catch (err) {
      console.error("Login failed:", err);
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Login to Your Account
        </h2>

        {error && (
          <div className="text-red-600 text-sm mb-4 text-center">{error}</div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          onClick={login}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition duration-150"
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default Login;
