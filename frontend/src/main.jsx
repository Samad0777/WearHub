import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { Provider } from "react-redux";
import { store } from "./app/store";
import App from "./App";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <App/>
    </Provider>
    <TanStackDevtools />
  </QueryClientProvider>,
);
