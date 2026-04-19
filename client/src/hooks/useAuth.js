import { useSelector } from "react-redux";
import { selectAuthState } from "../app/store/index.js";

export function useAuth() {
  const authState = useSelector(selectAuthState);

  return {
    ...authState,
    token: authState.accessToken
  };
}
