import { useEffect } from "react";
import { PlanningCanvas } from "./components/canvas/PlanningCanvas";
import { AppShell } from "./components/layout/AppShell";
import { useProjectStore } from "./state/projectStore";

function App() {
  const loadInitialProject = useProjectStore((state) => state.loadInitialProject);

  useEffect(() => {
    void loadInitialProject();
  }, [loadInitialProject]);

  return (
    <AppShell>
      <PlanningCanvas />
    </AppShell>
  );
}

export default App;
