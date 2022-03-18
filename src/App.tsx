import { useMachine } from "@xstate/react";
import * as stopwatch from "./stopwatch.machine";

function App() {
  // consume the machine in react
  const [state, send] = useMachine(stopwatch.machine);

  // create an api surface for the machine
  const api = stopwatch.connect(state, send);

  // render your UI
  return (
    <div className="frame">
      <div className="fixed">
        <p className="display">{api.value}</p>
        <div role="group" className="button-group">
          <button className="button variant=gray" onClick={api.lap}>
            Lap
          </button>
          <button className="button variant=gray" onClick={api.reset}>
            Reset
          </button>
          <button className="button variant=green" onClick={api.start}>
            Start
          </button>
          <button className="button variant=red" onClick={api.pause}>
            Pause
          </button>
        </div>
      </div>
      <ul className="laps">
        {api.laps.map((lap, index) => (
          <li key={index}>{lap}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
