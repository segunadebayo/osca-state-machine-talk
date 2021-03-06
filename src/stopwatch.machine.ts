import {
  AnyEventObject,
  assign,
  createMachine,
  Sender,
  StateFrom,
} from "xstate";

/* -----------------------------------------------------------------------------
 * Types
 * -----------------------------------------------------------------------------*/

export type Context = {
  value: number;
  valueAsString: string;
  laps: number[];
  formattedLaps: string[];
};

/* -----------------------------------------------------------------------------
 * Utilities
 * -----------------------------------------------------------------------------*/

const utils = {
  increment(context: Context) {
    const date = new Date();
    const value = context.value + 1_000;
    date.setTime(value);
    return { date, value };
  },
  format(date: Date) {
    return date.toISOString().substring(11, 19);
  },
  formatLap(value: number, index: number, arr: number[]) {
    const date = new Date();
    date.setTime(value);
    return `Lap ${index + 1}: ${utils.format(date)}`;
  },
  formatLaps(laps: number[]) {
    return laps.map(utils.formatLap).reverse();
  },
  remainder(context: Context) {
    const sum = context.laps.reduce((total, lap) => total + lap, 0);
    return context.value - sum;
  },
};

/* -----------------------------------------------------------------------------
 * State machine
 * -----------------------------------------------------------------------------*/

export const machine = createMachine({
  id: "stopwatch",

  context: {
    value: 0,
    valueAsString: "00:00:00",
    laps: [],
    formattedLaps: [],
  } as Context,

  initial: "idle",

  states: {
    idle: {
      on: {
        START: {
          target: "ticking",
          actions: ["recordLap"],
        },
      },
    },

    ticking: {
      invoke: { src: "ticking" },
      on: {
        TICK: {
          actions: ["tick"],
        },
        LAP: {
          actions: ["recordLap"],
        },
        PAUSE: {
          target: "paused",
        },
      },
    },

    paused: {
      on: {
        RESET: {
          target: "idle",
          actions: ["clearValue", "clearLap"],
        },
        START: {
          target: "ticking",
        },
      },
    },
  },
}).withConfig({
  services: {
    ticking: () => (send) => {
      const id = setInterval(() => {
        send("TICK");
      }, 1_000 / 60);
      return () => {
        clearInterval(id);
      };
    },
  },
  actions: {
    clearLap: assign({ laps: [] as number[], formattedLaps: [] as string[] }),
    clearValue: assign({ value: 0, valueAsString: "00:00:00" }),

    recordLap: assign((context) => {
      const remainder = utils.remainder(context);
      const laps = context.laps.concat(remainder);
      return { laps, formattedLaps: utils.formatLaps(laps) };
    }),

    tick: assign((context) => {
      const { date, value } = utils.increment(context);
      const laps = context.laps.slice();

      const isFirstLap = laps.length === 1;
      laps[laps.length - 1] = isFirstLap ? value : utils.remainder(context);

      return {
        value,
        valueAsString: utils.format(date),
        laps,
        formattedLaps: utils.formatLaps(laps),
      };
    }),
  },
});

/* -----------------------------------------------------------------------------
 * Connector or Adapter
 * -----------------------------------------------------------------------------*/

export function connect(
  state: StateFrom<typeof machine>,
  send: Sender<AnyEventObject>
) {
  const isIdle = state.matches("idle");
  const isTicking = state.matches("ticking");
  const isPaused = state.matches("paused");

  return {
    // state values
    value: state.context.valueAsString,
    laps: state.context.formattedLaps,

    // state boolean flags
    isIdle,
    isTicking,
    isPaused,

    // render states
    showLap: isIdle || isTicking,
    showReset: isPaused,
    showStart: isIdle || isPaused,
    showPause: isTicking,

    // callbacks
    start() {
      send("START");
    },
    pause() {
      send("PAUSE");
    },
    reset() {
      send("RESET");
    },
    lap() {
      send("LAP");
    },
  };
}
