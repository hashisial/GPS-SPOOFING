import { useDispatch, useSelector } from "react-redux";
import { selectTheme } from "../app/store/index.js";
import { setTheme as setThemeAction, toggleTheme as toggleThemeAction } from "../app/store/slices/uiSlice.js";

export function useTheme() {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);

  return {
    theme,
    setTheme(nextTheme) {
      dispatch(setThemeAction(nextTheme));
    },
    toggleTheme() {
      dispatch(toggleThemeAction());
    }
  };
}
