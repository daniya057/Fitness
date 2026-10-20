import { useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import { takePendingInvite } from "./invite";

export function PendingInvite() {
  const { user, requestFriend } = useAuth();
  const sent = useRef("");

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }
    const id = takePendingInvite();
    if (!id || id === user.id || sent.current === id) {
      return undefined;
    }
    sent.current = id;
    requestFriend(id).catch(() => {});
    return undefined;
  }, [user, requestFriend]);

  return null;
}
