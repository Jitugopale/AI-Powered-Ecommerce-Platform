"use client";
import Login from "@/components/auth/Login";
import SignUp from "@/components/auth/SignUp";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("signup");

  return (
    <>
      <div className="min-h-screen p-5">
        <div className="max-w-4xl mx-auto my-32">
          <div className="m-5">
            <div className="flex">
              <div
                className={`flex-1 text-center p-3 ${activeTab === "signup" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                onClick={() => setActiveTab("signup")}
              >
                SignUp
              </div>
              <div
                className={`flex-1 text-center p-3 ${activeTab === "login" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                onClick={() => setActiveTab("login")}
              >
                Login
              </div>
            </div>

            {activeTab === "signup" ? <><SignUp/></> : <><Login/></>}
          </div>
        </div>
      </div>
    </>
  );
}
