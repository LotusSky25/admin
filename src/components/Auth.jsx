import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { doc, setDoc, getDocs, collection, query, where } from "firebase/firestore"
import { db } from "../../firebase";

export default function Auth(props) {
  const { handleCloseModal } = props;
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("")
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [formError, setFormError] = useState("");

  const { signUp, login } = useAuth();

  async function handleAuthentication() {
    if (!email || !password) {
      setFormError("Form incomplete. Please fill out all fields.");
      return;
    }
    if (!email.includes("@")) {
      setFormError(
        "Invalid email. Please ensure the email address you have entered is valid.",
      );
      return;
    }
    if (password.length < 6) {
      setFormError(
        "Password too weak. Please ensure your password is at least six characters long.",
      );
      return;
    }
    try {
      setIsAuthenticating(true);
      if (isRegistering) {
        const credential = await signUp(email, password);
        await checkCode(code, credential.user.uid);
      } else {
        await login(email, password);
        handleCloseModal();
      }
    } catch (err) {
      console.log(err.message);
      setFormError(
        "Incorrect email or password.",
      );
    } finally {
      setIsAuthenticating(false);
    }
  }

    async function checkCode(ncode, userId) {
        const normalizedCode = ncode.trim();
        if (!normalizedCode) {
          setFormError("Please enter a church access code.");
          return;
        }

        const codeQuery = query(
          collection(db, "churches"),
          where("code", "==", normalizedCode),
        );
        const querySnapshot = await getDocs(codeQuery);

        if (querySnapshot.empty) {
          setFormError("Invalid code.");
          return;
        }
        await associateUser(normalizedCode, userId);
    }

    async function associateUser(code, userId) {
      const docRef = doc(db, "users", userId)
      await setDoc(docRef, {
          code: code
      }, {merge: true})
      handleCloseModal()
    }

  return (
    <>
      <h2>{isRegistering ? "Sign Up" : "Login"}</h2>
      {formError != "" && (
        <div class="error">
          <p>❌ {formError}</p>
        </div>
      )}
      <p>{isRegistering ? "Create an account" : "Login to your account"}</p>
      <input
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
        }}
        placeholder="Email"
      />
      <input
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
        }}
        placeholder="Password"
        type="password"
      />
      {isRegistering &&(
        <input 
          value={code}
          onChange={(e)=> {
            setCode(e.target.value);
          }}
          placeholder="Church Access Code"
          type="password"
        />
      )}
      <button class="auth-buttons" onClick={handleAuthentication}>
        {isAuthenticating ? "Authenticating..." : "Submit"}
      </button>
      <hr />
      <p>
        {isRegistering ? "Already have an account?" : "Don't have an account?"}
      </p>
      <button class="auth-buttons"
        onClick={() => {
          setIsRegistering(!isRegistering);
        }}
      >
        {isRegistering ? "Login" : "Sign Up"}
      </button>
    </>
  );
}
