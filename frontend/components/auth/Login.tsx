import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:4000/api/auth/login",
        { email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      setResponse(res.data);
      setMessage(res.data.message)
      console.log("res", res);
      console.log("resData", res.data);
      setTimeout(()=>{
        router.push("/dashboard");
      },2000)
      
    } catch (error) {
      console.error(error);
      setMessage("Failed to Sign In");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="py-7">
      <h1 className="text-4xl font-semibold mb-2">Login Your Account</h1>
      <p>Login to continue on our ecommerce platform</p>

      <form className="my-9">
        {message && <p className="text-blue-600">{message}</p>}
        <div className="flex flex-col mb-4">
          <label className="mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e)=>{setEmail(e.target.value)}}
            className="outline-none border-b border-gray-300"
            placeholder="johndoe123@gmail.com"
          />
        </div>
        <div className="flex flex-col mb-4">
          <label className="mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="outline-none border-b border-gray-300"
            placeholder="********"
          />
        </div>

        <div className="mt-10">
          <button
            className="border border-gray-500 bg-blue-400 w-full p-2 rounded-lg cursor-pointer"
            disabled={loading}
            onClick={handleLogin}
          >
            {loading ? "Signing..." : "Sign In"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
