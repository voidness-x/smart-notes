"use client";

import { Button } from "./button";
import { useRouter } from "next/navigation";

function LogOutButton() {
  const router = useRouter();

  const handleLogOut = () => {
    // Redirect to logout page which will handle the logout action
    router.push("/logout");
  };

  return (
    <Button
      variant="outline"
      onClick={handleLogOut}
      className="w-24"
    >
      Log Out
    </Button>
  );
}

export default LogOutButton;
