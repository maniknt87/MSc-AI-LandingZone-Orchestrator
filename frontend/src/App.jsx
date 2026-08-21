import { useState } from "react";

import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";

function App() {

  const [user, setUser] = useState(null);

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {

    return (
      <Login
        onLogin={(authenticatedUser) => {
          setUser(authenticatedUser);
        }}
      />
    );

  }

  return (
    <MainLayout
      user={user}
      onLogout={handleLogout}
    />
  );

}

export default App;