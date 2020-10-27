import { render, screen } from "@testing-library/react";
import "./store/ThemeStore.matchMedia.mock";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";

const renderWithRouter = (ui, { route = "/" } = {}) => {
  window.history.pushState({}, "Dummy page", route);

  return render(ui, { wrapper: BrowserRouter });
};

test("redirect to 404 page", () => {
  renderWithRouter(<App />, { route: "/doesnt_exist" });

  expect(screen.getByText(/not found/i)).toBeInTheDocument();
});
